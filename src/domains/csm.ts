/**
 * `csm` domain -- Wave 4 Item5-csm (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements classified `cli.csm.*` entries including previously deferred
 * `cli.csm.appe.prof` (YAGNI: name/view/setdefault forms) and
 * `cli.csm.appe.config`.
 *
 * Every `buildFrames` validates its input before calling
 * `frameSingleCommand` -- `frameSingleCommand` itself only rejects framing
 * hazards (control chars, shell metacharacters, empty input), it has no
 * notion of a command's own documented argument shape. Validation failures
 * throw a plain `Error` (this family's write scope excludes `src/errors.ts`,
 * so no new `SdkErrorCode` is introduced here).
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/csm/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature). Multi-variant documented syntaxes under one heading (e.g.
 * `csm appe set`, `csm ucf`, `csm wcf`, `csm dnsf`) are modelled as a
 * discriminated `action` union input, one canonical frame per variant --
 * this is still exactly one `TypedOperation` per manifest entry, not an
 * invented extra command. Several of these headings document a long tail of
 * additional sub-forms (e.g. `csm wcf obj INDEX -o/-g/-w/-s/-u`, `csm dnsf
 * profile_edit INDEX -w/-u/-c`, `csm dnsf local_bw ...`) that are a
 * deliberate YAGNI deferral, noted inline at each operation -- not silently
 * dropped.
 */

import { InvalidInputError } from "../errors.js";
import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseAppeSet } from "../internal/parsers/csm/appe-set.js";
import { parseAppeShow, type CsmAppeShowReport } from "../internal/parsers/csm/appe-show.js";
import { parseAppeProf } from "../internal/parsers/csm/appe-prof.js";
import { parseAppeConfig } from "../internal/parsers/csm/appe-config.js";
import { parseUcf } from "../internal/parsers/csm/ucf.js";
import { parseUcfObjUac } from "../internal/parsers/csm/ucf-obj-uac.js";
import { parseUcfObjEac } from "../internal/parsers/csm/ucf-obj-eac.js";
import { parseUcfObjWf } from "../internal/parsers/csm/ucf-obj-wf.js";
import { parseWcf } from "../internal/parsers/csm/wcf.js";
import { parseDnsf } from "../internal/parsers/csm/dnsf.js";
import type { RawCommandOutput } from "../internal/parsers/csm/shared.js";
import {
  assertCliValue,
  assertIntegerInRange,
  assertMaxLength,
  assertNonEmpty,
  assertNumberOneOf,
  assertOneOf,
  assertPositiveInteger,
  assertTrailingText,
  defineCommandOperation,
  defineRawOperation,
  firstExchangeText,
} from "../internal/domain-support.js";

/** CSM profile index range used across this family's documented commands unless a narrower range is given ("from 1 to 32" for APPE profiles, "from 1 to 8" for UCF/WCF profiles). */
const APPE_PROFILE_INDEX_MIN = 1;
const APPE_PROFILE_INDEX_MAX = 32;
const CSM_PROFILE_INDEX_MIN = 1;
const CSM_PROFILE_INDEX_MAX = 8;

// ---------------------------------------------------------------------------
// cli.csm.appe.set -- `csm appe set -i INDEX -v GROUP|-e AP_IDX|-d AP_IDX|
// -p AP_IDX|-q AP_IDX` (rawLine 54)
// ---------------------------------------------------------------------------

export type CsmAppeGroup = "IM" | "P2P" | "Protocol" | "Others";

export type CsmAppeSetInput =
  | { readonly index: number; readonly action: "view"; readonly group: CsmAppeGroup }
  | { readonly index: number; readonly action: "enable"; readonly appIndex: number }
  | { readonly index: number; readonly action: "disable"; readonly appIndex: number }
  | { readonly index: number; readonly action: "enableRoute"; readonly appIndex: number }
  | { readonly index: number; readonly action: "disableRoute"; readonly appIndex: number };

