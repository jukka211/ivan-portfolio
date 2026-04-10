import {defineArrayMember, defineField, defineType} from 'sanity'

const createProjectMediaFields = () => [
  defineField({
    name: 'mediaType',
    title: 'Media type',
    type: 'string',
    options: {
      list: [
        {title: 'Image', value: 'image'},
        {title: 'Video', value: 'video'},
      ],
      layout: 'radio',
    },
    initialValue: 'image',
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: 'fitMode',
    title: 'Object fit mode',
    type: 'string',
    description: 'Default is contain. Use cover to crop and fill the screen.',
    options: {
      list: [
        {title: 'Contain', value: 'contain'},
        {title: 'Cover', value: 'cover'},
      ],
      layout: 'radio',
    },
    initialValue: 'contain',
  }),
  defineField({
    name: 'image',
    title: 'Image',
    type: 'image',
    options: {hotspot: true},
    hidden: ({parent}) => parent?.mediaType !== 'image',
  }),
  defineField({
    name: 'video',
    title: 'Video',
    type: 'file',
    options: {
      accept: 'video/webm,video/mp4',
    },
    hidden: ({parent}) => parent?.mediaType !== 'video',
  }),
]

export const projectType = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower number = appears first',
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
    }),
    defineField({
      name: 'coverMedia',
      title: 'Cover media',
      type: 'object',
      fields: createProjectMediaFields(),
    }),
    defineField({
      name: 'slides',
      title: 'Slides',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: createProjectMediaFields(),
          preview: {
            select: {
              title: 'mediaType',
              media: 'image',
            },
            prepare({title, media}) {
              return {
                title: title === 'video' ? 'Video slide' : 'Image slide',
                media,
              }
            },
          },
        }),
        defineArrayMember({
          type: 'creditsSlide',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'year',
      media: 'coverMedia.image',
    },
  },
})
