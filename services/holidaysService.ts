// Indian holidays & festivals. Uses the free, no-key, CORS-enabled Nager.Date
// API (accurate variable festival dates across years), with an offline fallback
// of fixed-date national holidays if the API can't be reached.

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

const FIXED_FALLBACK = (year: number): Holiday[] => [
  { date: `${year}-01-01`, name: "New Year's Day" },
  { date: `${year}-01-26`, name: 'Republic Day' },
  { date: `${year}-08-15`, name: 'Independence Day' },
  { date: `${year}-10-02`, name: 'Gandhi Jayanti' },
  { date: `${year}-12-25`, name: 'Christmas' },
];

export const fetchIndianHolidays = async (year: number): Promise<Holiday[]> => {
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        return data
          .map((h: any) => ({ date: h.date as string, name: (h.localName || h.name) as string }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }
    }
  } catch { /* fall back below */ }
  return FIXED_FALLBACK(year);
};
