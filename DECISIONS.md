# Decisions

Why things are the way they are. Newest at the bottom. Runtime dependencies list gzipped size (hard rule 12).

## 2026-11-01

- **Keyword map built from estimates.** No keyword exports exist in `research/raw/`. Volume and difficulty are marked `estimate` and `priority_score` is computed from those estimates. Replacement is a LAUNCH.md item.
- **Extra `data_source` column in the keyword map.** The brief's columns are kept as specified; `data_source` (`estimate` or the tool name) marks estimated rows without putting text in the numeric `volume`/`difficulty` columns, so `priority_score` stays computable.
- **Keyword map scope.** 25 calculators, 10 mortgage state pages and 10 paycheck state pages (top 10 states by population/search demand: CA, TX, FL, NY, PA, IL, OH, GA, NC, MI), 5 pillar guides, 4 category hubs and the homepage.
- **Guide vs calculator intent split.** "how much house can i afford" (learn intent) belongs to the pillar guide; the calculator owns "mortgage affordability calculator". Same split for retirement ("how much do i need to retire" guide vs "retirement calculator").
