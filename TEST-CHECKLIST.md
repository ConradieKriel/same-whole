# Same Whole — test checklist

## Automated checks run for this build

- `npm test`: 10 tests passed.
- `node --check app.js`: passed.
- `node --check math-logic.js`: passed.
- `python -m json.tool lesson-content.json`: passed.
- Static checks: viewport metadata, local lesson file loading, no remote script/image URLs, responsive breakpoint, reduced-motion support and user-triggered speech controls all passed.

A complete interactive browser session and a real phone test were not available in the build environment. Complete the manual checks below before handing in the public link.

## Manual checks

1. Open the page at a phone width around 360–390px. Check that the text, fraction inputs and buttons fit without horizontal scrolling.
2. Go through Explain, then Watch. Confirm only one worked line appears at a time. Use Previous line and Next line, including after reaching the end.
3. In Try one together, enter `8` as the common denominator for `1/2 + 1/6`. It should explain that 8 is not a common denominator. Then enter `6` and continue with `3/6`, `1/6`, `4`, and `2/3`.
4. Try a valid larger common denominator: use `12`, then `6/12`, `2/12`, `8`, and `2/3`. It should accept the equivalent working.
5. Use Need a hint? on a line. Confirm the hint is visible and can be hidden again.
6. Use Previous line during the guided exercise, change the answer, and continue.
7. In On your own, solve `2/5 + 1/10` using `10`, `4/10`, `1/10`, `5`, and `1/2`.
8. Enter `5/10` as the final answer. The tutor should say the value is right but the fraction still needs simplifying. Change it to `1/2` and check again.
9. Try the optional Read aloud button. No speech should play until it is pressed. Use Stop reading to stop it. Confirm the same words are visible on screen.
10. Open the browser's responsive view and test at laptop width. Try keyboard-only navigation and visible focus as well.
11. Ask a classmate who has not seen the tutorial to complete it without help. Note where they hesitate and revise the lesson content if needed.

## Correct answer summary

- Worked: `2/3 + 1/4 = 8/12 + 3/12 = 11/12`.
- Together: `1/2 + 1/6 = 3/6 + 1/6 = 4/6 = 2/3`.
- On your own: `2/5 + 1/10 = 4/10 + 1/10 = 5/10 = 1/2`.

## Final independent-practice checks

- [ ] Enter the final stage and confirm only the current working line is shown.
- [ ] Enter an incorrect answer and confirm the learner stays on that line with feedback.
- [ ] Enter a valid line and confirm it moves to the next line while keeping completed working visible.
- [ ] Use the previous-line control and confirm later answers are cleared so they must be worked again.
- [ ] Complete the question and confirm a **New question** button appears.
- [ ] Click **New question** and confirm the final exercise changes, but the worked example and guided example stay exactly the same.
- [ ] Complete a second random question and confirm the same five-step method is used.
