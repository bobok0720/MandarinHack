# MandarinHack Requirements

## Core Data Handling
- On load, initialize the spaced-repetition deck from `localStorage` using the `hsk6-srs-data-v2` key; if no data exists or parsing fails, fall back to the built-in HSK 6 seed list.
- Persist any card updates back to `localStorage` whenever the in-memory deck changes and contains at least one card.
- Provide an option to reset all saved progress, clearing storage and reloading the default HSK 6 list.

## Study Flows
- Dashboard offers two primary actions: start a review session or learn new vocabulary.
- Starting review filters cards whose `nextReviewDate` is due, sorted by earliest date; if none are due, surface a user-facing alert and keep the user on the dashboard.
- Learning new words triggers generation of a 5-word batch via `generateVocabBatch`, excluding existing words by `hanzi`; append the new cards to the deck and prompt to begin reviewing them immediately.
- Maintain a session queue for the active study run and track the current card index; show a progress indicator with current position and total count.
- When a study session finishes (including any re-queued cards), notify completion, return to the dashboard, and clear the session queue state.

## Spaced-Repetition Grading
- Apply `calculateReview` with the provided `SRSGrade` to update card scheduling metadata, and store the resulting fields back onto the card in the deck.
- If a card is graded `AGAIN`, re-queue the updated card at the end of the current session to reinforce difficult items.
- Advance to the next card after grading; when the final card is processed and no additional re-queued cards remain, end the session.

## Flashcard Presentation
- Show the current card’s `hanzi` prominently; reveal `pinyin` only after an answer is submitted.
- Replace free-form meaning input with a multiple-choice interaction: four options composed of the correct definition plus up to three distractors sampled from other cards’ definitions.
- Deduplicate and shuffle answer options; reset the selection and internal state whenever the active card changes.
- Allow the learner to mark uncertainty via an "I don't know" action without selecting an option, immediately flagging the response as incorrect.
- After submission, display correctness feedback with tailored messaging, include the correct definition, and show example sentence plus translation.
- Provide a single continuation control that grades the card (`GOOD` for correct answers, `AGAIN` otherwise) and advances to the next queued item.

## Error Handling and UX Polishing
- Expose clear error messaging when vocabulary generation fails, and let the user dismiss the alert.
- Keep interactive controls accessible: focus the first answer option when awaiting input, disable "Check Answer" until an option is selected, and preserve intuitive styling for selected versus unselected choices.
