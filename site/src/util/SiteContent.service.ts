import type { CollectionEntry } from 'astro:content';
import { getCollection, getEntry } from 'astro:content';

/**
 * Typed accessors for the site's content collections. Singleton collections
 * (backed by exactly one file) wrap `getEntry` with the fixed entry id and a
 * not-found guard, so callers get a guaranteed-present, fully-typed entry
 * instead of repeating the lookup-and-throw dance at every call site.
 * Multi-entry collections come back already in display order.
 */
class SiteContentService {
  /**
   * Home-page content: hero title, tagline, and optional hero image.
   */
  async home(): Promise<CollectionEntry<'home'>> {
    return this.#required(await getEntry('home', 'home'), 'home');
  }

  /**
   * About-page heading and markdown body.
   */
  async about(): Promise<CollectionEntry<'about'>> {
    return this.#required(await getEntry('about', 'about'), 'about');
  }

  /**
   * Phone, email, and the contact-page note.
   */
  async contact(): Promise<CollectionEntry<'contact'>> {
    return this.#required(await getEntry('contact', 'contact'), 'contact');
  }

  /**
   * Social media links (e.g. LinkedIn, Instagram).
   */
  async socialMediaLinks(): Promise<CollectionEntry<'socialMediaLinks'>> {
    return this.#required(
      await getEntry('socialMediaLinks', 'social-media-links'),
      'socialMediaLinks'
    );
  }

  /**
   * Directory and review listings (e.g. Google Business Profile) used to
   * populate the JSON-LD `sameAs` array.
   */
  async businessProfiles(): Promise<CollectionEntry<'businessProfiles'>> {
    return this.#required(
      await getEntry('businessProfiles', 'business-profiles'),
      'businessProfiles'
    );
  }

  /**
   * All courses, sorted by ascending `order`, then newest `createdAt`, then
   * `id`. Entries without an `order` come last.
   */
  async courses(): Promise<CollectionEntry<'courses'>[]> {
    const entries = await getCollection('courses');
    return [...entries].sort((a, b) => {
      const aOrder = a.data.order ?? Number.POSITIVE_INFINITY;
      const bOrder = b.data.order ?? Number.POSITIVE_INFINITY;
      if (aOrder !== bOrder) return aOrder - bOrder;
      const createdDiff = b.data.createdAt.getTime() - a.data.createdAt.getTime();
      if (createdDiff !== 0) return createdDiff;
      return a.id.localeCompare(b.id);
    });
  }

  /**
   * Throws a consistent "missing entry" error when a singleton lookup comes
   * back undefined, narrowing the result to a present entry.
   *
   * @param entry The entry returned by `getEntry`, possibly undefined
   * @param collection Collection name, used only for the error message
   */
  #required<T>(entry: T | undefined, collection: string): T {
    if (!entry) {
      throw new Error(`Missing ${collection} content entry`);
    }
    return entry;
  }
}

const siteContentService = new SiteContentService();
export default siteContentService;
