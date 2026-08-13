// Fetch public GitHub + LeetCode stats. No auth required — uses public endpoints
// (GitHub REST is CORS-enabled; a public proxy provides the contribution graph
// and LeetCode stats). All failures are surfaced so the UI can degrade.

export interface GithubStats {
  login: string;
  name: string | null;
  avatar: string;
  url: string;
  repos: number;
  followers: number;
  totalContributions: number;
  streak: number;
  cells: { date: string; count: number }[];
  hasProfile: boolean; // false when the GitHub profile API was rate-limited
}

export interface LeetcodeStats {
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

// Accept either a bare handle or a full profile URL and return the clean handle.
export const extractGithubUser = (input: string): string => {
  const s = (input || '').trim().replace(/^@/, '');
  const m = s.match(/github\.com\/([^/?#]+)/i);
  return (m ? m[1] : s).replace(/\/+$/, '').trim();
};

export const extractLeetcodeUser = (input: string): string => {
  const s = (input || '').trim().replace(/^@/, '');
  const m = s.match(/leetcode\.com\/(?:u\/)?([^/?#]+)/i);
  return (m ? m[1] : s).replace(/\/+$/, '').trim();
};

const computeStreak = (cells: { date: string; count: number }[]): number => {
  const done = new Set(cells.filter(c => c.count > 0).map(c => c.date));
  const cursor = new Date(); cursor.setHours(0, 0, 0, 0);
  const key = (d: Date) => d.toISOString().split('T')[0];
  if (!done.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (done.has(key(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return streak;
};

export const fetchGithubStats = async (user: string): Promise<GithubStats> => {
  const u = extractGithubUser(user);
  if (!u) throw new Error('Enter a GitHub username.');

  // Contribution graph first — this proxy has generous limits and is the main
  // value, so the card can render even if the GitHub profile API is throttled.
  let cells: { date: string; count: number }[] = [];
  let totalContributions = 0;
  let contribOk = false;
  try {
    const contribRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(u)}?y=last`);
    if (contribRes.ok) {
      const data = await contribRes.json();
      if (Array.isArray(data.contributions)) {
        cells = data.contributions.map((c: any) => ({ date: c.date, count: c.count }));
        totalContributions = cells.reduce((sum, c) => sum + c.count, 0);
        contribOk = true;
      }
    }
  } catch { /* best-effort */ }

  // Profile enrichment (avatar/repos/followers). GitHub's unauthenticated API is
  // limited to 60 req/hr per IP, so treat failure as non-fatal.
  let profile: any = null;
  let notFound = false;
  try {
    const profileRes = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}`);
    if (profileRes.status === 404) notFound = true;
    else if (profileRes.ok) profile = await profileRes.json();
  } catch { /* rate-limited or offline — degrade gracefully */ }

  if (!contribOk && notFound) throw new Error(`GitHub user "${u}" not found.`);
  if (!contribOk && !profile) throw new Error('GitHub is rate-limiting or unavailable. Try again in a bit.');

  return {
    login: profile?.login || u,
    name: profile?.name ?? null,
    avatar: profile?.avatar_url || '',
    url: profile?.html_url || `https://github.com/${u}`,
    repos: profile?.public_repos ?? 0,
    followers: profile?.followers ?? 0,
    totalContributions,
    streak: computeStreak(cells),
    cells,
    hasProfile: !!profile,
  };
};

export const fetchLeetcodeStats = async (user: string): Promise<LeetcodeStats> => {
  const u = extractLeetcodeUser(user);
  if (!u) throw new Error('Enter a LeetCode username.');

  // Primary: reliable public API (returns totalSolved/easySolved/…).
  try {
    const res = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${encodeURIComponent(u)}`);
    if (res.ok) {
      const d = await res.json();
      if (d && typeof d.totalSolved === 'number' && !d.errors) {
        return { total: d.totalSolved, easy: d.easySolved || 0, medium: d.mediumSolved || 0, hard: d.hardSolved || 0 };
      }
    }
  } catch { /* fall through to backup */ }

  // Backup: alfa-leetcode-api (returns solvedProblem/easySolved/…).
  try {
    const res2 = await fetch(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(u)}/solved`);
    if (res2.ok) {
      const d2 = await res2.json();
      if (typeof d2.solvedProblem === 'number') {
        return { total: d2.solvedProblem, easy: d2.easySolved || 0, medium: d2.mediumSolved || 0, hard: d2.hardSolved || 0 };
      }
    }
  } catch { /* fall through */ }

  throw new Error(`Couldn't load LeetCode stats for "${u}". Check the username or try again later.`);
};
