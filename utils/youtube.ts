// Helpers for turning a pasted YouTube link into an id we can render/embed.

/**
 * Extract a YouTube video id from the common URL shapes:
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/shorts/ID
 *   https://www.youtube.com/live/ID
 * Returns null if no id can be found.
 */
export const parseYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();

  // Bare 11-char id.
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split('/').filter(Boolean); // [embed|shorts|live, ID]
      if (parts.length >= 2 && /^[a-zA-Z0-9_-]{11}$/.test(parts[1])) return parts[1];
    }
  } catch {
    /* not a parseable URL */
  }
  return null;
};

/** Playlist id from a YouTube URL, if present. */
export const parsePlaylistId = (url: string): string | null => {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.searchParams.get('list');
  } catch {
    return null;
  }
};

export const thumbnailUrl = (videoId: string): string =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

// Privacy-enhanced embed host so playing a lecture doesn't set tracking cookies
// until the user interacts.
export const embedUrl = (videoId: string): string =>
  `https://www.youtube-nocookie.com/embed/${videoId}`;

export const watchUrl = (videoId: string): string =>
  `https://www.youtube.com/watch?v=${videoId}`;
