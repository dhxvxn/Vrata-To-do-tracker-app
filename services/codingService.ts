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
}

export interface LeetcodeStats {
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

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
  const u = user.trim();
  if (!u) throw new Error('Enter a GitHub username.');

  const profileRes = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}`);
  if (profileRes.status === 404) throw new Error(`GitHub user "${u}" not found.`);
  if (!profileRes.ok) throw new Error('GitHub is rate-limiting or unavailable. Try again later.');
  const profile = await profileRes.json();

  let cells: { date: string; count: number }[] = [];
  let totalContributions = 0;
  try {
    const contribRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(u)}?y=last`);
    if (contribRes.ok) {
      const data = await contribRes.json();
      cells = (data.contributions || []).map((c: any) => ({ date: c.date, count: c.count }));
      totalContributions = cells.reduce((sum, c) => sum + c.count, 0);
    }
  } catch { /* contributions are best-effort */ }

  return {
    login: profile.login,
    name: profile.name,
    avatar: profile.avatar_url,
    url: profile.html_url,
    repos: profile.public_repos ?? 0,
    followers: profile.followers ?? 0,
    totalContributions,
    streak: computeStreak(cells),
    cells,
  };
};

export const fetchLeetcodeStats = async (user: string): Promise<LeetcodeStats> => {
  const u = user.trim();
  if (!u) throw new Error('Enter a LeetCode username.');

  // Primary endpoint.
  try {
    const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(u)}`);
    if (res.ok) {
      const d = await res.json();
      if (d && d.status !== 'error' && typeof d.totalSolved === 'number') {
        return { total: d.totalSolved, easy: d.easySolved || 0, medium: d.mediumSolved || 0, hard: d.hardSolved || 0 };
      }
    }
  } catch { /* fall through to backup */ }

  // Backup endpoint.
  const res2 = await fetch(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(u)}/solved`);
  if (!res2.ok) throw new Error(`Couldn't load LeetCode stats for "${u}".`);
  const d2 = await res2.json();
  if (typeof d2.solvedProblem !== 'number') throw new Error(`LeetCode user "${u}" not found.`);
  return { total: d2.solvedProblem, easy: d2.easySolved || 0, medium: d2.mediumSolved || 0, hard: d2.hardSolved || 0 };
};