const CSM_APPE_GROUPS: readonly CsmAppeGroup[] = ["IM", "P2P", "Protocol", "Others"];

function buildAppeSetFrames(input: CsmAppeSetInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, APPE_PROFILE_INDEX_MIN, APPE_PROFILE_INDEX_MAX, "index");

  const prefix = `csm appe set -i ${String(input.index)}`;

  switch (input.action) {
    case "view": {
      assertOneOf(input.group, CSM_APPE_GROUPS, "group");

      return [frameSingleCommand(`${prefix} -v ${input.group}`)];
    }
    case "enable": {
      assertPositiveInteger(input.appIndex, "appIndex");

      return [frameSingleCommand(`${prefix} -e ${String(input.appIndex)}`)];
    }
    case "disable": {
      assertPositiveInteger(input.appIndex, "appIndex");

      return [frameSingleCommand(`${prefix} -d ${String(input.appIndex)}`)];
    }
    case "enableRoute": {
      assertPositiveInteger(input.appIndex, "appIndex");

      return [frameSingleCommand(`${prefix} -p ${String(input.appIndex)}`)];
    }
    case "disableRoute": {
      assertPositiveInteger(input.appIndex, "appIndex");

      return [frameSingleCommand(`${prefix} -q ${String(input.appIndex)}`)];
    }
  }
}

export const csmAppeSet: TypedOperation<CsmAppeSetInput, RawCommandOutput> = {
  manifestId: "cli.csm.appe.set",
  classification: "write",
  buildFrames: buildAppeSetFrames,
  parse: (exchanges) => parseAppeSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.csm.appe.show -- `csm appe show [-a|-i|-p|-t|-m]` (rawLine 93) -- read
// ---------------------------------------------------------------------------

export type CsmAppeShowGroup = "all" | "im" | "p2p" | "protocol" | "others";

export interface CsmAppeShowInput {
  readonly group?: CsmAppeShowGroup;
}

const APPE_SHOW_FLAGS: Readonly<Record<CsmAppeShowGroup, string>> = {
  all: "-a",
  im: "-i",
  p2p: "-p",
  protocol: "-t",
  others: "-m",
};

function buildAppeShowFrames(input: CsmAppeShowInput): readonly CommandFrame[] {
  if (input.group === undefined) {
    return [frameSingleCommand("csm appe show")];
  }

  assertOneOf(input.group, Object.keys(APPE_SHOW_FLAGS) as readonly CsmAppeShowGroup[], "group");

  return [frameSingleCommand(`csm appe show ${APPE_SHOW_FLAGS[input.group]}`)];
}

export const csmAppeShow: TypedOperation<CsmAppeShowInput, CsmAppeShowReport> = {
  manifestId: "cli.csm.appe.show",
  classification: "read",
  buildFrames: buildAppeShowFrames,
  parse: (exchanges) => parseAppeShow(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.csm.ucf -- `csm ucf show|setdefault|msg MSG|obj INDEX -n NAME|-p
// VALUE|-l P|B|A` (rawLine 188); `uac`/`wf` sub-forms are their own manifest
// entries (`cli.csm.ucf.obj.index.uac`/`.wf`, modelled below).
// ---------------------------------------------------------------------------

export type CsmUcfInput =
  | { readonly action: "show" }
  | { readonly action: "setdefault" }
  | { readonly action: "message"; readonly message: string }
  | { readonly action: "objName"; readonly index: number; readonly name: string }
  | { readonly action: "objPriority"; readonly index: number; readonly value: 0 | 1 | 2 | 3 }
  | { readonly action: "objLog"; readonly index: number; readonly logType: "P" | "B" | "A" };

function buildUcfFrames(input: CsmUcfInput): readonly CommandFrame[] {
  switch (input.action) {
    case "show": {
      return [frameSingleCommand("csm ucf show")];
    }
    case "setdefault": {
      return [frameSingleCommand("csm ucf setdefault")];
    }
    case "message": {
      assertTrailingText(input.message, "message");
      assertMaxLength(input.message, 255, "message");

      return [frameSingleCommand(`csm ucf msg ${input.message}`)];
    }
    case "objName": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");
      assertCliValue(input.name, "name");
      assertMaxLength(input.name, 15, "name");

      return [frameSingleCommand(`csm ucf obj ${String(input.index)} -n ${input.name}`)];
    }
    case "objPriority": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");
      assertIntegerInRange(input.value, 0, 3, "value");

      return [frameSingleCommand(`csm ucf obj ${String(input.index)} -p ${String(input.value)}`)];
    }
    case "objLog": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");
      assertOneOf(input.logType, ["P", "B", "A"], "logType");

      return [frameSingleCommand(`csm ucf obj ${String(input.index)} -l ${input.logType}`)];
    }
  }
}

