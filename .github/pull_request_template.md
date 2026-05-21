<!--
GitHub auto-loads this file as the default PR body when a contributor
opens a pull request. The structure below is the team's convention --
fill in the sections that apply, delete the rest.
-->

## Summary

<!-- One or two sentences describing what this PR changes and why. -->


## Changes

<!--
A bulleted list of the concrete changes in this PR. For a small PR,
one or two bullets is fine. For a large overhaul, group changes by
subsystem (Frontend, Metadata Generation, MCP server, etc.).
-->

- 


## Testing

<!--
How was this PR tested? Local commands, screenshots, CI status, etc.
For UI changes: mention which routes you exercised and at which
viewport widths if mobile responsiveness is in scope.
-->


## Smithsonian-grade quality checklist

<!--
For PRs that touch the metadata generation pipeline, the chat / summary
prompts, the rubric, the human-review queue, or the ground-truth corpus:
confirm each item below. Skip the entire section if the PR doesn't
touch those surfaces.
-->

- [ ] If summaries are affected, the dual-scoring path (USE_DUAL_SCORING) was exercised at least once
- [ ] If a prompt was edited, the eval_sys_prompt and eval_user_prompt in the Flask UI's Tuning step were re-tested
- [ ] If civil_rights_facts.json changed, `python scripts/validate_facts.py` passed locally
- [ ] If a new event/person was added to civil_rights_facts.json, the wikipedia_title points at the correct article and dates/names were cross-checked
- [ ] If the review_queue Firestore schema changed, both the Python producer (`processor/review_queue.py`) and the React consumer (`src/pages/ReviewQueue.jsx` + `src/services/reviewQueue.js`) were updated together

## Rollback plan

<!--
For a destructive or risky change (Firebase schema, Cloud Function
behavior, deploy config), what's the path back if something breaks?
"Revert this commit" is fine when the change is genuinely reversible;
explicit instructions if it isn't.
-->


## Related issues / context

<!-- Links to GitHub issues, Slack threads, design docs, etc. -->
