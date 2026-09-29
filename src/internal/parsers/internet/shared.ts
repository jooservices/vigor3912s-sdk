/**
 * Shared minimal parsing helper for the `internet` domain.
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5's parser signature). Reused across
 * this family's operations whose documented samples are free-form
 * acknowledgement / status text (no single fixed structured table).
 */

export { parseRawText, type RawCommandOutput } from "../raw-text.js";