export const csmUcf: TypedOperation<CsmUcfInput, RawCommandOutput> = {
  manifestId: "cli.csm.ucf",
  classification: "write",
  buildFrames: buildUcfFrames,
  parse: (exchanges) => parseUcf(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.csm.ucf.obj.index.uac -- `csm ucf obj INDEX uac -v|-e|-d|-a P|B|-i
// E|D|-o KEY_WORD_Object_Index|-g KEY_WORD_Group_Index` (rawLine 245)
// ---------------------------------------------------------------------------

export type CsmUcfUacInput =
  | { readonly index: number; readonly action: "view" }
  | { readonly index: number; readonly action: "enable" }
  | { readonly index: number; readonly action: "disable" }
  | { readonly index: number; readonly action: "setAction"; readonly value: "P" | "B" }
  | { readonly index: number; readonly action: "setIpBlock"; readonly value: "E" | "D" }
  | { readonly index: number; readonly action: "setObject"; readonly objectIndex: number }
  | { readonly index: number; readonly action: "setGroup"; readonly groupIndex: number };

function buildUcfObjUacFrames(input: CsmUcfUacInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");

  const prefix = `csm ucf obj ${String(input.index)} uac`;

  switch (input.action) {
    case "view": {
      return [frameSingleCommand(`${prefix} -v`)];
    }
    case "enable": {
      return [frameSingleCommand(`${prefix} -e`)];
    }
    case "disable": {
      return [frameSingleCommand(`${prefix} -d`)];
    }
    case "setAction": {
      assertOneOf(input.value, ["P", "B"], "value");

      return [frameSingleCommand(`${prefix} -a ${input.value}`)];
    }
    case "setIpBlock": {
      assertOneOf(input.value, ["E", "D"], "value");

      return [frameSingleCommand(`${prefix} -i ${input.value}`)];
    }
    case "setObject": {
      assertPositiveInteger(input.objectIndex, "objectIndex");

      return [frameSingleCommand(`${prefix} -o ${String(input.objectIndex)}`)];
    }
    case "setGroup": {
      assertPositiveInteger(input.groupIndex, "groupIndex");

      return [frameSingleCommand(`${prefix} -g ${String(input.groupIndex)}`)];
    }
  }
}

export const csmUcfObjUac: TypedOperation<CsmUcfUacInput, RawCommandOutput> = {
  manifestId: "cli.csm.ucf.obj.index.uac",
  classification: "write",
  buildFrames: buildUcfObjUacFrames,
  parse: (exchanges) => parseUcfObjUac(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.csm.ucf.obj.index.eac -- `csm ucf obj INDEX eac -v|-e|-d|-o
// KEY_WORD_Object_Index|-g KEY_WORD_Group_Index` (rawLine 304)
// ---------------------------------------------------------------------------

export type CsmUcfEacInput =
  | { readonly index: number; readonly action: "view" }
  | { readonly index: number; readonly action: "enable" }
  | { readonly index: number; readonly action: "disable" }
  | { readonly index: number; readonly action: "setObject"; readonly objectIndex: number }
  | { readonly index: number; readonly action: "setGroup"; readonly groupIndex: number };

function buildUcfObjEacFrames(input: CsmUcfEacInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");

  const prefix = `csm ucf obj ${String(input.index)} eac`;

  switch (input.action) {
    case "view": {
      return [frameSingleCommand(`${prefix} -v`)];
    }
    case "enable": {
      return [frameSingleCommand(`${prefix} -e`)];
    }
    case "disable": {
      return [frameSingleCommand(`${prefix} -d`)];
    }
    case "setObject": {
      assertPositiveInteger(input.objectIndex, "objectIndex");

      return [frameSingleCommand(`${prefix} -o ${String(input.objectIndex)}`)];
    }
    case "setGroup": {
      assertPositiveInteger(input.groupIndex, "groupIndex");

      return [frameSingleCommand(`${prefix} -g ${String(input.groupIndex)}`)];
    }
  }
}

export const csmUcfObjEac: TypedOperation<CsmUcfEacInput, RawCommandOutput> = {
  manifestId: "cli.csm.ucf.obj.index.eac",
  classification: "write",
  buildFrames: buildUcfObjEacFrames,
  parse: (exchanges) => parseUcfObjEac(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.csm.ucf.obj.index.wf -- `csm ucf obj INDEX wf -v|-e|-d|-a P|B|-s
// WEB_FEATURE|-u WEB_FEATURE|-f File_Extension_Object_index` (rawLine 342)
// ---------------------------------------------------------------------------

export type CsmUcfWfFeature = "c" | "p" | "u";

export type CsmUcfWfInput =
  | { readonly index: number; readonly action: "view" }
  | { readonly index: number; readonly action: "enable" }
  | { readonly index: number; readonly action: "disable" }
  | { readonly index: number; readonly action: "setAction"; readonly value: "P" | "B" }
  | { readonly index: number; readonly action: "enableFeature"; readonly feature: CsmUcfWfFeature }
  | { readonly index: number; readonly action: "cancelFeature"; readonly feature: CsmUcfWfFeature }
  | {
      readonly index: number;
      readonly action: "setFileExtension";
      readonly fileExtensionIndex: number;
    };

const CSM_UCF_WF_FEATURES: readonly CsmUcfWfFeature[] = ["c", "p", "u"];

function buildUcfObjWfFrames(input: CsmUcfWfInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");

  const prefix = `csm ucf obj ${String(input.index)} wf`;

  switch (input.action) {
    case "view": {
      return [frameSingleCommand(`${prefix} -v`)];
    }
    case "enable": {
      return [frameSingleCommand(`${prefix} -e`)];
    }
    case "disable": {
      return [frameSingleCommand(`${prefix} -d`)];
    }
    case "setAction": {
      assertOneOf(input.value, ["P", "B"], "value");

      return [frameSingleCommand(`${prefix} -a ${input.value}`)];
    }
    case "enableFeature": {
      assertOneOf(input.feature, CSM_UCF_WF_FEATURES, "feature");

      return [frameSingleCommand(`${prefix} -s ${input.feature}`)];
    }
    case "cancelFeature": {
      assertOneOf(input.feature, CSM_UCF_WF_FEATURES, "feature");

      return [frameSingleCommand(`${prefix} -u ${input.feature}`)];
    }
    case "setFileExtension": {
      assertIntegerInRange(input.fileExtensionIndex, 1, 8, "fileExtensionIndex");

      return [frameSingleCommand(`${prefix} -f ${String(input.fileExtensionIndex)}`)];
    }
  }
}

export const csmUcfObjWf: TypedOperation<CsmUcfWfInput, RawCommandOutput> = {
  manifestId: "cli.csm.ucf.obj.index.wf",
  classification: "write",
  buildFrames: buildUcfObjWfFrames,
  parse: (exchanges) => parseUcfObjWf(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.csm.wcf -- `csm wcf show|look|cache|server WCF_SERVER|msg MSG|
// setdefault|obj INDEX -v|-a P|B|-n PROFILE_NAME|-l P|B|A` (rawLine 383) --
// the `obj INDEX -o/-g/-w/-s/-u` sub-forms (keyword object/group selection,
// black/white-list action, and the free-text CATEGORY/WEB_GROUP
// enumerations) are a deliberate YAGNI deferral: `-o`/`-g`/`-w` duplicate
// the keyword-object/group/action shape already modelled for
// `cli.csm.ucf.obj.index.uac` above, and `-s`/`-u` select from long
// vendor-documented free-text category name lists that would need their own
// dedicated enumeration design, not silently dropped.
// ---------------------------------------------------------------------------

export type CsmWcfInput =
  | { readonly action: "show" }
  | { readonly action: "look" }
  | { readonly action: "cache" }
  | { readonly action: "server"; readonly server: string }
  | { readonly action: "message"; readonly message: string }
  | { readonly action: "setdefault" }
  | { readonly action: "objView"; readonly index: number }
  | { readonly action: "objAction"; readonly index: number; readonly value: "P" | "B" }
  | { readonly action: "objName"; readonly index: number; readonly name: string }
  | { readonly action: "objLog"; readonly index: number; readonly logType: "P" | "B" | "A" }
  | { readonly action: "objKeywordObject"; readonly index: number; readonly objectIndex: number }
  | { readonly action: "objKeywordGroup"; readonly index: number; readonly groupIndex: number }
  | {
      readonly action: "objListAction";
      readonly index: number;
      /** Black/white list: E enable, D disable, P pass, B block. */
      readonly value: "E" | "D" | "P" | "B";
    }
  | {
      readonly action: "objSelect" | "objDiscard";
      readonly index: number;
      /** A CATEGORY (e.g. "Bot Nets") or WEB_GROUP (e.g. "Security") name. */
      readonly item: string;
    };

/** Category / web-group names contain spaces; the manual quotes them. */
function quoteItem(item: string): string {
  assertNonEmpty(item, "item");

  if (item.includes('"')) {
    throw new InvalidInputError(
      `item must not contain a double quote (got ${JSON.stringify(item)}).`,
    );
  }

  if (item.startsWith("-")) {
    throw new InvalidInputError('item must not start with "-".');
  }

  return /\s/.test(item) ? `"${item}"` : item;
}

function buildWcfFrames(input: CsmWcfInput): readonly CommandFrame[] {
  switch (input.action) {
    case "show": {
      return [frameSingleCommand("csm wcf show")];
    }
    case "look": {
      return [frameSingleCommand("csm wcf look")];
    }
    case "cache": {
      return [frameSingleCommand("csm wcf cache")];
    }
    case "server": {
      assertCliValue(input.server, "server");

      return [frameSingleCommand(`csm wcf server ${input.server}`)];
    }
    case "message": {
      assertTrailingText(input.message, "message");
      assertMaxLength(input.message, 255, "message");

      return [frameSingleCommand(`csm wcf msg ${input.message}`)];
    }
    case "setdefault": {
      return [frameSingleCommand("csm wcf setdefault")];
    }
    case "objView": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");

      return [frameSingleCommand(`csm wcf obj ${String(input.index)} -v`)];
    }
    case "objAction": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");
      assertOneOf(input.value, ["P", "B"], "value");

      return [frameSingleCommand(`csm wcf obj ${String(input.index)} -a ${input.value}`)];
    }
    case "objName": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");
      assertCliValue(input.name, "name");
      assertMaxLength(input.name, 15, "name");

      return [frameSingleCommand(`csm wcf obj ${String(input.index)} -n ${input.name}`)];
    }
    case "objLog": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");
      assertOneOf(input.logType, ["P", "B", "A"], "logType");

      return [frameSingleCommand(`csm wcf obj ${String(input.index)} -l ${input.logType}`)];
    }
    case "objKeywordObject": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");
      assertPositiveInteger(input.objectIndex, "objectIndex");

      return [
        frameSingleCommand(`csm wcf obj ${String(input.index)} -o ${String(input.objectIndex)}`),
      ];
    }
    case "objKeywordGroup": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");
      assertPositiveInteger(input.groupIndex, "groupIndex");

      return [
        frameSingleCommand(`csm wcf obj ${String(input.index)} -g ${String(input.groupIndex)}`),
      ];
    }
    case "objListAction": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");
      assertOneOf(input.value, ["E", "D", "P", "B"], "value");

      return [frameSingleCommand(`csm wcf obj ${String(input.index)} -w ${input.value}`)];
    }
    case "objSelect":
    case "objDiscard": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");
      const flag = input.action === "objSelect" ? "-s" : "-u";

      return [
        frameSingleCommand(`csm wcf obj ${String(input.index)} ${flag} ${quoteItem(input.item)}`),
      ];
    }
  }
}

