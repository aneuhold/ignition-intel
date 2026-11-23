/**
 * Builds the case numbers printed on course evidence tags. A case number is
 * derived from a course's position in display order and its slug, so it stays
 * in step with the `courses` collection without being stored anywhere.
 */
class CaseNumberService {
  /** Prefix on every case number: the Ignition Intel initials. */
  static readonly #PREFIX = 'II';

  /** Slug words skipped when building the initials suffix. */
  static readonly #SKIPPED_WORDS = new Set(['a', 'an', 'and', 'for', 'in', 'of', 'the', 'to']);

  /** Longest initials suffix, so long titles don't produce long numbers. */
  static readonly #MAX_INITIALS = 4;

  /**
   * Returns a case number like `II-003-CBFI` for a course: the prefix, the
   * 1-based position zero-padded to three digits, and the initials of the
   * slug's significant words.
   *
   * @param slug The course's collection id
   * @param index The course's 0-based position in display order
   */
  forCourse(slug: string, index: number): string {
    const initials = slug
      .split('-')
      .filter((word) => word.length > 0 && !CaseNumberService.#SKIPPED_WORDS.has(word))
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, CaseNumberService.#MAX_INITIALS)
      .join('');
    const position = String(index + 1).padStart(3, '0');
    return initials
      ? `${CaseNumberService.#PREFIX}-${position}-${initials}`
      : `${CaseNumberService.#PREFIX}-${position}`;
  }
}

const caseNumberService = new CaseNumberService();
export default caseNumberService;
