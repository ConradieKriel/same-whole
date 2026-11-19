# Same Whole update: stepwise independent practice

This update keeps the existing Same Whole visual design and the first three tutorial stages.

## Changes

- The final **On your own** stage now shows only the current line of working.
- Learners must submit each line and receive feedback before the next line appears.
- Correctly completed lines remain visible above the current line.
- Learners can go back one line; later lines are cleared so they must be worked again.
- After the learner completes all five lines, a **New question** button appears.
- The button selects a different question at random from the 18-question bank in `lesson-content.json` and avoids repeating the current question immediately.
- The worked example (`2/3 + 1/4`) and guided example (`1/2 + 1/6`) have not changed.
- The visible age label remains removed. The script also safely handles the audience label being absent.

## Files changed

- `app.js`: step-by-step independent practice and question switching
- `math-logic.js`: random question selection helper
- `lesson-content.json`: step templates, tutor copy and curated question bank
- `styles.css`: styling for the current working line and new-question action
- `index.html`: keep the visible age label removed
- `tests/lesson.test.mjs`: tests for the question bank and random selection
- `README.md`, `DESIGN-NOTES.md`, `TEST-CHECKLIST.md`: updated documentation

## Verification

Run `npm test` from this folder. The current automated suite has 13 passing tests.
