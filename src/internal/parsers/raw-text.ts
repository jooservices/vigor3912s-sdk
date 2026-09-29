/**
 * The one raw-text parser. DrayOS documents no structured response for most
 * commands (acknowledgements, free-form status text), so their output is the
 * trimmed text, never an invented DTO. Family `shared.ts` modules re-export
 * this so every parser keeps its local import.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
