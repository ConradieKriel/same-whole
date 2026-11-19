# Design rationale

## Direction chosen: an annotated maths workbook

The visual direction borrows the calm hierarchy of a printed maths workbook rather than the usual software landing-page conventions. Warm off-white paper, dark ink, an olive structural colour and one rust accent keep the screen quiet without feeling flat. Georgia is used sparingly for mathematical emphasis and section headings; system sans-serif is used for instructions and controls.

## What was deliberately avoided

- No purple/blue glow, blurred orbs or glass effects.
- No oversized centred hero or two-button sales CTA.
- No repeated three-card feature grid, fake testimonials, logo strip or invented social proof.
- No decorative autoplay, pulsing buttons or hover-only controls.
- No points, badges, streaks or leaderboard. Progress only shows which part of the lesson the learner is in.

## Tutor choice

Mika is represented by a small original vector portrait beside the learning route on desktop and in a compact note on mobile. The avatar is deliberately quiet: the written explanation remains primary. Speech is optional, user-triggered browser text-to-speech; no audio starts automatically.

## Teaching choices

The worked example reveals one line at a time so the explanation can sit beside the exact step it describes. The together activity checks each learner-entered line before moving on. The independent activity asks for all five lines before giving line-by-line feedback, preserving a genuine attempt before intervention.

The fraction fields use separate numerator and denominator inputs. They are easier to tap and edit on a phone than a free-text maths expression, and they avoid needing a special maths keyboard.

The checker accepts any valid common denominator, checks equivalent fractions by cross multiplication, and accepts any equivalent final fraction only if it is in lowest terms. This allows mathematically valid working without accepting an incorrect value.

## Directions considered

1. **Annotated workbook (chosen):** warm paper, strong fraction typography, step-by-step marks and a quiet tutor note. It makes the maths itself the visual focus and suits a learner who is reading and typing on a small screen.
2. **Chalkboard lesson:** dark slate background with chalk-like handwriting. It could feel familiar, but low contrast and decorative handwriting would make multi-line working harder to read on a phone.
3. **Notebook and margin notes:** ruled paper, handwritten annotations and a large illustrated tutor. It has character, but risks making the interface feel younger than the 13–16 audience and crowding the maths.

The workbook direction was chosen because it keeps the work legible, feels appropriate for teenagers, and is easy to explain and maintain.

## Independent practice update

Only one answer step is visible at a time in the final stage. Earlier correct lines stay visible as a record of the learner's own working. A learner can go back one line; later lines are cleared so they can be recomputed. After a correct final answer, a **New question** button selects a different item from the lesson-content question bank. The worked and together examples remain fixed.
