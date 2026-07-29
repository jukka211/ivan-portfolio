import type {NextRequest} from 'next/server'
import {parseBody} from 'next-sanity/webhook'
import {client} from '@/sanity/lib/client'
import {createWriteClient} from '@/sanity/lib/writeClient'
import {projectPosterInputByIdQuery} from '@/sanity/lib/queries'
import {generatePostersForProject} from '../../../../scripts/poster-lib.mjs'

// Spawns ffmpeg (child_process) to read the downloaded video file — not
// available on the Edge runtime.
export const runtime = 'nodejs'
// Per-video: download + ffmpeg + asset upload + patch, run sequentially for
// every video on the document, plus parseBody's own ~3s eventual-consistency
// wait. Vercel's current default/max is 300s on every plan tier, so 120s
// just gives headroom without needing to opt into anything.
export const maxDuration = 120

type SanityWebhookBody = {
  _id?: string
  _type?: string
}

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_POSTER_WEBHOOK_SECRET

  if (!secret) {
    return Response.json(
      {message: 'Missing SANITY_POSTER_WEBHOOK_SECRET environment variable.'},
      {status: 500},
    )
  }

  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return Response.json(
      {message: 'Missing SANITY_API_WRITE_TOKEN environment variable.'},
      {status: 500},
    )
  }

  const {body, isValidSignature} = await parseBody<SanityWebhookBody>(request, secret)

  if (!isValidSignature) {
    return Response.json({message: 'Invalid signature.'}, {status: 401})
  }

  if (body?._type !== 'project' || !body._id) {
    return Response.json({skipped: true})
  }

  const project = await client.fetch(projectPosterInputByIdQuery, {id: body._id})

  if (!project) {
    return Response.json({skipped: true})
  }

  // Per-video failures are caught and logged inside generatePostersForProject
  // rather than thrown — a bad video shouldn't block the rest, and a non-2xx
  // response here would make Sanity retry-storm the whole webhook.
  const results = await generatePostersForProject({writeClient: createWriteClient(), project})

  return Response.json({
    documentId: body._id,
    generated: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
  })
}
