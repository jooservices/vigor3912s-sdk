/**
 * Capability manifest schema types.
 *
 * Type-only module: no runtime logic and no manifest data live here. The
 * generated manifest data itself is produced by a later task
 * (`tools/generate-capability-manifest.ts` -> `capability-manifest.generated.ts`).
 *
 * Shape mirrors `ARCHITECTURE.md`'s "Item 1 — capability manifest" section
 * verbatim; do not add fields beyond what is documented there.
 */

export type Classification = "read" | "write" | "destructive" | "interactive" | "unknown";

export type ClassificationBasis =
  | "documented-syntax"
  | "command-map-family"
  | "operations-danger-list"
  | "sibling-live-verified"
  | "unclassified";

export type CapabilityStatus = "documented" | "implemented" | "blocked-by-documentation";

export type Citation =
  | { readonly corpus: "user-guide-part-viii"; readonly rawLine: number; readonly pdfPage: number }
  | { readonly corpus: "webui-capture"; readonly captureFile: string; readonly indexRow: number }
  | {
      readonly corpus: "live-firmware-recon";
      readonly firmware: "4.4.7_RC2";
      readonly evidenceRef: string;
    };

export interface CapabilityEntryBase {
  readonly id: string;
  readonly title: string;
  readonly citation: Citation;
  readonly classification: Classification;
  readonly classificationBasis: ClassificationBasis;
  readonly status: CapabilityStatus;
  readonly blockedReason?: string;
  readonly operationIds: readonly string[];
}

export interface CliCapabilityEntry extends CapabilityEntryBase {
  readonly kind: "cli-command";
  readonly command: string;
  readonly commandPath: readonly string[];
  readonly firmwareBasis: "user-guide-v4.3.5.1" | "live-recon-4.4.7_RC2";
  readonly verifiedOnFirmware: null | "4.4.7_RC2";
}

export interface WebUiCapabilityEntry extends CapabilityEntryBase {
  readonly kind: "webui-page";
  readonly menuPath: string;
  readonly captureStatus: "ok" | "js-empty";
  readonly firmwareBasis: "live-capture-4.4.7_RC2";
}

export type CapabilityEntry = CliCapabilityEntry | WebUiCapabilityEntry;
