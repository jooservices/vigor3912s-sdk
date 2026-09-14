/**
 * `object` domain -- Wave 4 family task extension.
 *
 * Implements classified `cli.object.*` entries. Profile headings that also
 * document mutating flag sets are YAGNI-narrowed to the canonical name-set
 * (or enable) example from the vendor text; remaining flags stay deferred
 * with comments at each operation.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseIpObjView, type IpObjectProfileReport } from "../internal/parsers/object/ip-obj.js";
import {
  parseServiceObjView,
  type ServiceObjectProfileReport,
} from "../internal/parsers/object/service-obj.js";
import { parseIpGrp } from "../internal/parsers/object/ip-grp.js";
import { parseIpv6Obj } from "../internal/parsers/object/ipv6-obj.js";
import { parseIpv6Grp } from "../internal/parsers/object/ipv6-grp.js";
import { parseCountry } from "../internal/parsers/object/country.js";
import { parseServiceGrp } from "../internal/parsers/object/service-grp.js";
import { parseKw } from "../internal/parsers/object/kw.js";
import { parseFe } from "../internal/parsers/object/fe.js";
import { parseSms } from "../internal/parsers/object/sms.js";
import { parseMail } from "../internal/parsers/object/mail.js";
import { parseNoti } from "../internal/parsers/object/noti.js";
import { parseSchedule } from "../internal/parsers/object/schedule.js";
import type { RawCommandOutput } from "../internal/parsers/object/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

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

const SINGLE_CLI_TOKEN_PATTERN = /^\S+$/;

function assertProfileName(value: string, name: string): void {
  if (!SINGLE_CLI_TOKEN_PATTERN.test(value)) {
    throw new Error(
      `${name} must be a single non-empty token with no whitespace (got "${value}").`,
    );
  }

  if (value.length > 15) {
    throw new Error(`${name} must be at most 15 characters (got ${String(value.length)}).`);
  }
}

// ---------------------------------------------------------------------------
// cli.object.ip.obj -- read-only view sub-form.
// ---------------------------------------------------------------------------

export interface ObjectIpObjViewInput {
  readonly index: number;
}

function buildIpObjViewFrames(input: ObjectIpObjViewInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, 1, 255, "index");

  return [frameSingleCommand(`object ip obj ${String(input.index)} -v`)];
}

export const objectIpObjView: TypedOperation<ObjectIpObjViewInput, IpObjectProfileReport> = {
  manifestId: "cli.object.ip.obj",
  classification: "read",
  buildFrames: buildIpObjViewFrames,
  parse: (exchanges) => parseIpObjView(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.object.service.obj -- read-only view sub-form.
// ---------------------------------------------------------------------------

export interface ObjectServiceObjViewInput {
  readonly index: number;
}

function buildServiceObjViewFrames(input: ObjectServiceObjViewInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, 1, 255, "index");

  return [frameSingleCommand(`object service obj ${String(input.index)} -v`)];
}

export const objectServiceObjView: TypedOperation<
  ObjectServiceObjViewInput,
  ServiceObjectProfileReport
> = {
  manifestId: "cli.object.service.obj",
  classification: "read",
  buildFrames: buildServiceObjViewFrames,
  parse: (exchanges) => parseServiceObjView(firstExchangeText(exchanges)),
};

export interface ObjectNamedProfileInput {
  readonly index: number;
  readonly name: string;
}

function buildNamedProfileFrames(
  commandPrefix: string,
  input: ObjectNamedProfileInput,
  maxIndex: number,
): readonly CommandFrame[] {
  assertIntegerInRange(input.index, 1, maxIndex, "index");
  assertProfileName(input.name, "name");

  return [frameSingleCommand(`${commandPrefix} ${String(input.index)} -n ${input.name}`)];
}

// ---------------------------------------------------------------------------
// cli.object.ip.grp -- YAGNI: name-set only (`-v/-i/-a/setdefault` deferred).
// ---------------------------------------------------------------------------

export const objectIpGrp: TypedOperation<ObjectNamedProfileInput, RawCommandOutput> = {
  manifestId: "cli.object.ip.grp",
  classification: "write",
  buildFrames: (input) => buildNamedProfileFrames("object ip grp", input, 255),
  parse: (exchanges) => parseIpGrp(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.object.ipv6.obj -- YAGNI: name-set only.
// ---------------------------------------------------------------------------

export const objectIpv6Obj: TypedOperation<ObjectNamedProfileInput, RawCommandOutput> = {
  manifestId: "cli.object.ipv6.obj",
  classification: "write",
  buildFrames: (input) => buildNamedProfileFrames("object ipv6 obj", input, 255),
  parse: (exchanges) => parseIpv6Obj(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.object.ipv6.grp -- YAGNI: name-set only.
// ---------------------------------------------------------------------------

export const objectIpv6Grp: TypedOperation<ObjectNamedProfileInput, RawCommandOutput> = {
  manifestId: "cli.object.ipv6.grp",
  classification: "write",
  buildFrames: (input) => buildNamedProfileFrames("object ipv6 grp", input, 255),
  parse: (exchanges) => parseIpv6Grp(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.object.country -- YAGNI: `object country set INDEX -n NAME` only.
// ---------------------------------------------------------------------------

export const objectCountry: TypedOperation<ObjectNamedProfileInput, RawCommandOutput> = {
  manifestId: "cli.object.country",
  classification: "write",
  buildFrames: (input) => {
    assertIntegerInRange(input.index, 1, 32, "index");
    assertProfileName(input.name, "name");

    return [frameSingleCommand(`object country set ${String(input.index)} -n ${input.name}`)];
  },
  parse: (exchanges) => parseCountry(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.object.service.grp -- YAGNI: name-set only.
// ---------------------------------------------------------------------------

export const objectServiceGrp: TypedOperation<ObjectNamedProfileInput, RawCommandOutput> = {
  manifestId: "cli.object.service.grp",
  classification: "write",
  buildFrames: (input) => buildNamedProfileFrames("object service grp", input, 255),
  parse: (exchanges) => parseServiceGrp(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.object.kw -- YAGNI: `object kw obj INDEX -n NAME` only.
// ---------------------------------------------------------------------------

export const objectKw: TypedOperation<ObjectNamedProfileInput, RawCommandOutput> = {
  manifestId: "cli.object.kw",
  classification: "write",
  buildFrames: (input) => buildNamedProfileFrames("object kw obj", input, 255),
  parse: (exchanges) => parseKw(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.object.fe -- YAGNI: `object fe obj INDEX -n NAME` only (index 1-8).
// ---------------------------------------------------------------------------

export const objectFe: TypedOperation<ObjectNamedProfileInput, RawCommandOutput> = {
  manifestId: "cli.object.fe",
  classification: "write",
  buildFrames: (input) => buildNamedProfileFrames("object fe obj", input, 8),
  parse: (exchanges) => parseFe(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.object.sms -- YAGNI: `object sms obj INDEX -n NAME` only (index 1-10).
// ---------------------------------------------------------------------------

export const objectSms: TypedOperation<ObjectNamedProfileInput, RawCommandOutput> = {
  manifestId: "cli.object.sms",
  classification: "write",
  buildFrames: (input) => buildNamedProfileFrames("object sms obj", input, 10),
  parse: (exchanges) => parseSms(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.object.mail -- YAGNI: `object mail obj INDEX -n NAME` only (index 1-10).
// ---------------------------------------------------------------------------

export const objectMail: TypedOperation<ObjectNamedProfileInput, RawCommandOutput> = {
  manifestId: "cli.object.mail",
  classification: "write",
  buildFrames: (input) => buildNamedProfileFrames("object mail obj", input, 10),
  parse: (exchanges) => parseMail(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.object.noti -- YAGNI: `object noti obj INDEX -n NAME` only (index 1-8).
// ---------------------------------------------------------------------------

export const objectNoti: TypedOperation<ObjectNamedProfileInput, RawCommandOutput> = {
  manifestId: "cli.object.noti",
  classification: "write",
  buildFrames: (input) => buildNamedProfileFrames("object noti obj", input, 8),
  parse: (exchanges) => parseNoti(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.object.schedule -- YAGNI: enable flag only (`-e`); other schedule
// fields deferred.
// ---------------------------------------------------------------------------

export interface ObjectScheduleInput {
  readonly index: number;
  readonly enabled: boolean;
}

export const objectSchedule: TypedOperation<ObjectScheduleInput, RawCommandOutput> = {
  manifestId: "cli.object.schedule",
  classification: "write",
  buildFrames: (input) => {
    assertIntegerInRange(input.index, 1, 15, "index");

    return [
      frameSingleCommand(
        `object schedule set ${String(input.index)} -e ${input.enabled ? "1" : "0"}`,
      ),
    ];
  },
  parse: (exchanges) => parseSchedule(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  objectIpObjView,
  objectServiceObjView,
  objectIpGrp,
  objectIpv6Obj,
  objectIpv6Grp,
  objectCountry,
  objectServiceGrp,
  objectKw,
  objectFe,
  objectSms,
  objectMail,
  objectNoti,
  objectSchedule,
];
