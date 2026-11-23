/**
 * Handles functions related to youtube on the site.
 */
class YouTubeService {
  /** Hosts that serve YouTube video links. */
  static readonly #HOSTS = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com'
  ]);

  /** YouTube's short-link host. */
  static readonly #SHORT_HOST = 'youtu.be';

  /** Path prefixes on the standard hosts that are followed by the video ID. */
  static readonly #ID_PATH_PREFIXES = ['shorts', 'live', 'embed'];

  /** YouTube video IDs are 11 characters of URL-safe base64. */
  static readonly #VIDEO_ID_PATTERN = /^[\w-]{11}$/;

  /**
   * Extracts the video ID from a YouTube link. Returns `undefined` when the
   * link is not a recognizable YouTube video URL.
   *
   * @param url A YouTube video link
   */
  extractVideoId(url: string): string | undefined {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return undefined;
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    let id: string | null | undefined;
    if (parsed.hostname === YouTubeService.#SHORT_HOST) {
      id = segments[0];
    } else if (YouTubeService.#HOSTS.has(parsed.hostname)) {
      id =
        segments[0] === 'watch'
          ? parsed.searchParams.get('v')
          : YouTubeService.#ID_PATH_PREFIXES.includes(segments[0] ?? '')
            ? segments[1]
            : undefined;
    }

    return id && YouTubeService.#VIDEO_ID_PATTERN.test(id) ? id : undefined;
  }

  /**
   * Builds the privacy-enhanced embed URL for a YouTube link. Throws when the
   * link is not a YouTube video URL.
   *
   * @param url A YouTube video link
   */
  convertToEmbedUrl(url: string): string {
    const id = this.extractVideoId(url);
    if (!id) {
      throw new Error(`Not a YouTube video URL: ${url}`);
    }
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
}

const youTubeService = new YouTubeService();
export default youTubeService;
