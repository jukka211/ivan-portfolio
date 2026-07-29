// One-off: populates `poster` for every video that predates the
// generate-poster webhook (src/app/api/generate-poster/route.ts), which only
// fires on future creates/updates. Run once after deploying that route:
//
//   node --env-file=.env.local scripts/backfill-posters.mjs
//
// Requires SANITY_API_WRITE_TOKEN in .env.local (see src/sanity/lib/writeClient.ts).
import {createClient} from '@sanity/client'
import {generatePostersForProject} from './poster-lib.mjs'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset || !apiVersion) {
  throw new Error(
    'Missing NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET / NEXT_PUBLIC_SANITY_API_VERSION.',
  )
}
if (!token) {
  throw new Error('Missing SANITY_API_WRITE_TOKEN environment variable.')
}

const readClient = createClient({projectId, dataset, apiVersion, useCdn: false})
const writeClient = createClient({projectId, dataset, apiVersion, token, useCdn: false})

// Kept in sync by hand with allProjectsPosterInputQuery in
// src/sanity/lib/queries.ts — duplicated here since this plain Node script
// can't import that .ts file directly without adding a TS loader dependency.
const allProjectsPosterInputQuery = `
*[_type == "project"]{
  _id,
  coverMedia{
    mediaType,
    video{asset->{_id, url}},
    poster,
    posterSourceAssetId
  },
  slides[]{
    _key,
    slideType,
    mediaType,
    video{asset->{_id, url}},
    poster,
    posterSourceAssetId,
    leftColumn{
      mediaType,
      video{asset->{_id, url}},
      poster,
      posterSourceAssetId
    },
    rightColumn{
      mediaType,
      video{asset->{_id, url}},
      poster,
      posterSourceAssetId
    }
  }
}
`

const projects = await readClient.fetch(allProjectsPosterInputQuery)
console.log(`Found ${projects.length} project document(s).`)

let generated = 0
let failed = 0

for (const project of projects) {
  const results = await generatePostersForProject({writeClient, project})
  if (results.length === 0) continue

  const ok = results.filter((result) => result.ok).length
  const bad = results.length - ok
  generated += ok
  failed += bad
  console.log(`${project._id}: ${ok} generated, ${bad} failed`)
}

console.log(`Done. ${generated} poster(s) generated, ${failed} failed.`)
