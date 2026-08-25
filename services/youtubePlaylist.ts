// Expand a YouTube playlist into its videos with no API key, via public Piped
// instances (CORS-enabled). Instances can be flaky, so we try a few in turn.

const INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.leptons.xyz',
];

export interface PlaylistVideo { videoId: string; title: string; }

export const fetchPlaylistVideos = async (playlistId: string): Promise<PlaylistVideo[]> => {
  for (const base of INSTANCES) {
    try {
      const res = await fetch(`${base}/playlists/${encodeURIComponent(playlistId)}`);
      if (!res.ok) continue;
      const data = await res.json();
      const streams: any[] = data.relatedStreams || [];
      const vids = streams
        .map(s => {
          const m = (s.url || '').match(/[?&]v=([\w-]{11})/);
          return m ? { videoId: m[1], title: (s.title || 'Video') as string } : null;
        })
        .filter(Boolean) as PlaylistVideo[];
      if (vids.length) return vids;
    } catch {
      /* try next instance */
    }
  }
  throw new Error("Couldn't load that playlist right now. Try again, or add videos individually.");
};
