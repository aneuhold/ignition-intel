import {
  assembleGraph,
  buildPiece,
  buildWebPage,
  buildWebSite,
  type GraphEntity,
  makeIds
} from '@jdevalk/seo-graph-core';
import type { ProfessionalService } from 'schema-dts';
import { globalConstants } from './globalConstants';
import siteContentService from './SiteContent.service';

class SeoGraphService {
  /** Stable slug for the ProfessionalService `@id` URI. */
  static readonly #ORGANIZATION_SLUG = 'organization';

  /**
   * Builds the JSON-LD `@graph` for the current page: a sitewide `WebSite`
   * and `ProfessionalService`, plus a per-page `WebPage` linked to both. The result
   * is consumed by `<Seo graph={...}>` from `@jdevalk/astro-seo-graph`.
   *
   * @param args - Site, page, and image inputs used to populate the entities
   * @param args.site - Canonical site origin (e.g. `https://ignitionintel.com`)
   * @param args.pageUrl - Absolute URL of the current page
   * @param args.pageName - Page name used for the WebPage entity
   * @param args.description - Page description, reused on the WebPage
   * @param args.ogImage - Absolute URL of the share image for the ProfessionalService
   */
  async buildGraph(args: {
    site: URL;
    pageUrl: URL;
    pageName: string;
    description: string;
    ogImage: string;
  }): Promise<Record<string, unknown>> {
    const { site, pageUrl, pageName, description, ogImage } = args;
    const siteUrl = site.href;
    const ids = makeIds({ siteUrl });
    const organizationId = ids.organization(SeoGraphService.#ORGANIZATION_SLUG);

    const [contactEntry, socialEntry, businessProfilesEntry] = await Promise.all([
      siteContentService.contact(),
      siteContentService.socialMediaLinks(),
      siteContentService.businessProfiles()
    ]);

    const logoUrl = new URL('/favicon.svg', site).href;

    const website = buildWebSite(
      {
        url: siteUrl,
        name: globalConstants.siteName,
        description,
        publisher: { '@id': organizationId }
      },
      ids
    );

    const webPage = buildWebPage(
      {
        url: pageUrl.href,
        name: pageName,
        description,
        isPartOf: { '@id': ids.website }
      },
      ids
    );

    const organization = buildPiece<ProfessionalService>({
      '@type': 'ProfessionalService',
      '@id': organizationId,
      name: globalConstants.siteName,
      description,
      url: siteUrl,
      image: ogImage,
      logo: logoUrl,
      founder: { '@type': 'Person', name: globalConstants.ownerName },
      telephone: contactEntry.data.phone,
      email: contactEntry.data.email,
      knowsAbout: [...globalConstants.knowsAbout],
      sameAs: [
        ...socialEntry.data.links.map((link) => link.url),
        ...businessProfilesEntry.data.profiles.map((profile) => profile.url)
      ]
    });

    return assembleGraph([
      this.#toEntity(website),
      this.#toEntity(webPage),
      this.#toEntity(organization)
    ]);
  }

  /**
   * Narrows a builder-output `Record<string, unknown>` to a `GraphEntity` by
   * re-spreading with the runtime `@type` value. The core builders all set
   * `@type` but their declared return is the wider `Record` shape, so we
   * verify-then-narrow here rather than reach for a type assertion.
   *
   * @param piece - Raw piece returned by a `buildXxx` call from `seo-graph-core`
   */
  #toEntity(piece: Record<string, unknown>): GraphEntity {
    const type = piece['@type'];
    const validString = typeof type === 'string';
    const validArray = Array.isArray(type) && type.every((t) => typeof t === 'string');
    if (!validString && !validArray) {
      throw new Error("Builder output is missing a string '@type' value.");
    }
    return { ...piece, '@type': type };
  }
}

const seoGraphService = new SeoGraphService();
export default seoGraphService;
