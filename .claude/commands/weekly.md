---
description: Pick this week's best articles from my sources and make a video for each
---
Run the weekly article digest. Follow CLAUDE.md exactly.

1. If `node_modules` is missing, run `npm install` first.
2. If `config/feeds.txt` has no sources and `substackHandle` in `config/settings.json` is empty, ask me which sites or newsletters to follow, add them to `config/feeds.txt`, and continue.
3. Run `node scripts/fetch-week.mjs`.
4. Read `data/candidates.json`. Score every candidate with the ranking rubric in CLAUDE.md. For the closest calls among the top 8, run `node scripts/get-article.mjs <url>` and skim the article before deciding.
5. Choose up to `picksPerWeek` articles scoring 6 or more, max one per source.
6. Write `data/picks-<YYYY-MM-DD>.md`: picks and the next 5 runners-up, with scores and a one-line reason each.
7. For each pick, do every step of `.claude/commands/video.md` except opening the video.
8. Reply with: how many sources and articles were checked, the picks (title, source, one-line thesis, video path), and any sources that failed. Then open the `out/` folder.
