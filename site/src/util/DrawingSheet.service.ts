/**
 * A page's place in the site's drawing set, shown in the footer title block.
 */
export interface DrawingSheet {
  /** Sheet number, e.g. `C-03`. */
  code: string;
  /** Sheet name, e.g. `Courses`. */
  name: string;
}

/**
 * Numbers pages like sheets in a drawing set. Courses get `C-` numbers from their
 * position in the course list, so numbering follows the CMS `order` field.
 */
class DrawingSheetService {
  /** Two-digit padding for sheet numbers. */
  static readonly #DIGITS = 2;

  /**
   * Sheet number for a course, from its zero-based position in the sorted course list.
   *
   * @param index Zero-based position of the course in `siteContentService.courses()`
   */
  courseCode(index: number): string {
    return `C-${String(index + 1).padStart(DrawingSheetService.#DIGITS, '0')}`;
  }

  /**
   * Sheet for a course page.
   *
   * @param index Zero-based position of the course in the sorted course list
   * @param title Course title
   */
  course(index: number, title: string): DrawingSheet {
    return { code: this.courseCode(index), name: title };
  }
}

const drawingSheetService = new DrawingSheetService();
export default drawingSheetService;
