import {defineArrayMember, defineField, defineType} from 'sanity'

export const creditsSlide = defineType({
  name: 'creditsSlide',
  title: 'Credits Slide',
  type: 'object',
  fields: [
    defineField({
      name: 'slideType',
      title: 'Slide Type',
      type: 'string',
      initialValue: 'credits',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'leftColumn1',
      title: 'Left Column 1',
      type: 'array',
      of: [defineArrayMember({type: 'creditItem'})],
    }),
    defineField({
      name: 'leftColumn2',
      title: 'Left Column 2',
      type: 'array',
      of: [defineArrayMember({type: 'creditItem'})],
    }),
    defineField({
      name: 'text',
      title: 'Right Text',
      type: 'text',
      rows: 8,
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Credits Slide',
      }
    },
  },
})
