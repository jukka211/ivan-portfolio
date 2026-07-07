import {defineArrayMember, defineField, defineType} from 'sanity'

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
          fields: [
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
          ],
          preview: {
            select: {title: 'mediaType', media: 'image'},
            prepare({title, media}) {
              return {
                title: title === 'video' ? 'Video slide' : 'Image slide',
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
      media: 'slides.0.image',
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
