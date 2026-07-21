import {defineField, defineType} from 'sanity'

export const legalPageType = defineType({
  name: 'legalPage',
  title: 'Legal Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'Legal',
    }),
    defineField({
      name: 'columnOne',
      title: 'Column 1',
      type: 'text',
      rows: 12,
    }),
    defineField({
      name: 'columnTwo',
      title: 'Column 2',
      type: 'text',
      rows: 12,
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title: title || 'Legal Page',
      }
    },
  },
})
