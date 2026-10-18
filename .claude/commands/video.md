---
description: Turn any article link into a neon explainer video
argument-hint: <article-url>
---
Make a neon explainer video for this article: $ARGUMENTS

Follow CLAUDE.md exactly.

1. If `node_modules` is missing, run `npm install` first.
2. Run `node scripts/get-article.mjs "$ARGUMENTS"`.
   - Exit code 2: the article is paywalled. Stop and say so.
   - Exit code 3: the text could not be extracted. Tell me about the `--file` workaround and stop.
3. Read the whole of `articles/<slug>.md`.
4. Write `storyboards/<slug>.json` following the storyboard rules in CLAUDE.md. Use `storyboards/_sample.json` as the format reference.
5. Do the faithfulness pass.
6. Run `node scripts/render.mjs storyboards/<slug>.json --preview`, open every PNG, fix problems, repeat until clean.
7. Run `node scripts/render.mjs storyboards/<slug>.json`.
8. Add `{ "url", "title", "source", "video": "out/<slug>.mp4", "made": "<today>" }` to `data/history.json` (create it as a JSON array if missing).
9. Reply with the thesis in one line, the idea labels, and the video path. Then open the video (`open out/<slug>.mp4` on Mac, `start` on Windows, `xdg-open` on Linux).
