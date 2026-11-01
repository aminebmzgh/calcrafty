/** Site search: shared document shape, synonym expansion and MiniSearch options. */

export interface SearchDoc {
  id: string;
  title: string;
  description: string;
  url: string;
  kind: 'calculator' | 'guide' | 'hub' | 'state';
  category: string;
  /** Secondary keywords and synonyms, space-joined. */
  keywords: string;
}

/**
 * Query-side synonyms: a query term on the left also searches the terms on the right.
 * Calculator-specific synonyms live in each config's `synonyms` and are indexed directly.
 */
export const SYNONYMS: Record<string, string[]> = {
  emi: ['loan', 'payment'],
  tdee: ['calorie'],
  bmr: ['calorie'],
  'house payment': ['mortgage'],
  'home loan': ['mortgage'],
  'car payment': ['auto', 'loan'],
  salary: ['paycheck'],
  wage: ['paycheck', 'hourly'],
  'take home': ['paycheck'],
  interest: ['compound', 'loan'],
  '401k': ['retirement'],
  ira: ['retirement'],
  weight: ['bmi', 'ideal'],
  fat: ['body'],
  protein: ['macro'],
  carbs: ['macro'],
  run: ['pace'],
  marathon: ['pace'],
  percent: ['percentage'],
  sd: ['standard', 'deviation'],
  stdev: ['standard', 'deviation'],
  variance: ['standard', 'deviation'],
  birthday: ['age'],
  date: ['days'],
  grades: ['gpa'],
  debt: ['payoff'],
  afford: ['affordability'],
};

export function expandQuery(q: string): string {
  const lower = q.toLowerCase().trim();
  const extra: string[] = [];
  for (const [term, adds] of Object.entries(SYNONYMS)) {
    if (new RegExp(`(^|\\s)${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(lower)) extra.push(...adds);
  }
  return extra.length ? `${lower} ${extra.join(' ')}` : lower;
}

export const MINISEARCH_OPTIONS = {
  fields: ['title', 'keywords', 'description'],
  storeFields: ['title', 'description', 'url', 'kind', 'category'],
  searchOptions: {
    boost: { title: 3, keywords: 2 },
    prefix: true,
    fuzzy: 0.2,
    combineWith: 'OR' as const,
  },
};
