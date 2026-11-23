// See the docs for this file here: https://docs.astro.build/en/guides/content-collections/#defining-build-time-content-collections

import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';
import youTubeService from './util/YouTube.service';

const home = defineCollection({
  loader: glob({ pattern: 'home.json', base: 'src/content' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string().optional(),
    heroImage: z.url().optional(),
    heroImageAlt: z.string().optional()
  })
});

const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: 'src/content' }),
  schema: z.object({
    heading: z.string(),
    facts: z
      .array(
        z.object({
          label: z.string(),
          value: z.string()
        })
      )
      .default([])
  })
});

const contact = defineCollection({
  loader: glob({ pattern: 'contact.json', base: 'src/content' }),
  schema: z.object({
    phone: z.string().optional(),
    email: z.string(),
    note: z.string()
  })
});

const socialMediaLinks = defineCollection({
  loader: glob({ pattern: 'social-media-links.json', base: 'src/content' }),
  schema: z.object({
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.url()
        })
      )
      .default([])
  })
});

const businessProfiles = defineCollection({
  loader: glob({ pattern: 'business-profiles.json', base: 'src/content' }),
  schema: z.object({
    profiles: z
      .array(
        z.object({
          label: z.string(),
          url: z.url()
        })
      )
      .default([])
  })
});

const courses = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/courses' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    videoUrl: z.url().refine((url) => youTubeService.extractVideoId(url) !== undefined, {
      message: 'Must be a YouTube video link'
    }),
    order: z.number().optional(),
    createdAt: z.coerce.date()
  })
});

export const collections = {
  home,
  about,
  contact,
  socialMediaLinks,
  businessProfiles,
  courses
};
