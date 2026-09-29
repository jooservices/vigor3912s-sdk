/**
 * Shared minimal parsing helper for the `apm` domain.
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5). Most `apm` commands only return
 * free-form acknowledgement or table text with no formally specified field
 * grammar -- inventing a richer DTO would assert detail the vendor
 * documentation does not support.
 */

export { parseRawText, type RawCommandOutput } from "../raw-text.js";