export const csmWcf: TypedOperation<CsmWcfInput, RawCommandOutput> = {
  manifestId: "cli.csm.wcf",
  classification: "write",
  buildFrames: buildWcfFrames,
  parse: (exchanges) => parseWcf(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.csm.dnsf -- `csm dnsf enable ON|OFF|syslog N|P|B|A|wcf INDEX|ucf
// INDEX|cachetime CACHE_TIME|blockpage show/on/off|profile_show|
// profile_edit INDEX -n PROFILE_NAME|-l P|B|A|profile_setdefault` (rawLine
// 520) -- `profile_edit INDEX -w/-u/-c` (duplicating the top-level `wcf`/
// `ucf`/`cachetime` setters, just scoped to one DNS-filter profile) and
// `local_bw e/d/p/b/a/g/o/s/c` (a separate address-list subsystem with its
// own address-type/group/object sub-forms) are a deliberate YAGNI deferral.
// ---------------------------------------------------------------------------

export type CsmDnsfInput =
  | { readonly action: "enable"; readonly state: "ON" | "OFF" }
  | { readonly action: "syslog"; readonly value: "N" | "P" | "B" | "A" }
  | { readonly action: "wcf"; readonly index: number }
  | { readonly action: "ucf"; readonly index: number }
  | { readonly action: "cachetime"; readonly hours: number }
  | { readonly action: "blockpage"; readonly value: "show" | "on" | "off" }
  | { readonly action: "profileShow" }
  | { readonly action: "profileEditName"; readonly index: number; readonly name: string }
  | {
      readonly action: "profileEditLog";
      readonly index: number;
      readonly logType: "P" | "B" | "A";
    }
  | { readonly action: "profileSetdefault" }
  | { readonly action: "profileEditWcf"; readonly index: number; readonly wcfProfile: number }
  | { readonly action: "profileEditUcf"; readonly index: number; readonly ucfProfile: number }
  | { readonly action: "profileEditCache"; readonly index: number; readonly hours: number };

function buildDnsfFrames(input: CsmDnsfInput): readonly CommandFrame[] {
  switch (input.action) {
    case "enable": {
      assertOneOf(input.state, ["ON", "OFF"], "state");

      return [frameSingleCommand(`csm dnsf enable ${input.state}`)];
    }
    case "syslog": {
      assertOneOf(input.value, ["N", "P", "B", "A"], "value");

      return [frameSingleCommand(`csm dnsf syslog ${input.value}`)];
    }
    case "wcf": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");

      return [frameSingleCommand(`csm dnsf wcf ${String(input.index)}`)];
    }
    case "ucf": {
      assertIntegerInRange(input.index, CSM_PROFILE_INDEX_MIN, CSM_PROFILE_INDEX_MAX, "index");

      return [frameSingleCommand(`csm dnsf ucf ${String(input.index)}`)];
    }
    case "cachetime": {
      assertIntegerInRange(input.hours, 1, 24, "hours");

      return [frameSingleCommand(`csm dnsf cachetime ${String(input.hours)}`)];
    }
    case "blockpage": {
      assertOneOf(input.value, ["show", "on", "off"], "value");

      return [frameSingleCommand(`csm dnsf blockpage ${input.value}`)];
    }
    case "profileShow": {
      return [frameSingleCommand("csm dnsf profile_show")];
    }
    case "profileEditName": {
      assertPositiveInteger(input.index, "index");
      assertCliValue(input.name, "name");

      return [frameSingleCommand(`csm dnsf profile_edit ${String(input.index)} -n ${input.name}`)];
    }
    case "profileEditLog": {
      assertPositiveInteger(input.index, "index");
      assertOneOf(input.logType, ["P", "B", "A"], "logType");

      return [
        frameSingleCommand(`csm dnsf profile_edit ${String(input.index)} -l ${input.logType}`),
      ];
    }
    case "profileSetdefault": {
      return [frameSingleCommand("csm dnsf profile_setdefault")];
    }
    case "profileEditWcf": {
      assertPositiveInteger(input.index, "index");
      assertIntegerInRange(input.wcfProfile, 1, 8, "wcfProfile");

      return [
        frameSingleCommand(
          `csm dnsf profile_edit ${String(input.index)} -w ${String(input.wcfProfile)}`,
        ),
      ];
    }
    case "profileEditUcf": {
      assertPositiveInteger(input.index, "index");
      assertIntegerInRange(input.ucfProfile, 1, 8, "ucfProfile");

      return [
        frameSingleCommand(
          `csm dnsf profile_edit ${String(input.index)} -u ${String(input.ucfProfile)}`,
        ),
      ];
    }
    case "profileEditCache": {
      assertPositiveInteger(input.index, "index");
      assertIntegerInRange(input.hours, 1, 24, "hours");

      return [
        frameSingleCommand(
          `csm dnsf profile_edit ${String(input.index)} -c ${String(input.hours)}`,
        ),
      ];
    }
  }
}

export const csmDnsf: TypedOperation<CsmDnsfInput, RawCommandOutput> = {
  manifestId: "cli.csm.dnsf",
  classification: "write",
  buildFrames: buildDnsfFrames,
  parse: (exchanges) => parseDnsf(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.csm.appe.prof -- `csm appe prof -i INDEX [-v | -n NAME|setdefault]`
// (rawLine 37) -- write. YAGNI: model name / view / setdefault only.
// ---------------------------------------------------------------------------

export type CsmAppeProfInput =
  | { readonly index: number; readonly action: "setName"; readonly name: string }
  | { readonly index: number; readonly action: "view" }
  | { readonly index: number; readonly action: "setdefault" };

function buildAppeProfFrames(input: CsmAppeProfInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, 1, 32, "index");

  switch (input.action) {
    case "setName": {
      assertCliValue(input.name, "name");
      assertMaxLength(input.name, 15, "name");

      return [frameSingleCommand(`csm appe prof -i ${String(input.index)} -n ${input.name}`)];
    }
    case "view": {
      return [frameSingleCommand(`csm appe prof -i ${String(input.index)} -v`)];
    }
    case "setdefault": {
      return [frameSingleCommand(`csm appe prof -i ${String(input.index)} setdefault`)];
    }
  }
}

export const csmAppeProf: TypedOperation<CsmAppeProfInput, RawCommandOutput> = {
  manifestId: "cli.csm.appe.prof",
  classification: "write",
  buildFrames: buildAppeProfFrames,
  parse: (exchanges) => parseAppeProf(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.csm.appe.config -- `csm appe config -v INDEX -<i|p|t|m|r>` (rawLine 135)
// -- read.
// ---------------------------------------------------------------------------

export interface CsmAppeConfigInput {
  readonly index: number;
  readonly group: "im" | "p2p" | "protocol" | "others" | "route";
}

const APPE_CONFIG_GROUP_FLAG: Record<CsmAppeConfigInput["group"], string> = {
  im: "-i",
  p2p: "-p",
  protocol: "-t",
  others: "-m",
  route: "-r",
};

function buildAppeConfigFrames(input: CsmAppeConfigInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, 1, 32, "index");

  if (!(input.group in APPE_CONFIG_GROUP_FLAG)) {
    throw new InvalidInputError(
      `group must be one of im, p2p, protocol, others, route (got ${JSON.stringify(input.group)}).`,
    );
  }

  return [
    frameSingleCommand(
      `csm appe config -v ${String(input.index)} ${APPE_CONFIG_GROUP_FLAG[input.group]}`,
    ),
  ];
}

export const csmAppeConfig: TypedOperation<CsmAppeConfigInput, RawCommandOutput> = {
  manifestId: "cli.csm.appe.config",
  classification: "read",
  buildFrames: buildAppeConfigFrames,
  parse: (exchanges) => parseAppeConfig(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.csm.dnsf.localbw.* -- `csm dnsf local_bw e/d/p/b/a/g/o/s/c` (rawLine
// 540/588): DNS filter local black/white list. `s` shows it, `c` clears it
// back to factory defaults (destructive), the rest configure it.
// ---------------------------------------------------------------------------

export const csmDnsfLocalBwShow = defineCommandOperation(
  "cli.csm.dnsf.localbw.show",
  "read",
  "csm dnsf local_bw s",
);

export const csmDnsfLocalBwClear = defineCommandOperation(
  "cli.csm.dnsf.localbw.clear",
  "destructive",
  "csm dnsf local_bw c",
);

export type CsmDnsfLocalBwSetInput =
  | { readonly action: "enable" | "disable" | "pass" | "block" }
  | {
      readonly action: "addressType";
      /** 0 mask, 1 single, 2 any, 3 range, 4 group and objects. */
      readonly type: number;
      /** Address value(s) for the type, e.g. an IP for single. */
      readonly values?: readonly string[];
    }
  | {
      readonly action: "group";
      readonly item: 1 | 2;
      /** Group index 1..192. */
      readonly groupIndex: number;
    }
  | {
      readonly action: "object";
      readonly item: 1 | 2;
      /** Object index 1..32. */
      readonly objectIndex: number;
    };

const LOCAL_BW_LETTER = { enable: "e", disable: "d", pass: "p", block: "b" } as const;

export const csmDnsfLocalBwSet = defineRawOperation<CsmDnsfLocalBwSetInput>(
  "cli.csm.dnsf.localbw.set",
  "write",
  (input) => {
    switch (input.action) {
      case "addressType": {
        assertIntegerInRange(input.type, 0, 4, "type");
        const values = input.values ?? [];

        for (const [position, value] of values.entries()) {
          assertCliValue(value, `values[${String(position)}]`);
        }

        return ["csm dnsf local_bw a", String(input.type), ...values].join(" ");
      }
      case "group":
        assertNumberOneOf(input.item, [1, 2], "item");
        assertIntegerInRange(input.groupIndex, 1, 192, "groupIndex");
        return `csm dnsf local_bw g ${String(input.item)} ${String(input.groupIndex)}`;
      case "object":
        assertNumberOneOf(input.item, [1, 2], "item");
        assertIntegerInRange(input.objectIndex, 1, 32, "objectIndex");
        return `csm dnsf local_bw o ${String(input.item)} ${String(input.objectIndex)}`;
      default:
        assertOneOf(input.action, ["enable", "disable", "pass", "block"], "action");
        return `csm dnsf local_bw ${LOCAL_BW_LETTER[input.action]}`;
    }
  },
);

export const operations: readonly TypedOperation<never, unknown>[] = [
  csmDnsfLocalBwShow,
  csmDnsfLocalBwClear,
  csmDnsfLocalBwSet,
  csmAppeSet,
  csmAppeShow,
  csmAppeProf,
  csmAppeConfig,
  csmUcf,
  csmUcfObjUac,
  csmUcfObjEac,
  csmUcfObjWf,
  csmWcf,
  csmDnsf,
];
