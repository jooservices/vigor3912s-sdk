/**
 * `object` domain -- Wave 4 family task extension.
 *
 * Implements classified `cli.object.*` entries. Profile headings that also
 * document mutating flag sets are YAGNI-narrowed to the canonical name-set
 * (or enable) example from the vendor text; remaining flags stay deferred
 * with comments at each operation.
 */

import { InvalidInputError } from "../errors.js";
import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
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
import {
  assertCliValue,
  assertIntegerInRange,
  assertIpv4,
  assertMaxLength,
  assertOneOf,
  assertPositiveInteger,
  defineCommandOperation,
  defineRawOperation,
  firstExchangeText,
} from "../internal/domain-support.js";

function assertProfileName(value: string, name: string): void {
  assertCliValue(value, name);

  if (value.length > 15) {
    throw new InvalidInputError(
      `${name} must be at most 15 characters (got ${String(value.length)}).`,
    );
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

// ---------------------------------------------------------------------------
// Profile sub-forms (S8): every heading documents `setdefault`, a per-profile
// view (`INDEX -v`), often `show`, and `INDEX -<flag> <value...>` settings.
// `setdefault` returns *all* profiles of that kind to defaults: destructive.
// ---------------------------------------------------------------------------

/** One positional argument of a profile flag, validated before framing. */
type ArgSpec =
  | { readonly kind: "int"; readonly min: number; readonly max: number }
  | { readonly kind: "name" }
  | { readonly kind: "token"; readonly maxLength?: number }
  | { readonly kind: "ipv4" }
  | { readonly kind: "enum"; readonly values: readonly string[] };

interface FlagSpec {
  /** Positional arguments; the first `required` are mandatory. */
  readonly args: readonly ArgSpec[];
  readonly required?: number;
  /** Repeat the single arg spec 1..n times (member lists). */
  readonly repeat?: boolean;
  /** Wrap multiple arguments in double quotes, as the manual requires. */
  readonly quote?: boolean;
}

export interface ObjectProfileSetInput {
  /** Profile index. */
  readonly index: number;
  /** Documented flag letter, without the leading `-` (see the operation's heading). */
  readonly flag: string;
  /** Flag arguments in documented order (none for argument-less flags). */
  readonly values?: readonly (string | number)[];
}

function assertArg(spec: ArgSpec, value: string | number, name: string): string {
  const text = String(value);

  switch (spec.kind) {
    case "int":
      assertIntegerInRange(Number(text), spec.min, spec.max, name);
      break;
    case "name":
      assertProfileName(text, name);
      break;
    case "token":
      assertCliValue(text, name);
      if (spec.maxLength !== undefined) {
        assertMaxLength(text, spec.maxLength, name);
      }
      break;
    case "ipv4":
      assertIpv4(text, name);
      break;
    case "enum":
      assertOneOf(text, spec.values, name);
      break;
  }

  return text;
}

function renderFlag(
  flags: Readonly<Record<string, FlagSpec>>,
  input: ObjectProfileSetInput,
): string {
  const spec = Object.hasOwn(flags, input.flag) ? flags[input.flag] : undefined;

  if (spec === undefined) {
    throw new InvalidInputError(
      `flag must be one of ${Object.keys(flags)
        .map((flag) => `"${flag}"`)
        .join(", ")} (got "${input.flag}").`,
    );
  }

  const values = input.values ?? [];
  const [first] = spec.args;
  const rendered =
    spec.repeat === true && first !== undefined
      ? values.map((value, position) => assertArg(first, value, `values[${String(position)}]`))
      : values.map((value, position) => {
          const argSpec = spec.args[position];

          if (argSpec === undefined) {
            throw new InvalidInputError(
              `flag -${input.flag} takes at most ${String(spec.args.length)} value(s).`,
            );
          }

          return assertArg(argSpec, value, `values[${String(position)}]`);
        });
  const required = spec.repeat === true ? 1 : (spec.required ?? spec.args.length);

  if (rendered.length < required) {
    throw new InvalidInputError(`flag -${input.flag} requires ${String(required)} value(s).`);
  }

  if (rendered.length === 0) {
    return `-${input.flag}`;
  }

  const joined = rendered.join(" ");

  return `-${input.flag} ${spec.quote === true && rendered.length > 1 ? `"${joined}"` : joined}`;
}

function profileSetOperation(
  manifestId: string,
  prefix: string,
  maxIndex: number,
  flags: Readonly<Record<string, FlagSpec>>,
): TypedOperation<ObjectProfileSetInput, RawCommandOutput> {
  return defineRawOperation<ObjectProfileSetInput>(manifestId, "write", (input) => {
    assertIntegerInRange(input.index, 1, maxIndex, "index");
    return `${prefix} ${String(input.index)} ${renderFlag(flags, input)}`;
  });
}

export interface ObjectProfileIndexInput {
  readonly index: number;
}

function profileViewOperation(
  manifestId: string,
  prefix: string,
  maxIndex: number,
): TypedOperation<ObjectProfileIndexInput, RawCommandOutput> {
  return defineRawOperation<ObjectProfileIndexInput>(manifestId, "read", (input) => {
    assertIntegerInRange(input.index, 1, maxIndex, "index");
    return `${prefix} ${String(input.index)} -v`;
  });
}

function destructive(manifestId: string, command: string): TypedOperation<void, RawCommandOutput> {
  return defineCommandOperation(manifestId, "destructive", command);
}

function readAll(manifestId: string, command: string): TypedOperation<void, RawCommandOutput> {
  return defineCommandOperation(manifestId, "read", command);
}

function int(min: number, max: number): ArgSpec {
  return { kind: "int", min, max };
}

const NAME: FlagSpec = { args: [{ kind: "name" }] };
const ON_OFF_BIT: FlagSpec = { args: [int(0, 1)] };
const PORT = int(1, 65535);
const TOKEN: ArgSpec = { kind: "token" };

// object ip obj (rawLine 5578): -n NAME, -i INTERFACE (0 any, 1 LAN, 3 WAN),
// -s INVERT (0/1), -a TYPE [START_IP [END/MASK_IP]] (0 mask, 1 single,
// 2 any, 3 range, 4 MAC).
export const objectIpObjSetdefault = destructive(
  "cli.object.ip.obj.setdefault",
  "object ip obj setdefault",
);
export const objectIpObjSet = profileSetOperation("cli.object.ip.obj.set", "object ip obj", 255, {
  n: NAME,
  i: { args: [{ kind: "enum", values: ["0", "1", "3"] }] },
  s: ON_OFF_BIT,
  a: { args: [int(0, 4), TOKEN, TOKEN], required: 1 },
});

// object ip grp (rawLine 5633): -i INTERFACE (0 any, 1 LAN, 2 WAN),
// -a "IP_OBJ_INDEX ..." (quoted member list).
export const objectIpGrpView = profileViewOperation("cli.object.ip.grp.view", "object ip grp", 255);
export const objectIpGrpSetdefault = destructive(
  "cli.object.ip.grp.setdefault",
  "object ip grp setdefault",
);
export const objectIpGrpSet = profileSetOperation("cli.object.ip.grp.set", "object ip grp", 255, {
  i: { args: [int(0, 2)] },
  a: { args: [int(1, 255)], repeat: true, quote: true },
});

// object ipv6 obj (rawLine 5678): -s INVERT, -e MATCH_TYPE (0 128 bits,
// 1 suffix 64-bit interface ID), -a TYPE [START_IP [END_IP [PREFIX]]].
export const objectIpv6ObjView = profileViewOperation(
  "cli.object.ipv6.obj.view",
  "object ipv6 obj",
  255,
);
export const objectIpv6ObjSetdefault = destructive(
  "cli.object.ipv6.obj.setdefault",
  "object ipv6 obj setdefault",
);
export const objectIpv6ObjSet = profileSetOperation(
  "cli.object.ipv6.obj.set",
  "object ipv6 obj",
  255,
  {
    s: ON_OFF_BIT,
    e: ON_OFF_BIT,
    a: { args: [int(0, 4), TOKEN, TOKEN, int(0, 128)], required: 1 },
  },
);

// object ipv6 grp (rawLine 5736): -a "IP_OBJ_INDEX ...".
export const objectIpv6GrpView = profileViewOperation(
  "cli.object.ipv6.grp.view",
  "object ipv6 grp",
  255,
);
export const objectIpv6GrpSetdefault = destructive(
  "cli.object.ipv6.grp.setdefault",
  "object ipv6 grp setdefault",
);
export const objectIpv6GrpSet = profileSetOperation(
  "cli.object.ipv6.grp.set",
  "object ipv6 grp",
  255,
  { a: { args: [int(1, 255)], repeat: true, quote: true } },
);

// object country (rawLine 5770): set INDEX -v / -a COUNTRY_INDEX, activate,
// setdefault, list (country code table).
export const objectCountryView = profileViewOperation(
  "cli.object.country.view",
  "object country set",
  32,
);
export const objectCountrySet = profileSetOperation(
  "cli.object.country.set",
  "object country set",
  32,
  { a: { args: [int(1, 999)] } },
);
export const objectCountryActivate = defineCommandOperation(
  "cli.object.country.activate",
  "write",
  "object country activate",
);
export const objectCountrySetdefault = destructive(
  "cli.object.country.setdefault",
  "object country setdefault",
);
export const objectCountryList = readAll("cli.object.country.list", "object country list");

// object service obj (rawLine 5807): -n NAME, -p PROTOCOL (0 any, 1 ICMP,
// 2 IGMP, 6 TCP, 17 UDP, 58 ICMPv6, 255 TCP/UDP, other numbers), -s / -d CHK
// START_P END_P (CHK 0 =, 1 !=, 2 >, 3 <; ports 1..65535).
export const objectServiceObjSetdefault = destructive(
  "cli.object.service.obj.setdefault",
  "object service obj setdefault",
);
export const objectServiceObjSet = profileSetOperation(
  "cli.object.service.obj.set",
  "object service obj",
  255,
  {
    n: NAME,
    p: { args: [int(0, 255)] },
    s: { args: [int(0, 3), PORT, PORT] },
    d: { args: [int(0, 3), PORT, PORT] },
  },
);

// object service grp (rawLine 5877): -a SER_OBJ_INDEX ... (unquoted list).
export const objectServiceGrpView = profileViewOperation(
  "cli.object.service.grp.view",
  "object service grp",
  255,
);
export const objectServiceGrpSetdefault = destructive(
  "cli.object.service.grp.setdefault",
  "object service grp setdefault",
);
export const objectServiceGrpSet = profileSetOperation(
  "cli.object.service.grp.set",
  "object service grp",
  255,
  { a: { args: [int(1, 255)], repeat: true } },
);

// object kw (rawLine 5921): obj show PAGE, obj INDEX -v / -a CONTENTS / -c.
export interface ObjectKwShowInput {
  readonly page: number;
}

export const objectKwShow = defineRawOperation<ObjectKwShowInput>(
  "cli.object.kw.show",
  "read",
  (input) => {
    assertPositiveInteger(input.page, "page");
    return `object kw obj show ${String(input.page)}`;
  },
);
export const objectKwView = profileViewOperation("cli.object.kw.view", "object kw obj", 255);
export const objectKwSetdefault = destructive(
  "cli.object.kw.setdefault",
  "object kw obj setdefault",
);
export const objectKwSet = profileSetOperation("cli.object.kw.set", "object kw obj", 255, {
  a: { args: [TOKEN] },
  c: { args: [] },
});

// object fe (rawLine 5962): show, setdefault, obj INDEX -v / -e / -d
// CATEGORY|FILE_EXTENSION (Image, Video, Audio, Java, ActiveX, Compression,
// Executation, or an extension such as .bmp).
export const objectFeShow = readAll("cli.object.fe.show", "object fe show");
export const objectFeSetdefault = destructive("cli.object.fe.setdefault", "object fe setdefault");
export const objectFeView = profileViewOperation("cli.object.fe.view", "object fe obj", 8);
export const objectFeSet = profileSetOperation("cli.object.fe.set", "object fe obj", 8, {
  e: { args: [TOKEN] },
  d: { args: [TOKEN] },
});

// object sms (rawLine 6045): -s provider number, -u username, -p password,
// -q quota, -i interval, -l URL (Custom 1/2 profiles).
export const objectSmsShow = readAll("cli.object.sms.show", "object sms show");
export const objectSmsSetdefault = destructive(
  "cli.object.sms.setdefault",
  "object sms setdefault",
);
export const objectSmsView = profileViewOperation("cli.object.sms.view", "object sms obj", 10);
export const objectSmsSet = profileSetOperation("cli.object.sms.set", "object sms obj", 10, {
  s: { args: [int(0, 99)] },
  u: { args: [TOKEN] },
  p: { args: [TOKEN] },
  q: { args: [int(0, 1_000_000)] },
  i: { args: [int(0, 1_000_000)] },
  l: { args: [TOKEN] },
});

// object mail (rawLine 6120): -s SMTP server, -l connection security (0/1),
// -m SMTP port, -a sender address, -t authentication (0/1), -u / -p (max 31
// characters), -i sending interval (s), -w interface, -x alias IP index 1..10.
export const objectMailShow = readAll("cli.object.mail.show", "object mail show");
export const objectMailSetdefault = destructive(
  "cli.object.mail.setdefault",
  "object mail setdefault",
);
export const objectMailView = profileViewOperation("cli.object.mail.view", "object mail obj", 10);
export const objectMailSet = profileSetOperation("cli.object.mail.set", "object mail obj", 10, {
  s: { args: [TOKEN] },
  l: ON_OFF_BIT,
  m: { args: [PORT] },
  a: { args: [TOKEN] },
  t: ON_OFF_BIT,
  u: { args: [{ kind: "token", maxLength: 31 }] },
  p: { args: [{ kind: "token", maxLength: 31 }] },
  i: { args: [int(0, 1_000_000)] },
  w: { args: [TOKEN] },
  x: { args: [int(1, 10)] },
});

// object noti (rawLine 6191): obj INDEX -e / -d CATEGORY STATUS (categories
// 1 WAN, 2 VPN Tunnel, 3 Temperature, 4 WAN Budget, 5 CVM, 6 HA, 9 Security).
const NOTI_CATEGORY: ArgSpec = { kind: "enum", values: ["1", "2", "3", "4", "5", "6", "9"] };

export const objectNotiShow = readAll("cli.object.noti.show", "object noti show");
export const objectNotiSetdefault = destructive(
  "cli.object.noti.setdefault",
  "object noti setdefault",
);
export const objectNotiView = profileViewOperation("cli.object.noti.view", "object noti obj", 8);
export const objectNotiSet = profileSetOperation("cli.object.noti.set", "object noti obj", 8, {
  e: { args: [NOTI_CATEGORY, int(1, 6)] },
  d: { args: [NOTI_CATEGORY, int(1, 6)] },
});

// object schedule (rawLine 6270): set INDEX -c comment / -D "Y M D" /
// -T "H M" / -d "H M" / -a action (0..3) / -I idle minutes (0..255) /
// -h "0" | "1 Sun Mon ...", view [INDEX], setdefault.
export const objectScheduleSet = profileSetOperation(
  "cli.object.schedule.set",
  "object schedule set",
  15,
  {
    e: ON_OFF_BIT,
    c: { args: [{ kind: "token", maxLength: 32 }] },
    D: { args: [int(2000, 2099), int(1, 12), int(1, 31)], quote: true },
    T: { args: [int(0, 23), int(0, 59)], quote: true },
    d: { args: [int(0, 23), int(0, 59)], quote: true },
    a: { args: [int(0, 3)] },
    I: { args: [int(0, 255)] },
    h: {
      args: [{ kind: "enum", values: ["0", "1", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] }],
      repeat: true,
      quote: true,
    },
  },
);

export interface ObjectScheduleViewInput {
  /** Profile 1..15; omitted shows every profile. */
  readonly index?: number;
}

export const objectScheduleView = defineRawOperation<ObjectScheduleViewInput>(
  "cli.object.schedule.view",
  "read",
  (input) => {
    if (input.index === undefined) {
      return "object schedule view";
    }

    assertIntegerInRange(input.index, 1, 15, "index");
    return `object schedule view ${String(input.index)}`;
  },
);
export const objectScheduleSetdefault = destructive(
  "cli.object.schedule.setdefault",
  "object schedule setdefault",
);

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
  objectIpObjSetdefault,
  objectIpObjSet,
  objectIpGrpView,
  objectIpGrpSetdefault,
  objectIpGrpSet,
  objectIpv6ObjView,
  objectIpv6ObjSetdefault,
  objectIpv6ObjSet,
  objectIpv6GrpView,
  objectIpv6GrpSetdefault,
  objectIpv6GrpSet,
  objectCountryView,
  objectCountrySet,
  objectCountryActivate,
  objectCountrySetdefault,
  objectCountryList,
  objectServiceObjSetdefault,
  objectServiceObjSet,
  objectServiceGrpView,
  objectServiceGrpSetdefault,
  objectServiceGrpSet,
  objectKwShow,
  objectKwView,
  objectKwSetdefault,
  objectKwSet,
  objectFeShow,
  objectFeSetdefault,
  objectFeView,
  objectFeSet,
  objectSmsShow,
  objectSmsSetdefault,
  objectSmsView,
  objectSmsSet,
  objectMailShow,
  objectMailSetdefault,
  objectMailView,
  objectMailSet,
  objectNotiShow,
  objectNotiSetdefault,
  objectNotiView,
  objectNotiSet,
  objectScheduleSet,
  objectScheduleView,
  objectScheduleSetdefault,
];
