import {execFile} from 'node:child_process'
import {createWriteStream} from 'node:fs'
import {mkdtemp, readFile, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {promisify} from 'node:util'

const execFileAsync = promisify(execFile)

// ffmpeg-static's own exported binary path breaks once this code is bundled
// by Next.js for the serverless function (its path resolution assumes the
// original node_modules layout, which the bundle doesn't preserve). Resolving
// it ourselves, relative to the process's own root, works in both the bundled
// route and the plain backfill script. next.config.ts's
// `outputFileTracingIncludes` is what makes sure the binary itself ships.
function resolveFfmpegPath() {
  return path.join(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg')
}

async function downloadVideo(videoUrl, destPath) {
  const response = await fetch(videoUrl)
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download video (${response.status}): ${videoUrl}`)
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destPath))
}

async function extractFirstFrame(videoPath, framePath) {
  await execFileAsync(resolveFfmpegPath(), [
    '-y',
    '-i',
    videoPath,
    '-vf',
    "select=eq(n\\,0),scale='min(1600,iw)':-2",
    '-vframes',
    '1',
    '-q:v',
    '4',
    framePath,
  ])
}

// One video -> one generated+uploaded+patched poster. `posterPath`/
// `sourceIdPath` are Sanity JSONMatch patch paths, e.g. 'coverMedia.poster' /
// 'coverMedia.posterSourceAssetId', or 'slides[_key=="xyz"].leftColumn.poster'.
export async function generateAndPatchPoster({writeClient, docId, videoUrl, videoAssetId, posterPath, sourceIdPath}) {
  const workDir = await mkdtemp(path.join(tmpdir(), 'poster-'))
  const videoPath = path.join(workDir, 'source.mp4')
  const framePath = path.join(workDir, 'frame.jpg')

  try {
    await downloadVideo(videoUrl, videoPath)
    await extractFirstFrame(videoPath, framePath)

    const imageBuffer = await readFile(framePath)
    const asset = await writeClient.assets.upload('image', imageBuffer, {filename: 'poster.jpg'})

    await writeClient
      .patch(docId)
      .set({
        [posterPath]: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
        [sourceIdPath]: videoAssetId,
      })
      .commit()
  } finally {
    await rm(workDir, {recursive: true, force: true})
  }
}

function needsPoster(media) {
  return (
    media?.mediaType === 'video' &&
    !!media.video?.asset?.url &&
    !!media.video?.asset?._id &&
    (!media.poster || media.posterSourceAssetId !== media.video.asset._id)
  )
}

// Walks one fetched project document (see projectPosterInputByIdQuery /
// allProjectsPosterInputQuery in src/sanity/lib/queries.ts for the expected
// shape) and returns a poster-generation job for every video that's missing
// a poster or whose poster was generated from a since-replaced video file.
export function collectPosterJobs(project) {
  const jobs = []

  const push = (media, pathPrefix) => {
    if (!needsPoster(media)) return
    jobs.push({
      docId: project._id,
      videoUrl: media.video.asset.url,
      videoAssetId: media.video.asset._id,
      posterPath: `${pathPrefix}.poster`,
      sourceIdPath: `${pathPrefix}.posterSourceAssetId`,
    })
  }

  push(project.coverMedia, 'coverMedia')

  for (const slide of project.slides ?? []) {
    if (!slide._key) continue
    const slidePath = `slides[_key=="${slide._key}"]`
    push(slide, slidePath)
    if (slide.leftColumn) push(slide.leftColumn, `${slidePath}.leftColumn`)
    if (slide.rightColumn) push(slide.rightColumn, `${slidePath}.rightColumn`)
  }

  return jobs
}

// Runs every poster job for one project document, one at a time. A single
// failing video (bad encode, ffmpeg crash, upload error) is logged and
// skipped rather than aborting the rest — see callers for why.
export async function generatePostersForProject({writeClient, project}) {
  const jobs = collectPosterJobs(project)
  const results = []

  for (const job of jobs) {
    try {
      await generateAndPatchPoster({writeClient, ...job})
      results.push({...job, ok: true})
    } catch (error) {
      console.error(`poster generation failed: ${job.docId} ${job.posterPath}`, error)
      results.push({...job, ok: false, error: error instanceof Error ? error.message : String(error)})
    }
  }

  return results
}
