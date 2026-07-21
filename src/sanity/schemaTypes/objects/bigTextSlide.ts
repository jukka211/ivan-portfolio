import {defineField, defineType} from 'sanity'

export const bigTextSlide = defineType({
  name: 'bigTextSlide',
  title: 'Big Text Slide',
  type: 'object',
  fields: [
    defineField({
      name: 'slideType',
      title: 'Slide Type',
      type: 'string',
      initialValue: 'bigText',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'text'},
    prepare({title}) {
      return {
        title: title || 'Big Text Slide',
        subtitle: 'Big Text Slide',
      }
    },
  },
})
