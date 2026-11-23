/**
 * Names of the scroll and entrance effects the page motion runs. Put one on an element as
 * `data-motion` and `PageMotion.service.ts` attaches the matching effect on every page load.
 */
export enum MotionEffect {
  /** Headline lines rise into place from behind a mask as the headline scrolls in. */
  SplitHeadline = 'split-headline',
  /** The hero V-pattern layers grow up and out from the apex on load. */
  VBurn = 'v-burn',
  /** A V divider's apex drops down into the next section, scrubbed by scroll. */
  VDrop = 'v-drop',
  /** A band with a V-shaped leading edge sweeps down through its section once. */
  VSweep = 'v-sweep',
  /** A headline's heat fill burns up through it from the base, scrubbed by scroll. */
  HeatMask = 'heat-mask',
  /** The credentials band scrolls sideways while it is on screen. */
  Marquee = 'marquee',
  /** The course rail pins and scrolls sideways on desktop. */
  CourseRail = 'course-rail'
}
