/**
 * `fs` domain -- live-firmware-recon bare reads (`cli.fs.*`).
 *
 * Sibling `vigor3912s-mcp` `fs` family consulted read-only as evidence.
 * All three commands are no-argument reads; parsers reduce to trimmed raw
 * text (YAGNI -- no documented machine schema).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseFsInfo } from "../internal/parsers/fs/info.js";
import { parseFsLs } from "../internal/parsers/fs/ls.js";
import { parseFsPwd } from "../internal/parsers/fs/pwd.js";
import type { RawCommandOutput } from "../internal/parsers/fs/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

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

export const operations: readonly TypedOperation<never, unknown>[] = [fsLs, fsInfo, fsPwd];
