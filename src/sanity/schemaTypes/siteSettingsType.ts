import {defineField, defineType} from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Site title',
      type: 'string',
      initialValue: 'Ivan Sukhov',
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      initialValue: 'Linz, Austria',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      initialValue: 'ivan@sukhov.xyz',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram URL',
      type: 'url',
      initialValue: 'https://www.instagram.com/sukhov.xyz/',
    }),
    defineField({
      name: 'awards',
      title: 'Awards',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string'}),
            defineField({name: 'result', title: 'Result', type: 'string'}),
            defineField({name: 'year', title: 'Year', type: 'string'}),
          ],
        },
      ],
    }),
    defineField({
      name: 'graphicTools',
      title: 'Graphic Tools',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'url',
            },
          },
        },
      ],
      initialValue: [
        {
          _type: 'object',
          label: 'Stretch A-Z',
        },
        {
          _type: 'object',
          label: 'OFS',
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings',
      }
    },
  },
})