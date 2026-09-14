/**
 * Shared minimal parsing helper for unstructured `object` write operations.
 *
 * Structured profile views (ip-obj / service-obj) keep dedicated parsers.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
