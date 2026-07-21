import {defineArrayMember, defineField, defineType} from 'sanity'

export const techSpecsSlide = defineType({
  name: 'techSpecsSlide',
  title: 'Tech Specs Slide',
  type: 'object',
  fields: [
    defineField({
      name: 'slideType',
      title: 'Slide Type',
      type: 'string',
      initialValue: 'techSpecs',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'specs',
      title: 'Specs',
      type: 'array',
      of: [defineArrayMember({type: 'specItem'})],
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {
        title: title || 'Tech Specs Slide',
        subtitle: 'Tech Specs Slide',
      }
    },
  },
})
