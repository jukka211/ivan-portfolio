import {revalidatePath, revalidateTag} from 'next/cache'
import type {NextRequest} from 'next/server'
import {parseBody} from 'next-sanity/webhook'

type SanityWebhookBody = {
  _id?: string
  _type?: string
}

const tagsToRevalidate = ['siteSettings', 'projects'] as const

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET

  if (!secret) {
    return Response.json(
      {message: 'Missing SANITY_REVALIDATE_SECRET environment variable.'},
      {status: 500},
    )
  }

  const {body, isValidSignature} = await parseBody<SanityWebhookBody>(request, secret)

  if (!isValidSignature) {
    return Response.json({message: 'Invalid signature.'}, {status: 401})
  }

  for (const tag of tagsToRevalidate) {
    revalidateTag(tag, 'max')
  }

  revalidatePath('/')
  revalidatePath('/projects/[slug]', 'page')

  return Response.json({
    revalidated: true,
    now: Date.now(),
    tags: tagsToRevalidate,
    documentId: body?._id ?? null,
    documentType: body?._type ?? null,
  })
}
