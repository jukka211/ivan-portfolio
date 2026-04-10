import {defineField, defineType} from 'sanity'

export const creditItem = defineType({
  name: 'creditItem',
  title: 'Credit Item',
  type: 'object',
  fields: [
    defineField({
      name: 'role',
      title: 'Role Title',
      type: 'string',
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'role',
      subtitle: 'name',
    },
  },
})
