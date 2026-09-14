/**
 * `usb` domain -- Wave 4 Item5-usb (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements classified `cli.usb.*` entries including previously deferred
 * `usb user` list/rm/enable/disable forms. `usb user add` stays deferred
 * (no dedicated manifest id in this task's documented set).
 *
 * `usb temp` (rawLine 9211) documents both a mutating `set <...>` sub-form
 * and two read-only sub-forms (`show`, `all_data`) under one heading --
 * narrowed here to the two read sub-forms only, same pattern as `wan.ts`'s
 * `cli.wan.detect` narrowing.
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/usb/*.ts` (`ARCHITECTURE.md` Item 5's parser signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseDevstat, type UsbDeviceStatusReport } from "../internal/parsers/usb/devstat.js";
import { parseTemp, type UsbTempReport } from "../internal/parsers/usb/temp.js";
import { parseUserList } from "../internal/parsers/usb/user-list.js";
import { parseUserRm } from "../internal/parsers/usb/user-rm.js";
import { parseUserEnable } from "../internal/parsers/usb/user-enable.js";
import { parseUserDisable } from "../internal/parsers/usb/user-disable.js";
import { parseDisk } from "../internal/parsers/usb/disk.js";
import type { RawCommandOutput } from "../internal/parsers/usb/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

function assertOneOf<T extends string>(value: T, allowed: readonly T[], name: string): void {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `${name} must be one of ${allowed.map((entry) => `"${entry}"`).join(", ")} (got "${value}").`,
    );
  }
}

// ---------------------------------------------------------------------------
// cli.usb.devstat -- `usb devstat` (rawLine 9154) -- no-argument read query.
// ---------------------------------------------------------------------------

function buildDevstatFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("usb devstat")];
}

export const usbDevstat: TypedOperation<void, UsbDeviceStatusReport> = {
  manifestId: "cli.usb.devstat",
  classification: "read",
  buildFrames: buildDevstatFrames,
  parse: (exchanges) => parseDevstat(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.usb.temp -- `usb temp show` / `usb temp all_data` (rawLine 9211) --
// canonical read sub-forms only (`usb temp set <...>` is a deliberate
// out-of-scope write sub-form, narrowed out).
// ---------------------------------------------------------------------------

export interface UsbTempInput {
  readonly action: "show" | "allData";
}

function buildTempFrames(input: UsbTempInput): readonly CommandFrame[] {
  assertOneOf(input.action, ["show", "allData"], "action");

  const commandSuffix = input.action === "show" ? "show" : "all_data";

  return [frameSingleCommand(`usb temp ${commandSuffix}`)];
}

export const usbTemp: TypedOperation<UsbTempInput, UsbTempReport> = {
  manifestId: "cli.usb.temp",
  classification: "read",
  buildFrames: buildTempFrames,
  parse: (exchanges) => parseTemp(firstExchangeText(exchanges)),
};

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer (got ${String(value)}).`);
  }
}

function assertIntegerInRange(value: number, min: number, max: number, name: string): void {
  assertInteger(value, name);

  if (value < min || value > max) {
    throw new Error(
      `${name} must be between ${String(min)} and ${String(max)} (got ${String(value)}).`,
    );
  }
}

function assertUsbUserIndex(index: number): void {
  assertIntegerInRange(index, 1, 16, "index");
}

// ---------------------------------------------------------------------------
// cli.usb.user.list -- `usb user list` (rawLine 9161) -- read.
// ---------------------------------------------------------------------------

function buildUserListFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("usb user list")];
}

export const usbUserList: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.usb.user.list",
  classification: "read",
  buildFrames: buildUserListFrames,
  parse: (exchanges) => parseUserList(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.usb.user.rm -- `usb user rm <Index>` (rawLine 9161) -- write.
// ---------------------------------------------------------------------------

export interface UsbUserIndexInput {
  readonly index: number;
}

function buildUserRmFrames(input: UsbUserIndexInput): readonly CommandFrame[] {
  assertUsbUserIndex(input.index);

  return [frameSingleCommand(`usb user rm ${String(input.index)}`)];
}

export const usbUserRm: TypedOperation<UsbUserIndexInput, RawCommandOutput> = {
  manifestId: "cli.usb.user.rm",
  classification: "write",
  buildFrames: buildUserRmFrames,
  parse: (exchanges) => parseUserRm(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.usb.user.enable -- `usb user enable <Index>` (rawLine 9161) -- write.
// ---------------------------------------------------------------------------

function buildUserEnableFrames(input: UsbUserIndexInput): readonly CommandFrame[] {
  assertUsbUserIndex(input.index);

  return [frameSingleCommand(`usb user enable ${String(input.index)}`)];
}

export const usbUserEnable: TypedOperation<UsbUserIndexInput, RawCommandOutput> = {
  manifestId: "cli.usb.user.enable",
  classification: "write",
  buildFrames: buildUserEnableFrames,
  parse: (exchanges) => parseUserEnable(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.usb.user.disable -- `usb user disable <Index>` (rawLine 9161) -- write.
// ---------------------------------------------------------------------------

function buildUserDisableFrames(input: UsbUserIndexInput): readonly CommandFrame[] {
  assertUsbUserIndex(input.index);

  return [frameSingleCommand(`usb user disable ${String(input.index)}`)];
}

export const usbUserDisable: TypedOperation<UsbUserIndexInput, RawCommandOutput> = {
  manifestId: "cli.usb.user.disable",
  classification: "write",
  buildFrames: buildUserDisableFrames,
  parse: (exchanges) => parseUserDisable(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.usb.disk -- `usb disk` (live-firmware-recon) -- no-argument read query.
// ---------------------------------------------------------------------------

function buildDiskFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("usb disk")];
}

export const usbDisk: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.usb.disk",
  classification: "read",
  buildFrames: buildDiskFrames,
  parse: (exchanges) => parseDisk(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  usbDevstat,
  usbTemp,
  usbUserList,
  usbUserRm,
  usbUserEnable,
  usbUserDisable,
  usbDisk,
];
