import {defineField, defineType} from 'sanity'

const createColumnFields = () => [
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
  defineField({
    name: 'poster',
    title: 'Poster (auto-generated)',
    type: 'image',
    readOnly: true,
    description: "Generated automatically from the video's first frame. Do not upload manually.",
    hidden: ({parent}) => parent?.mediaType !== 'video',
  }),
  defineField({
    name: 'posterSourceAssetId',
    type: 'string',
    hidden: true,
    readOnly: true,
  }),
]

export const twoColumnImageSlide = defineType({
  name: 'twoColumnImageSlide',
  title: 'Two Column Image Slide',
  type: 'object',
  fields: [
    defineField({
      name: 'slideType',
      title: 'Slide Type',
      type: 'string',
      initialValue: 'twoColumnImage',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'fitMode',
      title: 'Object fit mode',
      type: 'string',
      description: 'Applies to both columns. Default is cover. Use contain to show the whole image/video uncropped.',
      options: {
        list: [
          {title: 'Cover', value: 'cover'},
          {title: 'Contain', value: 'contain'},
        ],
        layout: 'radio',
      },
      initialValue: 'cover',
    }),
    defineField({
      name: 'leftColumn',
      title: 'Left Column',
      type: 'object',
      fields: createColumnFields(),
    }),
    defineField({
      name: 'rightColumn',
      title: 'Right Column',
      type: 'object',
      fields: createColumnFields(),
    }),
  ],
  preview: {
    select: {media: 'leftColumn.image'},
    prepare({media}) {
      return {
        title: 'Two Column Image Slide',
        media,
      }
    },
  },
})
