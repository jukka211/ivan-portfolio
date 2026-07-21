import {defineField, defineType} from 'sanity'

export const twoColumnTextSlide = defineType({
  name: 'twoColumnTextSlide',
  title: 'Two Column Text Slide',
  type: 'object',
  fields: [
    defineField({
      name: 'slideType',
      title: 'Slide Type',
      type: 'string',
      initialValue: 'twoColumnText',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 8,
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {
        title: title || 'Two Column Text Slide',
        subtitle: 'Two Column Text Slide',
      }
    },
  },
})
