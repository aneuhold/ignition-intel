// @vitest-environment node
// `astro:content` is server-only, so this file opts out of the default jsdom environment.
import { describe, expect, it } from 'vitest';
import siteContentService from './SiteContent.service';

describe('SiteContentService', () => {
  describe('courses', () => {
    it('sorts by ascending order, then newest created, then id, with unordered entries last', async () => {
      const courses = await siteContentService.courses();
      expect(courses.length).toBeGreaterThan(0);

      // Each key sorts ascending, so createdAt is negated to put the newest first.
      const sortKey = (course: (typeof courses)[number]): [number, number, string] => [
        course.data.order ?? Number.POSITIVE_INFINITY,
        -course.data.createdAt.getTime(),
        course.id
      ];
      courses.slice(1).forEach((course, i) => {
        const [prevOrder, prevCreated, prevId] = sortKey(courses[i]);
        const [order, created, id] = sortKey(course);
        const inOrder =
          prevOrder < order ||
          (prevOrder === order &&
            (prevCreated < created || (prevCreated === created && prevId.localeCompare(id) < 0)));
        expect(inOrder).toBe(true);
      });
    });
  });
});
