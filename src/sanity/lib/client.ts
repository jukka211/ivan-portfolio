import {createClient} from 'next-sanity'
import {apiVersion, dataset, projectId} from '@/sanity/env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Read fresh published data when Next regenerates pages after a webhook.
  useCdn: false,
})
