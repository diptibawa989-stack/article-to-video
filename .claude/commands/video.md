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
5. Do the faithfulness pass, then run `node scripts/render.mjs storyboards/<slug>.json --check` and fix anything it flags.
6. Voiceover: if `.env` has `ELEVENLABS_API_KEY`, run `node scripts/voice.mjs storyboards/<slug>.json`. If it exits with code 4 or 5, continue without a voice and tell me once at the end.
7. Run `node scripts/render.mjs storyboards/<slug>.json --preview`, open every PNG, fix problems, repeat until clean. If you edit narration, re-run step 6 (only changed scenes get re-voiced).
8. Run `node scripts/render.mjs storyboards/<slug>.json`.
9. Add `{ "url", "title", "source", "video": "out/<slug>.mp4", "made": "<today>" }` to `data/history.json` (create it as a JSON array if missing).
10. Reply with the thesis in one line, the idea labels, the video path, and whether it has a voiceover. Then open the video (`open out/<slug>.mp4` on Mac, `start` on Windows, `xdg-open` on Linux).
