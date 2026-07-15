import {defineArrayMember, defineField, defineType} from 'sanity'

const createMediaFields = () => [
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
    options: {accept: 'video/webm,video/mp4'},
    hidden: ({parent}) => parent?.mediaType !== 'video',
  }),
]

const layoutOptions = [
  {title: 'Single', value: 'single'},
  {title: 'Two Columns', value: 'twoColumns'},
  {title: 'Two Rows', value: 'twoRows'},
  {title: 'Left Column + Right Stack', value: 'leftRightStack'},
  {title: 'Top Row + Bottom Split', value: 'topBottomSplit'},
]

const usesCellB = (layout?: string) => layout !== undefined && layout !== 'single'
const usesCellC = (layout?: string) => layout === 'leftRightStack' || layout === 'topBottomSplit'

export const workSectionType = defineType({
  name: 'workSection',
  title: 'Work Section',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (internal)',
      type: 'string',
      description: 'Not shown on the site — used to identify this section in the CMS.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower number = appears first',
    }),
    defineField({
      name: 'projectTitle',
      title: 'Project',
      type: 'string',
      description: 'Shown in the Project Info panel, e.g. "Meisterei Wels"',
    }),
    defineField({
      name: 'projectYear',
      title: 'Year',
      type: 'string',
      description: 'e.g. "2023"',
    }),
    defineField({
      name: 'webType',
      title: 'Web.',
      type: 'string',
      description: 'e.g. "Concept / proposal"',
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
      description: 'e.g. "Meisterei Wels (AT)"',
    }),
    defineField({
      name: 'slides',
      title: 'Slides',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'slide',
          fields: [
            defineField({
              name: 'layout',
              title: 'Layout',
              type: 'string',
              description:
                'Single: [A]. Two Columns: [A][B]. Two Rows: [A] over [B]. Left + Right Stack: [A] beside [B] over [C]. Top + Bottom Split: [A] over [B][C].',
              options: {list: layoutOptions},
              initialValue: 'single',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'cellA',
              title: 'Cell A',
              type: 'object',
              fields: createMediaFields(),
            }),
            defineField({
              name: 'cellB',
              title: 'Cell B',
              type: 'object',
              fields: createMediaFields(),
              hidden: ({parent}) => !usesCellB(parent?.layout),
            }),
            defineField({
              name: 'cellC',
              title: 'Cell C',
              type: 'object',
              fields: createMediaFields(),
              hidden: ({parent}) => !usesCellC(parent?.layout),
            }),
          ],
          preview: {
            select: {layout: 'layout', media: 'cellA.image'},
            prepare({layout, media}) {
              const label = layoutOptions.find((option) => option.value === layout)?.title
              return {
                title: label ? `${label} slide` : 'Slide',
                media,
              }
            },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      order: 'order',
      projectTitle: 'projectTitle',
      media: 'slides.0.cellA.image',
    },
    prepare({title, order, projectTitle, media}) {
      return {
        title,
        subtitle: [order !== undefined ? `Order: ${order}` : null, projectTitle]
          .filter(Boolean)
          .join(' — '),
        media,
      }
    },
  },
})
