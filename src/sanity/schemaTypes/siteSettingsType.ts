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
            defineField({name: 'url', title: 'URL Link', type: 'url'}),
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'result',
            },
          },
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
    defineField({
      name: 'services',
      title: 'Services',
      description: 'Service offerings shown in the "Services:" list (distinct from Graphic Tools).',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Name of Service',
              type: 'string',
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
            }),
            defineField({
              name: 'details',
              title: 'List of Services',
              description: 'The breakdown shown when this service is opened in the Services panel.',
              type: 'array',
              of: [{type: 'string'}],
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
          label: 'Brand Identity Systems',
          details: [
            'Positioning, naming direction, and verbal tone',
            'Logo, typographic system, and colour architecture',
            'Grid and layout systems for print and screen',
            'Brand book Digital Platform',
            'Rollout across web, print, and social templates',
          ],
        },
        {_type: 'object', label: 'Web Design, UX Analyse & Strategy'},
        {
          _type: 'object',
          label: 'Generative Brand Tools',
          details: [
            'Custom tools that let teams produce on-brand assets themselves',
            'Generative pattern, poster, and identity systems (p5.js / Canvas)',
            'Design-to-production automation for catalogues and large data sets',
            'Screen and exhibition pieces built on the same system',
          ],
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