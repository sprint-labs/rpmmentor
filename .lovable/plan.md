## Per-field Accept/Reject in the conflict banner

Replace the current staged Mine/Theirs toggle + Apply merge flow with instant per-row actions in the diff table.

### Behavior

- Each diff row gets two buttons: **Accept** (take remote / theirs) and **Reject** (keep local / mine).
- Clicking either button applies just that field to the form immediately via `applySnapshot` with only that key overridden, then marks the row resolved.
- Resolved rows collapse to a subtle "Accepted remote" / "Kept local" state with an **Undo** link that returns the row to the pending state (and reverts that field's value in the form).
- When every row is resolved, the banner auto-finalizes: `overwriteDraft` is called with the merged snapshot at a bumped version, `savedAt` updates, and the conflict clears. On failure we surface the existing error state and keep the banner open.
- Row resolution state resets whenever a new `conflict` arrives.
- Header counter changes from "N mine · M theirs" to "X of Y resolved".

### UI changes (conflict banner only)

- Remove the "Take" column's pill toggle and the footer **Apply merge** button.
- New per-row action cell: `[Reject] [Accept]` for pending rows; `Accepted remote · Undo` / `Kept local · Undo` for resolved rows.
- Keep the existing **Keep mine (all)** and **Use theirs (all)** shortcut buttons in the footer unchanged.

### Technical notes

- File touched: `src/components/workflows.tsx` only.
- Replace `mergeSelections` state with `resolutions: Record<string, "accepted" | "rejected">` (accepted = remote applied, rejected = local kept).
- On each click, compute the new resolutions map, then rebuild the field's value from either `conflict.snapshot[key]` (accept) or the pre-conflict local `currentSnapshot()[key]` captured once when the conflict arrived (reject). Store that captured local snapshot in a ref so Undo and mixed resolutions stay consistent even after other fields have been mutated.
- Auto-finalize effect: when `Object.keys(resolutions).length === diffRows.length`, run the same `overwriteDraft` path today's `applyMerge` uses, then clear conflict + resolutions.
- No changes to `draft-store.ts`, no schema/backend changes, no new deps.
