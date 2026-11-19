# Same Whole

A phone-first interactive maths tutorial for learners aged 13–16. It teaches adding fractions with different denominators through four parts: Explain, Watch a worked example, Try one together, and On your own.

## Run locally

This is a frontend-only project. It has no login, database, AI service, API key or external runtime dependency.

1. Install Node.js 20 or newer (only needed to run the tests).
2. Open this folder in a terminal.
3. Run `npm test` to run the maths and lesson-content checks.
4. Start a local static server from this folder. For example, with Python installed on Windows:

   ```powershell
   py -m http.server 3000
   ```

5. Open `http://localhost:3000`.

Do not open `index.html` by double-clicking it. The browser needs to fetch `lesson-content.json` over HTTP.

## Deploy to Vercel

1. Push this folder to a new GitHub repository.
2. In Vercel, import that repository.
3. Set Framework Preset to **Other**.
4. Leave Build Command and Install Command empty.
5. Set Output Directory to `.`.
6. Deploy. No environment variables are required.

The project is static HTML, CSS, JavaScript and JSON. It does not need Supabase or Gemini.

## Lesson content

All explanations, examples, tutor feedback, prompts, hints, and accepted-answer rules are stored in `lesson-content.json`. The application logic in `app.js` renders those fields and applies generic fraction-checking rules from `math-logic.js`.

To author a different tutorial, replace the content in `lesson-content.json` while preserving its structure and step kinds, or adapt the generic checking logic for a different mathematical concept. The current examples, explanations, hints, tutor feedback and answer rules are original writing for this tutorial.

## Design decisions

- Warm paper, ink, olive and rust palette instead of a generic purple-glow SaaS look.
- Editorial workbook layout with left-aligned type and a restrained tutor portrait.
- No decorative card grid, testimonials, fake metrics, points, badges, streaks or leaderboard.
- The learner controls pacing and can move back through completed sections.
- Hints are always available in both practice sections.
- Optional text-to-speech only starts when the learner presses “Read aloud”; the same words remain visible.
- Responsive layout prioritises 360px-wide phones, with a two-column learning layout on larger screens.
- Reduced-motion preferences are respected; no autoplay or hover-only interactions.

## Testing

Run `npm test` for the automated maths and content checks. See `TEST-CHECKLIST.md` for the required phone, keyboard, speech and classmate checks before handing in the public link.

## Accessibility notes

Semantic headings, labelled fraction inputs, keyboard operable controls, visible focus, live feedback, non-colour status cues, and responsive touch targets are included. Please test with a keyboard and on an actual phone before submitting.

## Independent practice

The final stage shows one working line at a time. Learners must check each line before moving on; completed lines remain visible above the current line. After finishing, they can choose **New question** to receive a different question from the lesson's curated question bank. The worked example and together example never change.

The practice bank contains 18 curated questions. The first independent question remains `2/5 + 1/10`; selecting **New question** chooses a different bank item at random and will not immediately repeat the current one.
