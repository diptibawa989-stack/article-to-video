# Article → Neon Motion Graphic

This project turns any article link (a blog post, newsletter, Substack, essay, news analysis) into a short vertical (1080×1920) neon motion graphic that explains the whole piece in about 90 seconds.

Commands:
- `/video <url>`: one article → one video.
- `/weekly`: collect recent articles from the sources in `config/feeds.txt`, pick the best ones for the user's topics, and make a video for each.

If the user just pastes a link and asks for a video, run the `/video` workflow in `.claude/commands/video.md`.

## First run
If `node_modules` is missing, run `npm install` in the project root before anything else. Node.js 18 or newer is required. If `node` is not installed, tell the user to install the LTS version from nodejs.org and stop.

## Layout
- `scripts/get-article.mjs <url> [--file text.txt]`: saves the article text to `articles/<slug>.md`. Exit code 2 = paywalled, 3 = could not extract text (tell the user about the `--file` workaround it prints).
- `scripts/render.mjs <storyboard> [--preview]`: validates a storyboard, then renders `out/<slug>.mp4` or preview stills in `out/<slug>-preview/`.
- `scripts/voice.mjs <storyboard>`: voices the narration with ElevenLabs into `public/voice/<slug>/` and writes `storyboards/<slug>.voice.json`.
- `scripts/fetch-week.mjs`: builds `data/candidates.json` for `/weekly`.
- `config/settings.json`: the user's topics, picks per week, lookback days, optional Substack handle, voice settings.
- `config/feeds.txt`: sources for `/weekly`.
- `storyboards/<slug>.json`: what Claude writes. `storyboards/_sample.json` is the reference format.
- `video/src/`: the Remotion template (neon style). Scene lengths come from `video/src/timing-core.mjs`.
- `data/history.json`: videos already made, so `/weekly` never repeats one.

## Writing the storyboard (this is the part that matters)
The video is only as good as the understanding behind it. Read the **entire** article before writing anything.

1. **Find the argument, not the topic.** `thesis` is the one claim the whole piece defends, in one sentence. "This article is about remote work" is a topic. "Remote work rewards people who write well, so writing is now a career skill" is a thesis.
2. **hook**: the question the article answers, phrased so the viewer wants the answer.
3. **ideas**: 3 to 6, in the order the article builds them. Each is one claim that supports the thesis. Skip anecdotes unless the anecdote *is* the point.
   - `headline`: the claim as a full sentence, not a label. ("The ladder assumed nothing would change", not "Career ladders".)
   - `body`: the why or how, in plain words, one or two sentences.
   - `label`: 1 to 4 words for the map scene.
   - `icon` (optional, recommended): one Lucide icon name that captures the idea, e.g. `rocket`, `trending-up`, `users`, `scale`, `lightbulb`, `shield-check`. `render.mjs` rejects names that don't exist and suggests close ones.
   - `visual`: pick the shape that matches how the idea works:
     - `flow`: a sequence or cause → effect chain (2 to 5 `steps`)
     - `contrast`: old vs new, myth vs reality, two options (`left`/`right`, each `{label, points[]}` with up to 3 points)
     - `timeline`: things that happened in order over time (2 to 5 `events`, each `{when, what}`)
     - `funnel`: something that narrows stage by stage (3 to 5 `stages`)
     - `matrix`: a 2×2 with two axes (`xAxis: [low, high]`, `yAxis: [low, high]`, `quadrants: [topLeft, topRight, bottomLeft, bottomRight]`, optional `highlight` 0 to 3 for the quadrant the author argues for)
     - `iceberg`: what's visible vs what's hidden (`above` 1 to 3, `below` 2 to 4)
     - `spectrum`: a position between two extremes (`left`, `right`, `marker` 0 to 100, `markerLabel`)
     - `venn`: two things whose overlap is the point (`left`, `right`, `overlap`)
     - `list`: parallel reasons, examples or signs (2 to 5 `items`)
     - `cycle`: a loop that feeds itself (3 to 5 `nodes`)
     - `stat`: one striking number **the author actually gives** (`value`, `label`)
     - `bars`: 2 to 5 numbers **the author actually gives**, compared (`items: [{label, value}]`, optional `unit` like `%` or `$`)
     - `quote`: one line where the author's exact words are the point. Max one per video, 25 words max, copied exactly.
   - Never invent or estimate numbers for `stat` or `bars`. No real numbers means a different visual.
   - Prefer the most specific shape that fits: a sequence over time is a `timeline`, not a `list`.
   - Never use the same visual type twice in a row.
