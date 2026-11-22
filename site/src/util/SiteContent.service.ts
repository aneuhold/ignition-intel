import type { CollectionEntry } from 'astro:content';
import { getEntry } from 'astro:content';

/**
 * Typed accessors for the site's singleton content entries. Each site-info
 * collection is backed by exactly one file, so these wrap `getEntry` with the
 * fixed entry id and a not-found guard. Callers get a guaranteed-present,
 * fully-typed entry instead of repeating the lookup-and-throw dance at every
 * call site.
 */
class SiteContentService {
  /**
   * Home-page content: hero title, tagline, and optional hero image.
   */
  async home(): Promise<CollectionEntry<'home'>> {
    return this.#required(await getEntry('home', 'home'), 'home');
  }

  /**
   * About-page heading, markdown body, and highlight blocks.
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
