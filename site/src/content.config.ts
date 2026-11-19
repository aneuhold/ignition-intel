// See the docs for this file here: https://docs.astro.build/en/guides/content-collections/#defining-build-time-content-collections

import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

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
    highlights: z
      .array(
        z.object({
          headline: z.string(),
          body: z.string()
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

const gallery = defineCollection({
  loader: glob({ pattern: '*.json', base: 'src/content/gallery' }),
  schema: z.object({
    photo: z.url(),
    alt: z.string(),
    order: z.number().default(0)
  })
});

export const collections = {
  home,
  about,
  contact,
  socialMediaLinks,
  businessProfiles,
  gallery
};