4. **mapCenter**: the thesis as a 1 to 4 word label.
5. **takeaway**: for the viewer. What to do or think differently. Concrete, not "reflect on this". If `config/settings.json` lists topics, connect it to them where it fits naturally.
6. **whyPicked** (optional, 90 chars max) and **topics** (optional, up to 3 short tags).
7. **title, author, publication, url** come from the front matter in `articles/<slug>.md`. Leave `author` empty if unknown. Never guess it.
8. Everything except the single quote is **paraphrased**. Plain, specific language. No hype words.
9. **narration**: a spoken script for each scene, keyed by scene: `intro`, `hook`, `thesis`, `idea0`…`ideaN`, `map`, `takeaway`, `outro`. Write it to be heard, not read: short sentences, natural rhythm, contractions, no symbols or abbreviations a voice would stumble on. It should *explain* the on-screen text, not repeat it word for word. Word limits: intro and hook 30, outro 25, thesis and map 40, takeaway 45, each idea 60. Always write narration, even when there is no voice key yet, so a voiceover can be added later.

**Faithfulness pass (required):** after drafting, reread the article and check every headline, body and stat against it. Remove anything the author did not say or clearly imply. If the page is a news brief, link list, product announcement or anything without a real argument, say it is a poor fit and ask before making the video.

**Visual QA (required):** run `node scripts/render.mjs storyboards/<slug>.json --preview` and open every PNG in `out/<slug>-preview/`. Look for clipped, overlapping, crammed or hard-to-read text. Fix by shortening storyboard text first, and only change `video/src` code for real layout bugs. Repeat until clean (3 rounds max), then render the MP4.

`render.mjs` enforces character and word limits (`--check` validates without rendering). If it rejects a storyboard, fix the fields it names.

## Voiceover (ElevenLabs, optional)
If `.env` contains `ELEVENLABS_API_KEY` and `voice.enabled` in `config/settings.json` isn't `false`, run `node scripts/voice.mjs storyboards/<slug>.json` after the storyboard passes `--check` and before the preview. Scenes then stretch to fit their narration. Clips are cached, so editing one scene's narration only re-voices that scene. Exit code 4 means no key: carry on with a silent video and mention once that a voiceover can be added (see README). Exit code 5 is an API or network error: report it, then carry on silently. Never print, log or commit the key.

## Ranking articles for /weekly
Score each candidate out of 10:
- **Topic fit (0 to 4):** how central the user's `topics` are to the piece.
- **Argument (0 to 3):** makes a clear, original case. Roundups, link lists, promos, sponsored posts and show notes score 0.
- **Usefulness (0 to 2):** something the viewer can apply or learn from.
- **Signal (0 to 1):** strong engagement where available (likes, comments).

Max one pick per source per week. Skip anything paywalled or already in `data/history.json`. If fewer than `picksPerWeek` articles score 6 or more, make fewer videos rather than weak ones.

## Style
Neon on near-black: cyan `#00F0FF`, pink `#FF2BD6`, lime `#C6FF3D`, violet `#9D6BFF`, amber `#FFB23D`. Space Grotesk for text, JetBrains Mono for labels. Palette and fonts live in `video/src/theme.ts`. Keep this look unless the user asks for a change.

## Boundaries
- Only use articles the user can read for free or has given you the text of. Never use logins, cookies or paywall workarounds.
- Videos are personal summaries. If the user wants to post one publicly, remind them to credit the author and ideally ask first.
