import { describe, expect, it } from 'vitest';
import youTubeService from './YouTube.service';

describe('YouTubeService', () => {
  describe('videoId', () => {
    const id = 'dQw4w9WgXcQ';

    it.each([
      `https://www.youtube.com/watch?v=${id}`,
      `https://youtube.com/watch?v=${id}&t=42s`,
      `https://m.youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}`,
      `https://youtu.be/${id}?si=abc`,
      `https://www.youtube.com/shorts/${id}`,
      `https://www.youtube.com/live/${id}`,
      `https://www.youtube.com/embed/${id}`,
      `https://www.youtube-nocookie.com/embed/${id}`
    ])('extracts the ID from %s', (url) => {
      expect(youTubeService.extractVideoId(url)).toBe(id);
    });

    it.each([
      'not a url',
      `https://vimeo.com/${id}`,
      'https://www.youtube.com/watch',
      'https://www.youtube.com/watch?v=short',
      'https://www.youtube.com/@channel'
    ])('rejects %s', (url) => {
      expect(youTubeService.extractVideoId(url)).toBeUndefined();
    });
  });

  describe('embedUrl', () => {
    it('builds a privacy-enhanced embed URL', () => {
      expect(youTubeService.convertToEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
      );
    });

    it('throws for a non-YouTube URL', () => {
      expect(() => youTubeService.convertToEmbedUrl('https://vimeo.com/123')).toThrow();
    });
  });

  describe('thumbnailUrl', () => {
    it('builds the hqdefault thumbnail URL', () => {
      expect(youTubeService.thumbnailUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
        'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
      );
    });
  });

  describe('play', () => {
    it('replaces the link with an autoplaying embed', () => {
      const link = document.createElement('a');
      link.dataset.youtubeEmbed = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
      link.dataset.youtubeTitle = 'Course video';
      link.className = 'aspect-video w-full';
      document.body.append(link);

      youTubeService.play(link);

      const iframe = document.querySelector('iframe');
      expect(link.isConnected).toBe(false);
      expect(iframe?.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
      expect(iframe?.title).toBe('Course video');
      expect(iframe?.className).toBe('aspect-video w-full');
      iframe?.remove();
    });
  });
});
