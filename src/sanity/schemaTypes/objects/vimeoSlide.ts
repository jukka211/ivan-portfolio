import {defineField, defineType} from 'sanity'

export const vimeoSlide = defineType({
  name: 'vimeoSlide',
  title: 'Vimeo Video Slide',
  type: 'object',
  fields: [
    defineField({
      name: 'slideType',
      title: 'Slide Type',
      type: 'string',
      initialValue: 'vimeo',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'embedCode',
      title: 'Vimeo Embed Code',
      type: 'text',
      rows: 4,
      description:
        "Paste the full embed code from Vimeo's Share → Embed dialog (the <div><iframe>…<script> block). Only the player iframe's URL is used — no need to strip anything out first.",
      validation: (Rule) =>
        Rule.required().custom((value) => {
          if (!value) return true
          return /<iframe[^>]*\ssrc=["'][^"']*player\.vimeo\.com[^"']*["']/i.test(value)
            ? true
            : 'Could not find a Vimeo player iframe (src containing player.vimeo.com) in this embed code.'
        }),
    }),
  ],
  preview: {
    select: {embedCode: 'embedCode'},
    prepare({embedCode}) {
      const match = typeof embedCode === 'string' ? embedCode.match(/video\/(\d+)/) : null
      return {
        title: 'Vimeo Video Slide',
        subtitle: match ? `Video ID ${match[1]}` : 'No video pasted yet',
      }
    },
  },
})
