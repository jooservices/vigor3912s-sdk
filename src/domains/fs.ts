/**
 * `fs` domain -- live-firmware-recon bare reads (`cli.fs.*`).
 *
 * Sibling `vigor3912s-mcp` `fs` family consulted read-only as evidence.
 * All three commands are no-argument reads; parsers reduce to trimmed raw
 * text (YAGNI -- no documented machine schema).
 */

import { InvalidInputError } from "../errors.js";
import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseFsInfo } from "../internal/parsers/fs/info.js";
import { parseFsLs } from "../internal/parsers/fs/ls.js";
import { parseFsPwd } from "../internal/parsers/fs/pwd.js";
import type { RawCommandOutput } from "../internal/parsers/fs/shared.js";
import {
  defineCommandOperation,
  defineRawOperation,
  firstExchangeText,
} from "../internal/domain-support.js";

function buildLsFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("fs ls")];
}

export const fsLs: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.fs.ls",
  classification: "read",
  buildFrames: buildLsFrames,
  parse: (exchanges) => parseFsLs(firstExchangeText(exchanges)),
};

function buildInfoFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("fs info")];
}

export const fsInfo: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.fs.info",
  classification: "read",
  buildFrames: buildInfoFrames,
  parse: (exchanges) => parseFsInfo(firstExchangeText(exchanges)),
};

function buildPwdFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("fs pwd")];
}

export const fsPwd: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.fs.pwd",
  classification: "read",
  buildFrames: buildPwdFrames,
  parse: (exchanges) => parseFsPwd(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// File operations from the fw 4.4.7_RC2 help (`references/live-help-fw-
// 4.4.7_RC2.txt`, live-firmware-recon). `format` wipes the "/" partition and
// `rm` deletes files/directories: destructive.
// ---------------------------------------------------------------------------

/** A single file/directory name or path: no whitespace, quotes or control characters. */
function assertFsPath(value: string, name: string): void {
  if (!/^[^\s"'\p{Cc}-][^\s"'\p{Cc}]*$/u.test(value)) {
    throw new InvalidInputError(
      `${name} must be a single path token without spaces or quotes, not starting with "-" (got "${value}").`,
    );
  }
}

export interface FsPathInput {
  readonly path: string;
}

export interface FsSourceTargetInput {
  readonly source: string;
  readonly target: string;
}

function pathOperation(manifestId: string, classification: "read" | "write", verb: string) {
  return defineRawOperation<FsPathInput>(manifestId, classification, (input) => {
    assertFsPath(input.path, "path");
    return `fs ${verb} ${input.path}`;
  });
}

function sourceTargetOperation(manifestId: string, verb: string) {
  return defineRawOperation<FsSourceTargetInput>(manifestId, "write", (input) => {
    assertFsPath(input.source, "source");
    assertFsPath(input.target, "target");
    return `fs ${verb} ${input.source} ${input.target}`;
  });
}

/** `fs format`: formats the "/" partition. */
export const fsFormat = defineCommandOperation("cli.fs.format", "destructive", "fs format");
export const fsMkfile = pathOperation("cli.fs.mkfile", "write", "mkfile");
export const fsMkdir = pathOperation("cli.fs.mkdir", "write", "mkdir");
export const fsCd = pathOperation("cli.fs.cd", "write", "cd");
export const fsCat = pathOperation("cli.fs.cat", "read", "cat");
/** `fs test <file>`: writes a predefined test string into the file. */
export const fsTest = pathOperation("cli.fs.test", "write", "test");
export const fsRen = sourceTargetOperation("cli.fs.ren", "ren");
export const fsCp = sourceTargetOperation("cli.fs.cp", "cp");

export interface FsRmInput {
  /** File or directory to delete. */
  readonly path: string;
  /** Directory the path is relative to; the help example passes `"/"`. */
  readonly directory?: string;
}

/** `fs rm <dir|file> ["<dir>"]`: deletes a file or directory. */
export const fsRm = defineRawOperation<FsRmInput>("cli.fs.rm", "destructive", (input) => {
  assertFsPath(input.path, "path");

  if (input.directory === undefined) {
    return `fs rm ${input.path}`;
  }

  assertFsPath(input.directory, "directory");
  return `fs rm ${input.path} "${input.directory}"`;
});

export const operations: readonly TypedOperation<never, unknown>[] = [
  fsLs,
  fsInfo,
  fsPwd,
  fsFormat,
  fsMkfile,
  fsMkdir,
  fsRm,
  fsRen,
  fsCd,
  fsCp,
  fsCat,
  fsTest,
];
