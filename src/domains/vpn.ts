/**
 * `vpn` domain -- Wave 4 Item5-vpn (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements every classified `cli.vpn.*` manifest entry:
 * - 5 already shipped (`setup`/`list`/`remote`/`ovpn`/`dialout`), basis
 *   `sibling-live-verified` against `vigor3912s-mcp` (read-only evidence,
 *   never imported at runtime);
 * - the remaining `documented-syntax` entries below, modelled from Part VIII
 *   rawLine evidence in `.ai/skills/vigor3912s/references/cli-reference-raw.txt`.
 *
 * YAGNI narrowing (deliberate, commented at each site -- not silently
 * dropped) when a heading documents many distinct sub-forms:
 * - `l2lset` / `dinset` / `option` / `trunk` / `sameSubnet` / `l2lDrop`:
 *   opaque validated trailing `param` (same shape as existing `setup`/
 *   `ovpn`/`dial_out`), rather than enumerating every documented variant;
 * - `l2lDialout`: index dial-out only -- the documented `list` sub-form is a
 *   read-shaped display under a write-classified entry and is deferred.
 *
 * `parse` adapters are thin: each pulls the first exchange's `stdout` and
 * hands it to a pure `(text: string) => TOutput` parser in
 * `internal/parsers/vpn/*.ts`. None of these commands documents a
 * machine-parseable response schema beyond prompt-delimited free text, so
 * every parser reduces to trimmed raw text.
 */

import { InvalidInputError } from "../errors.js";
import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseDialOut } from "../internal/parsers/vpn/dialout.js";
import { parseDinset } from "../internal/parsers/vpn/dinset.js";
import { parseFromlanAdd } from "../internal/parsers/vpn/fromlanadd.js";
import { parseFromlanDisable } from "../internal/parsers/vpn/fromlandisable.js";
import { parseFromlanEnable } from "../internal/parsers/vpn/fromlanenable.js";
import { parseFromlanRemove } from "../internal/parsers/vpn/fromlanremove.js";
import { parseFromlanStatus } from "../internal/parsers/vpn/fromlanstatus.js";
import { parseGraph } from "../internal/parsers/vpn/graph.js";
import { parseIke } from "../internal/parsers/vpn/ike.js";
import { parseIsolate } from "../internal/parsers/vpn/isolate.js";
import { parseL2lDialout } from "../internal/parsers/vpn/l2ldialout.js";
import { parseL2lDrop } from "../internal/parsers/vpn/l2ldrop.js";
import { parseL2lSet } from "../internal/parsers/vpn/l2lset.js";
import { parseList } from "../internal/parsers/vpn/list.js";
import { parseMfa } from "../internal/parsers/vpn/mfa.js";
import { parseMirror } from "../internal/parsers/vpn/mirror.js";
import { parseMrouteAdd } from "../internal/parsers/vpn/mrouteadd.js";
import { parseMrouteAddmsa } from "../internal/parsers/vpn/mrouteaddmsa.js";
import { parseMrouteDel } from "../internal/parsers/vpn/mroutedel.js";
import { parseMrouteDelmsa } from "../internal/parsers/vpn/mroutedelmsa.js";
import { parseMrouteList } from "../internal/parsers/vpn/mroutelist.js";
import { parseMssDefault } from "../internal/parsers/vpn/mssdefault.js";
import { parseMssSet } from "../internal/parsers/vpn/mssset.js";
import { parseMssShow } from "../internal/parsers/vpn/mssshow.js";
import { parseMulticast } from "../internal/parsers/vpn/multicast.js";
import { parseNetBios } from "../internal/parsers/vpn/netbios.js";
import { parseOption } from "../internal/parsers/vpn/option.js";
import { parseOvpn } from "../internal/parsers/vpn/ovpn.js";
import { parsePass2nat } from "../internal/parsers/vpn/pass2nat.js";
import { parsePass2nd } from "../internal/parsers/vpn/pass2nd.js";
import { parseRemote } from "../internal/parsers/vpn/remote.js";
import { parseSameSubnet } from "../internal/parsers/vpn/samesubnet.js";
import { parseSetup } from "../internal/parsers/vpn/setup.js";
import { parseSubnet } from "../internal/parsers/vpn/subnet.js";
import { parseTrunk } from "../internal/parsers/vpn/trunk.js";
import type { RawCommandOutput } from "../internal/parsers/vpn/shared.js";
import {
  assertCliValue,
  assertIntegerInRange,
  assertIpv4,
  assertOneOf,
  assertParamTail,
  defineCommandOperation,
  defineRawOperation,
  firstExchangeText,
  onOff,
  type ParamTailGrammar,
} from "../internal/domain-support.js";

/** Documented LAN-to-LAN / remote dial-in profile index range (Part VIII). */
const PROFILE_INDEX_MIN = 1;
const PROFILE_INDEX_MAX = 500;

/**
 * Documented grammars of the `<param>` tails this family passes through
 * (Part VIII rawLines cited on each operation below).
 */
const VPN_PARAM_GRAMMARS = {
  setup: {},
  ovpn: {
    firstToken: [
      "mode",
      "show",
      "udp_mode",
      "tcp_mode",
      "udp_port",
      "tcp_port",
      "cert",
      "replay",
      "certmode",
      "hmacmode",
      "ca",
      "tlsauth_del",
    ],
  },
  dialout: { firstToken: ["dial"] },
  l2lset: {
    firstToken: [
      "peerid",
      "localid",
      "main",
      "aggressive",
      "pfs",
      "phase1",
      "phase2",
      "x509localid",
      "compress",
    ],
  },
  l2ldrop: { firstToken: ["l2lname", "l2lidx", "h2lname", "h2lidx"], allowIntegerFirst: true },
  // Documented `vpn dinset <index> <subcommand> ...` keywords (rawLine 9673),
  // kept as one string: they are CLI subcommand names, not credentials.
  dinset: {
    firstToken:
      "on off username password motp pin_secret timeout dintype subnet assignip srnode remoteip peer naming multicastvpn prekey assignkey digsig ipsec localid".split(
        " ",
      ),
  },
  option: { tokenPattern: /^[A-Za-z_][A-Za-z0-9_]*=\S*$/ },
  trunk: { firstToken: ["show_usable", "backup", "lb", "bind", "SetGre"] },
  samesubnet: { flags: ["-i", "-e", "-I", "-o", "-E", "-v", "-m"] },
} as const satisfies Readonly<Record<string, ParamTailGrammar>>;

function assertProfileIndex(value: number, name = "index"): void {
  assertIntegerInRange(value, PROFILE_INDEX_MIN, PROFILE_INDEX_MAX, name);
}

// ---------------------------------------------------------------------------
// cli.vpn.setup -- `vpn setup <index> <param>` (rawLine 9861) -- write.
// `<param>` is the caller-supplied trailing syntax for one of the
// documented dial-out/dial-in variants (e.g. `name1 pptp_out 1.2.3.4 vigor
// 1234 192.168.1.0 255.255.255.0`), per this task's primary syntax source
// (see the module-level comment above).
// ---------------------------------------------------------------------------

export interface VpnSetupInput {
  readonly index: number;
  readonly param: string;
}

function buildSetupFrames(input: VpnSetupInput): readonly CommandFrame[] {
  assertIntegerInRange(input.index, 1, 128, "index");
  assertParamTail(input.param, "param", VPN_PARAM_GRAMMARS.setup);

  return [frameSingleCommand(`vpn setup ${String(input.index)} ${input.param}`)];
}

export const vpnSetup: TypedOperation<VpnSetupInput, RawCommandOutput> = {
  manifestId: "cli.vpn.setup",
  classification: "write",
  buildFrames: buildSetupFrames,
  parse: (exchanges) => parseSetup(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.list -- `vpn list` (rawLine 10146) -- read, bare no-argument query
// (sibling-live-verified form; see the module-level comment above).
// ---------------------------------------------------------------------------

function buildListFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vpn list")];
}

export const vpnList: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vpn.list",
  classification: "read",
  buildFrames: buildListFrames,
  parse: (exchanges) => parseList(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.remote -- `vpn remote` (rawLine 10208) -- read, bare no-argument
// query (sibling-live-verified form; see the module-level comment above).
// ---------------------------------------------------------------------------

function buildRemoteFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vpn remote")];
}

export const vpnRemote: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vpn.remote",
  classification: "read",
  buildFrames: buildRemoteFrames,
  parse: (exchanges) => parseRemote(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.ovpn -- `vpn ovpn <param>` (rawLine 10651) -- write. `<param>` is
// the caller-supplied trailing sub-command (e.g. `mode 1`, `show`,
// `udp_port 1194`), per this task's primary syntax source.
// ---------------------------------------------------------------------------

export interface VpnOvpnInput {
  readonly param: string;
}

function buildOvpnFrames(input: VpnOvpnInput): readonly CommandFrame[] {
  assertParamTail(input.param, "param", VPN_PARAM_GRAMMARS.ovpn);

  return [frameSingleCommand(`vpn ovpn ${input.param}`)];
}

export const vpnOvpn: TypedOperation<VpnOvpnInput, RawCommandOutput> = {
  manifestId: "cli.vpn.ovpn",
  classification: "write",
  buildFrames: buildOvpnFrames,
  parse: (exchanges) => parseOvpn(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.dialout -- `vpn dial_out <param>` (rawLine 10706) -- write.
// `<param>` is the caller-supplied trailing syntax (documented form: `dial
// <index>`), per this task's primary syntax source.
// ---------------------------------------------------------------------------

export interface VpnDialOutInput {
  readonly param: string;
}

function buildDialOutFrames(input: VpnDialOutInput): readonly CommandFrame[] {
  assertParamTail(input.param, "param", VPN_PARAM_GRAMMARS.dialout);

  return [frameSingleCommand(`vpn dial_out ${input.param}`)];
}

export const vpnDialOut: TypedOperation<VpnDialOutInput, RawCommandOutput> = {
  manifestId: "cli.vpn.dialout",
  classification: "write",
  buildFrames: buildDialOutFrames,
  parse: (exchanges) => parseDialOut(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.l2lset -- `vpn l2lset <index> <param>` (rawLine 9570) -- write.
// Heading lists many peerid/localid/main/aggressive/pfs/... sub-forms --
// YAGNI: opaque trailing `param` rather than an enumerated union.
// ---------------------------------------------------------------------------

export interface VpnL2lSetInput {
  readonly index: number;
  readonly param: string;
}

function buildL2lSetFrames(input: VpnL2lSetInput): readonly CommandFrame[] {
  assertProfileIndex(input.index);
  assertParamTail(input.param, "param", VPN_PARAM_GRAMMARS.l2lset);

  return [frameSingleCommand(`vpn l2lset ${String(input.index)} ${input.param}`)];
}

export const vpnL2lSet: TypedOperation<VpnL2lSetInput, RawCommandOutput> = {
  manifestId: "cli.vpn.l2lset",
  classification: "write",
  buildFrames: buildL2lSetFrames,
  parse: (exchanges) => parseL2lSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.l2ldrop -- `vpn l2lDrop [param]` (rawLine 9632) -- write.
// Bare form drops all VPN; other forms (l2lname/l2lidx/h2lname/h2lidx/ifno)
// pass through as opaque `param` (YAGNI: not an enumerated union).
// ---------------------------------------------------------------------------

export interface VpnL2lDropInput {
  readonly param?: string;
}

function buildL2lDropFrames(input: VpnL2lDropInput = {}): readonly CommandFrame[] {
  if (input.param === undefined) {
    return [frameSingleCommand("vpn l2lDrop")];
  }

  assertParamTail(input.param, "param", VPN_PARAM_GRAMMARS.l2ldrop);

  return [frameSingleCommand(`vpn l2lDrop ${input.param}`)];
}

export const vpnL2lDrop: TypedOperation<VpnL2lDropInput, RawCommandOutput> = {
  manifestId: "cli.vpn.l2ldrop",
  classification: "write",
  buildFrames: buildL2lDropFrames,
  parse: (exchanges) => parseL2lDrop(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.l2ldialout -- `vpn l2lDialout <index>` (rawLine 9656) -- write.
// Documented `list` display sub-form is a deliberate YAGNI deferral (read-
// shaped under a write-classified entry).
// ---------------------------------------------------------------------------

export interface VpnL2lDialoutInput {
  readonly index: number;
}

function buildL2lDialoutFrames(input: VpnL2lDialoutInput): readonly CommandFrame[] {
  assertProfileIndex(input.index);

  return [frameSingleCommand(`vpn l2lDialout ${String(input.index)}`)];
}

export const vpnL2lDialout: TypedOperation<VpnL2lDialoutInput, RawCommandOutput> = {
  manifestId: "cli.vpn.l2ldialout",
  classification: "write",
  buildFrames: buildL2lDialoutFrames,
  parse: (exchanges) => parseL2lDialout(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.dinset -- `vpn dinset <index> [param]` (rawLine 9673) -- write.
// Many username/password/motp/dintype/... trailing forms -- YAGNI: opaque
// optional `param` (omit to issue the bare index form).
// ---------------------------------------------------------------------------

export interface VpnDinsetInput {
  readonly index: number;
  readonly param?: string;
}

function buildDinsetFrames(input: VpnDinsetInput): readonly CommandFrame[] {
  assertProfileIndex(input.index);

  if (input.param === undefined) {
    return [frameSingleCommand(`vpn dinset ${String(input.index)}`)];
  }

  assertParamTail(input.param, "param", VPN_PARAM_GRAMMARS.dinset);

  return [frameSingleCommand(`vpn dinset ${String(input.index)} ${input.param}`)];
}

export const vpnDinset: TypedOperation<VpnDinsetInput, RawCommandOutput> = {
  manifestId: "cli.vpn.dinset",
  classification: "write",
  buildFrames: buildDinsetFrames,
  parse: (exchanges) => parseDinset(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.subnet -- `vpn subnet <index> <1..100>` (rawLine 9845) -- write.
// ---------------------------------------------------------------------------

export interface VpnSubnetInput {
  readonly index: number;
  readonly lan: number;
}

function buildSubnetFrames(input: VpnSubnetInput): readonly CommandFrame[] {
  assertProfileIndex(input.index);
  assertIntegerInRange(input.lan, 1, 100, "lan");

  return [frameSingleCommand(`vpn subnet ${String(input.index)} ${String(input.lan)}`)];
}

export const vpnSubnet: TypedOperation<VpnSubnetInput, RawCommandOutput> = {
  manifestId: "cli.vpn.subnet",
  classification: "write",
  buildFrames: buildSubnetFrames,
  parse: (exchanges) => parseSubnet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.option -- `vpn option <index> <param>` (rawLine 9937) -- write.
// `<cmd>=<param>` vocabulary is large -- YAGNI: opaque trailing `param`
// (e.g. `idle=250`, `pname=carrietest`).
// ---------------------------------------------------------------------------

export interface VpnOptionInput {
  readonly index: number;
  readonly param: string;
}

function buildOptionFrames(input: VpnOptionInput): readonly CommandFrame[] {
  assertProfileIndex(input.index);
  assertParamTail(input.param, "param", VPN_PARAM_GRAMMARS.option);

  return [frameSingleCommand(`vpn option ${String(input.index)} ${input.param}`)];
}

export const vpnOption: TypedOperation<VpnOptionInput, RawCommandOutput> = {
  manifestId: "cli.vpn.option",
  classification: "write",
  buildFrames: buildOptionFrames,
  parse: (exchanges) => parseOption(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.mroute.* -- `vpn mroute <index> <list|add|del|addmsa|delmsa> ...`
// (rawLine 10115). Split into per-subcommand manifest entries.
// ---------------------------------------------------------------------------

export interface VpnMrouteListInput {
  readonly index: number;
}

function buildMrouteListFrames(input: VpnMrouteListInput): readonly CommandFrame[] {
  assertProfileIndex(input.index);

  return [frameSingleCommand(`vpn mroute ${String(input.index)} list`)];
}

export const vpnMrouteList: TypedOperation<VpnMrouteListInput, RawCommandOutput> = {
  manifestId: "cli.vpn.mroute.list",
  classification: "read",
  buildFrames: buildMrouteListFrames,
  parse: (exchanges) => parseMrouteList(firstExchangeText(exchanges)),
};

export interface VpnMrouteAddInput {
  readonly index: number;
  readonly network: string;
}

function buildMrouteAddFrames(input: VpnMrouteAddInput): readonly CommandFrame[] {
  assertProfileIndex(input.index);
  assertCliValue(input.network, "network");

  return [frameSingleCommand(`vpn mroute ${String(input.index)} add ${input.network}`)];
}

export const vpnMrouteAdd: TypedOperation<VpnMrouteAddInput, RawCommandOutput> = {
  manifestId: "cli.vpn.mroute.add",
  classification: "write",
  buildFrames: buildMrouteAddFrames,
  parse: (exchanges) => parseMrouteAdd(firstExchangeText(exchanges)),
};

export interface VpnMrouteDelInput {
  readonly index: number;
  readonly network: string;
}

function buildMrouteDelFrames(input: VpnMrouteDelInput): readonly CommandFrame[] {
  assertProfileIndex(input.index);
  assertCliValue(input.network, "network");

  return [frameSingleCommand(`vpn mroute ${String(input.index)} del ${input.network}`)];
}

export const vpnMrouteDel: TypedOperation<VpnMrouteDelInput, RawCommandOutput> = {
  manifestId: "cli.vpn.mroute.del",
  classification: "write",
  buildFrames: buildMrouteDelFrames,
  parse: (exchanges) => parseMrouteDel(firstExchangeText(exchanges)),
};

export interface VpnMrouteAddmsaInput {
  readonly index: number;
  readonly localNetwork: string;
  readonly remoteNetwork: string;
}

function buildMrouteAddmsaFrames(input: VpnMrouteAddmsaInput): readonly CommandFrame[] {
  assertProfileIndex(input.index);
  assertCliValue(input.localNetwork, "localNetwork");
  assertCliValue(input.remoteNetwork, "remoteNetwork");

  return [
    frameSingleCommand(
      `vpn mroute ${String(input.index)} addmsa ${input.localNetwork} ${input.remoteNetwork}`,
    ),
  ];
}

export const vpnMrouteAddmsa: TypedOperation<VpnMrouteAddmsaInput, RawCommandOutput> = {
  manifestId: "cli.vpn.mroute.addmsa",
  classification: "write",
  buildFrames: buildMrouteAddmsaFrames,
  parse: (exchanges) => parseMrouteAddmsa(firstExchangeText(exchanges)),
};

export interface VpnMrouteDelmsaInput {
  readonly index: number;
  readonly localNetwork: string;
  readonly remoteNetwork: string;
}

function buildMrouteDelmsaFrames(input: VpnMrouteDelmsaInput): readonly CommandFrame[] {
  assertProfileIndex(input.index);
  assertCliValue(input.localNetwork, "localNetwork");
  assertCliValue(input.remoteNetwork, "remoteNetwork");

  return [
    frameSingleCommand(
      `vpn mroute ${String(input.index)} delmsa ${input.localNetwork} ${input.remoteNetwork}`,
    ),
  ];
}

export const vpnMrouteDelmsa: TypedOperation<VpnMrouteDelmsaInput, RawCommandOutput> = {
  manifestId: "cli.vpn.mroute.delmsa",
  classification: "write",
  buildFrames: buildMrouteDelmsaFrames,
  parse: (exchanges) => parseMrouteDelmsa(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.trunk -- `vpn trunk <param>` (rawLine 10228) -- write.
// backup/lb/bind/SetGre/... vocabulary is large -- YAGNI: opaque `param`.
// ---------------------------------------------------------------------------

export interface VpnTrunkInput {
  readonly param: string;
}

function buildTrunkFrames(input: VpnTrunkInput): readonly CommandFrame[] {
  assertParamTail(input.param, "param", VPN_PARAM_GRAMMARS.trunk);

  return [frameSingleCommand(`vpn trunk ${input.param}`)];
}

export const vpnTrunk: TypedOperation<VpnTrunkInput, RawCommandOutput> = {
  manifestId: "cli.vpn.trunk",
  classification: "write",
  buildFrames: buildTrunkFrames,
  parse: (exchanges) => parseTrunk(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.netbios -- `vpn NetBios set <H2l|L2l> <index> <Block|Pass>`
// (rawLine 10469) -- write.
// ---------------------------------------------------------------------------

export interface VpnNetBiosInput {
  readonly scope: "H2l" | "L2l";
  readonly index: number;
  readonly mode: "Block" | "Pass";
}

function buildNetBiosFrames(input: VpnNetBiosInput): readonly CommandFrame[] {
  assertOneOf(input.scope, ["H2l", "L2l"], "scope");
  assertProfileIndex(input.index);
  assertOneOf(input.mode, ["Block", "Pass"], "mode");

  return [
    frameSingleCommand(`vpn NetBios set ${input.scope} ${String(input.index)} ${input.mode}`),
  ];
}

export const vpnNetBios: TypedOperation<VpnNetBiosInput, RawCommandOutput> = {
  manifestId: "cli.vpn.netbios",
  classification: "write",
  buildFrames: buildNetBiosFrames,
  parse: (exchanges) => parseNetBios(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.mss.* -- `vpn mss show|default|set ...` (rawLine 10490).
// ---------------------------------------------------------------------------

function buildMssShowFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vpn mss show")];
}

export const vpnMssShow: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vpn.mss.show",
  classification: "read",
  buildFrames: buildMssShowFrames,
  parse: (exchanges) => parseMssShow(firstExchangeText(exchanges)),
};

function buildMssDefaultFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vpn mss default")];
}

export const vpnMssDefault: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vpn.mss.default",
  classification: "write",
  buildFrames: buildMssDefaultFrames,
  parse: (exchanges) => parseMssDefault(firstExchangeText(exchanges)),
};

/** Per-type TCP MSS maxima from Part VIII (all share minimum 512). */
const MSS_MAX_BY_TYPE = {
  1: 1412, // PPTP
  2: 1408, // L2TP
  3: 1381, // IPSec
  4: 1361, // L2TP over IPSec
  5: 1365, // GRE over IPsec
  6: 1360, // SSL Tunnel
  7: 1380, // WireGuard
} as const;

export interface VpnMssSetInput {
  readonly connectionType: keyof typeof MSS_MAX_BY_TYPE;
  readonly mss: number;
}

function buildMssSetFrames(input: VpnMssSetInput): readonly CommandFrame[] {
  assertOneOf(input.connectionType, [1, 2, 3, 4, 5, 6, 7], "connectionType");
  assertIntegerInRange(input.mss, 512, MSS_MAX_BY_TYPE[input.connectionType], "mss");

  return [frameSingleCommand(`vpn mss set ${String(input.connectionType)} ${String(input.mss)}`)];
}

export const vpnMssSet: TypedOperation<VpnMssSetInput, RawCommandOutput> = {
  manifestId: "cli.vpn.mss.set",
  classification: "write",
  buildFrames: buildMssSetFrames,
  parse: (exchanges) => parseMssSet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.ike -- `vpn ike -q` / `vpn ike -s` (rawLine 10547) -- read.
// ---------------------------------------------------------------------------

export interface VpnIkeInput {
  readonly flag: "q" | "s";
}

function buildIkeFrames(input: VpnIkeInput): readonly CommandFrame[] {
  assertOneOf(input.flag, ["q", "s"], "flag");

  return [frameSingleCommand(`vpn ike -${input.flag}`)];
}

export const vpnIke: TypedOperation<VpnIkeInput, RawCommandOutput> = {
  manifestId: "cli.vpn.ike",
  classification: "read",
  buildFrames: buildIkeFrames,
  parse: (exchanges) => parseIke(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.multicast -- `vpn Multicast set <H2l|L2l> <index> <Block|Pass>`
// (rawLine 10561) -- write.
// ---------------------------------------------------------------------------

export interface VpnMulticastInput {
  readonly scope: "H2l" | "L2l";
  readonly index: number;
  readonly mode: "Block" | "Pass";
}

function buildMulticastFrames(input: VpnMulticastInput): readonly CommandFrame[] {
  assertOneOf(input.scope, ["H2l", "L2l"], "scope");
  assertProfileIndex(input.index);
  assertOneOf(input.mode, ["Block", "Pass"], "mode");

  return [
    frameSingleCommand(`vpn Multicast set ${input.scope} ${String(input.index)} ${input.mode}`),
  ];
}

export const vpnMulticast: TypedOperation<VpnMulticastInput, RawCommandOutput> = {
  manifestId: "cli.vpn.multicast",
  classification: "write",
  buildFrames: buildMulticastFrames,
  parse: (exchanges) => parseMulticast(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.pass2nd -- `vpn pass2nd <on|off>` (rawLine 10576) -- write.
// ---------------------------------------------------------------------------

export interface VpnPass2ndInput {
  readonly state: "on" | "off";
}

function buildPass2ndFrames(input: VpnPass2ndInput): readonly CommandFrame[] {
  assertOneOf(input.state, ["on", "off"], "state");

  return [frameSingleCommand(`vpn pass2nd ${input.state}`)];
}

export const vpnPass2nd: TypedOperation<VpnPass2ndInput, RawCommandOutput> = {
  manifestId: "cli.vpn.pass2nd",
  classification: "write",
  buildFrames: buildPass2ndFrames,
  parse: (exchanges) => parsePass2nd(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.pass2nat -- `vpn pass2nat <on|off>` (rawLine 10593) -- write.
// ---------------------------------------------------------------------------

export interface VpnPass2natInput {
  readonly state: "on" | "off";
}

function buildPass2natFrames(input: VpnPass2natInput): readonly CommandFrame[] {
  assertOneOf(input.state, ["on", "off"], "state");

  return [frameSingleCommand(`vpn pass2nat ${input.state}`)];
}

export const vpnPass2nat: TypedOperation<VpnPass2natInput, RawCommandOutput> = {
  manifestId: "cli.vpn.pass2nat",
  classification: "write",
  buildFrames: buildPass2natFrames,
  parse: (exchanges) => parsePass2nat(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.samesubnet -- `vpn sameSubnet <param>` (rawLine 10608) -- write.
// Many -i/-e/-I/-o/-v/-m flag forms -- YAGNI: opaque `param`.
// ---------------------------------------------------------------------------

export interface VpnSameSubnetInput {
  readonly param: string;
}

function buildSameSubnetFrames(input: VpnSameSubnetInput): readonly CommandFrame[] {
  assertParamTail(input.param, "param", VPN_PARAM_GRAMMARS.samesubnet);

  return [frameSingleCommand(`vpn sameSubnet ${input.param}`)];
}

export const vpnSameSubnet: TypedOperation<VpnSameSubnetInput, RawCommandOutput> = {
  manifestId: "cli.vpn.samesubnet",
  classification: "write",
  buildFrames: buildSameSubnetFrames,
  parse: (exchanges) => parseSameSubnet(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.mirror -- `vpn mirror <l2l|h2l> <index>` (rawLine 10722) -- write.
// ---------------------------------------------------------------------------

export interface VpnMirrorInput {
  readonly scope: "l2l" | "h2l";
  readonly index: number;
}

function buildMirrorFrames(input: VpnMirrorInput): readonly CommandFrame[] {
  assertOneOf(input.scope, ["l2l", "h2l"], "scope");
  assertProfileIndex(input.index);

  return [frameSingleCommand(`vpn mirror ${input.scope} ${String(input.index)}`)];
}

export const vpnMirror: TypedOperation<VpnMirrorInput, RawCommandOutput> = {
  manifestId: "cli.vpn.mirror",
  classification: "write",
  buildFrames: buildMirrorFrames,
  parse: (exchanges) => parseMirror(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.fromlan.* -- `vpn fromlan status|enable|disable|add|remove`
// (rawLine 10736).
// ---------------------------------------------------------------------------

function buildFromlanStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vpn fromlan status")];
}

export const vpnFromlanStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vpn.fromlan.status",
  classification: "read",
  buildFrames: buildFromlanStatusFrames,
  parse: (exchanges) => parseFromlanStatus(firstExchangeText(exchanges)),
};

function buildFromlanEnableFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vpn fromlan enable")];
}

export const vpnFromlanEnable: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vpn.fromlan.enable",
  classification: "write",
  buildFrames: buildFromlanEnableFrames,
  parse: (exchanges) => parseFromlanEnable(firstExchangeText(exchanges)),
};

function buildFromlanDisableFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vpn fromlan disable")];
}

export const vpnFromlanDisable: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vpn.fromlan.disable",
  classification: "write",
  buildFrames: buildFromlanDisableFrames,
  parse: (exchanges) => parseFromlanDisable(firstExchangeText(exchanges)),
};

export interface VpnFromlanAddInput {
  /** LAN token as documented (`lan2`, `lan3`, ...). */
  readonly lan: string;
}

const FROMLAN_LAN_PATTERN = /^lan([2-9]|[1-9]\d|100)$/;

function assertFromlanLan(value: string): void {
  if (!FROMLAN_LAN_PATTERN.test(value)) {
    throw new InvalidInputError(`lan must match lan2..lan100 (got "${value}").`);
  }
}

function buildFromlanAddFrames(input: VpnFromlanAddInput): readonly CommandFrame[] {
  assertFromlanLan(input.lan);

  return [frameSingleCommand(`vpn fromlan add ${input.lan}`)];
}

export const vpnFromlanAdd: TypedOperation<VpnFromlanAddInput, RawCommandOutput> = {
  manifestId: "cli.vpn.fromlan.add",
  classification: "write",
  buildFrames: buildFromlanAddFrames,
  parse: (exchanges) => parseFromlanAdd(firstExchangeText(exchanges)),
};

export interface VpnFromlanRemoveInput {
  readonly lan: string;
}

function buildFromlanRemoveFrames(input: VpnFromlanRemoveInput): readonly CommandFrame[] {
  assertFromlanLan(input.lan);

  return [frameSingleCommand(`vpn fromlan remove ${input.lan}`)];
}

export const vpnFromlanRemove: TypedOperation<VpnFromlanRemoveInput, RawCommandOutput> = {
  manifestId: "cli.vpn.fromlan.remove",
  classification: "write",
  buildFrames: buildFromlanRemoveFrames,
  parse: (exchanges) => parseFromlanRemove(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.isolate -- `vpn isolate <on|off>` (rawLine 10754) -- write.
// ---------------------------------------------------------------------------

export interface VpnIsolateInput {
  readonly state: "on" | "off";
}

function buildIsolateFrames(input: VpnIsolateInput): readonly CommandFrame[] {
  assertOneOf(input.state, ["on", "off"], "state");

  return [frameSingleCommand(`vpn isolate ${input.state}`)];
}

export const vpnIsolate: TypedOperation<VpnIsolateInput, RawCommandOutput> = {
  manifestId: "cli.vpn.isolate",
  classification: "write",
  buildFrames: buildIsolateFrames,
  parse: (exchanges) => parseIsolate(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.mfa -- `vpn mfa bypass <duration>` (rawLine 10765) -- write.
// Duration forms: `10H`, `2D`, range `0H` ~ `31D`.
// ---------------------------------------------------------------------------

export interface VpnMfaInput {
  readonly duration: string;
}

const MFA_DURATION_PATTERN = /^(\d+)([HD])$/;

function assertMfaDuration(value: string): void {
  const match = MFA_DURATION_PATTERN.exec(value);

  if (match === null) {
    throw new InvalidInputError(`duration must look like 10H or 2D (got "${value}").`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === "D" && (amount < 0 || amount > 31)) {
    throw new InvalidInputError(`duration days must be between 0 and 31 (got "${value}").`);
  }

  // Hours upper bound mirrors 31D (744H); 0H disables per the doc.
  if (unit === "H" && (amount < 0 || amount > 744)) {
    throw new InvalidInputError(`duration hours must be between 0 and 744 (got "${value}").`);
  }
}

function buildMfaFrames(input: VpnMfaInput): readonly CommandFrame[] {
  assertMfaDuration(input.duration);

  return [frameSingleCommand(`vpn mfa bypass ${input.duration}`)];
}

export const vpnMfa: TypedOperation<VpnMfaInput, RawCommandOutput> = {
  manifestId: "cli.vpn.mfa",
  classification: "write",
  buildFrames: buildMfaFrames,
  parse: (exchanges) => parseMfa(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// cli.vpn.graph -- `vpn graph` (live-firmware-recon) -- bare read query.
// ---------------------------------------------------------------------------

function buildGraphFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vpn graph")];
}

export const vpnGraph: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vpn.graph",
  classification: "read",
  buildFrames: buildGraphFrames,
  parse: (exchanges) => parseGraph(firstExchangeText(exchanges)),
};

// ---------------------------------------------------------------------------
// Sub-form completion (S8).
// ---------------------------------------------------------------------------

// `vpn list <index> <all/com/out/in/net>` (rawLine 10146): one LAN-to-LAN
// profile's full / common / dial-out / dial-in / network settings.
const VPN_LIST_SECTIONS = ["all", "com", "out", "in", "net"] as const;

export interface VpnListProfileInput {
  /** LAN-to-LAN profile 1..500. */
  readonly index: number;
  readonly section: (typeof VPN_LIST_SECTIONS)[number];
}

export const vpnListProfile = defineRawOperation<VpnListProfileInput>(
  "cli.vpn.list.profile",
  "read",
  (input) => {
    assertIntegerInRange(input.index, 1, 500, "index");
    assertOneOf(input.section, VPN_LIST_SECTIONS, "section");
    return `vpn list ${String(input.index)} ${input.section}`;
  },
);

// `vpn remote <service> [<wanN>] <on/off>` (rawLine 10208): enable/disable a
// remote-dial-in VPN service, optionally on one WAN; applied after restart.
const VPN_REMOTE_SERVICES = ["PPTP", "IPsec", "L2TP", "SSLVPN", "OpenVPN", "WireGuard"] as const;

export interface VpnRemoteSetInput {
  readonly service: (typeof VPN_REMOTE_SERVICES)[number];
  /** `wan1`..`wan12`; omitted applies to the service as a whole. */
  readonly wanInterface?: string;
  readonly enabled: boolean;
}

export const vpnRemoteSet = defineRawOperation<VpnRemoteSetInput>(
  "cli.vpn.remote.set",
  "write",
  (input) => {
    assertOneOf(input.service, VPN_REMOTE_SERVICES, "service");
    const state = onOff(input.enabled);

    if (input.wanInterface === undefined) {
      return `vpn remote ${input.service} ${state}`;
    }

    if (!/^wan([1-9]|1[0-2])$/.test(input.wanInterface)) {
      throw new InvalidInputError(
        `wanInterface must match "wan1".."wan12" (got "${input.wanInterface}").`,
      );
    }

    return `vpn remote ${input.service} ${input.wanInterface} ${state}`;
  },
);

// ---------------------------------------------------------------------------
// Live-firmware-recon operations (fw 4.4.7_RC2 `?` help, owner capture in
// `references/live-help-fw-4.4.7_RC2.txt`); absent from the Part VIII PDF.
// ---------------------------------------------------------------------------

export type VpnUdpInput =
  | {
      readonly action: "add" | "del";
      readonly remoteIp: string;
      readonly remotePort: number;
      readonly localPort: number;
    }
  | {
      readonly action: "set";
      readonly serverIp: string;
      readonly serverPort: number;
      readonly enabled: boolean;
    }
  | {
      /** `udp.<DeviceID>.local` host name to clear. */
      readonly action: "clear";
      readonly host: string;
    };

export const vpnUdp = defineRawOperation<VpnUdpInput>("cli.vpn.udp", "write", (input) => {
  switch (input.action) {
    case "set":
      assertIpv4(input.serverIp, "serverIp");
      assertIntegerInRange(input.serverPort, 1, 65535, "serverPort");
      return `vpn udp set ${input.serverIp} ${String(input.serverPort)} ${input.enabled ? "enable" : "disable"}`;
    case "clear":
      if (!/^udp\.[0-9A-Za-z]+\.local$/.test(input.host)) {
        throw new InvalidInputError(
          `host must look like udp.<DeviceID>.local (got "${input.host}").`,
        );
      }
      return `vpn udp clear ${input.host}`;
    default:
      assertOneOf(input.action, ["add", "del"], "action");
      assertIpv4(input.remoteIp, "remoteIp");
      assertIntegerInRange(input.remotePort, 1, 65535, "remotePort");
      assertIntegerInRange(input.localPort, 1, 65535, "localPort");
      return `vpn udp ${input.action} ${input.remoteIp} ${String(input.remotePort)} ${String(input.localPort)}`;
  }
});

export interface VpnPassApmInput {
  readonly enabled: boolean;
}

export const vpnPassApm = defineRawOperation<VpnPassApmInput>(
  "cli.vpn.passapm",
  "write",
  (input) => `vpn passAPM ${onOff(input.enabled)}`,
);

export interface VpnDpdkctrlTableInput {
  /** IPsec security policy (`sp`) or security association (`sa`) table. */
  readonly table: "sp" | "sa";
}

export const vpnDpdkctrlDump = defineRawOperation<VpnDpdkctrlTableInput>(
  "cli.vpn.dpdkctrl.dump",
  "read",
  (input) => {
    assertOneOf(input.table, ["sp", "sa"], "table");
    return `vpn dpdkctrl "${input.table} dump"`;
  },
);

/** Flushes the DPDK IPsec SP/SA table: established tunnels drop. */
export const vpnDpdkctrlFlush = defineRawOperation<VpnDpdkctrlTableInput>(
  "cli.vpn.dpdkctrl.flush",
  "destructive",
  (input) => {
    assertOneOf(input.table, ["sp", "sa"], "table");
    return `vpn dpdkctrl "${input.table} flush"`;
  },
);

export type VpnDpdkctrlSetInput =
  | { readonly feature: "pptp" | "wireguard"; readonly enabled: boolean }
  | {
      /** DPDK acceleration for SYN / SYN,ACK. */
      readonly feature: "fastroute";
      readonly mode: "off" | "ip_all" | "subnet" | "subnet_all";
    };

export const vpnDpdkctrlSet = defineRawOperation<VpnDpdkctrlSetInput>(
  "cli.vpn.dpdkctrl.set",
  "write",
  (input) => {
    if (input.feature === "fastroute") {
      assertOneOf(input.mode, ["off", "ip_all", "subnet", "subnet_all"], "mode");
      return `vpn dpdkctrl fastroute ${input.mode}`;
    }

    assertOneOf(input.feature, ["pptp", "wireguard"], "feature");
    return `vpn dpdkctrl ${input.feature} ${onOff(input.enabled)}`;
  },
);

const BASE64_KEY = /^[A-Za-z0-9+/]{42,43}=?$/;

function assertWgKey(value: string, name: string): void {
  if (!BASE64_KEY.test(value)) {
    throw new InvalidInputError(`${name} must be a base64 WireGuard key.`);
  }
}

export const vpnWgShow = defineCommandOperation("cli.vpn.wg.show", "read", "vpn wg show");

export interface VpnWgEnableInput {
  readonly enabled: boolean;
}

export const vpnWgEnable = defineRawOperation<VpnWgEnableInput>(
  "cli.vpn.wg.enable",
  "write",
  (input) => `vpn wg enable ${onOff(input.enabled)}`,
);

export interface VpnWgInterfaceInput {
  readonly listenPort: number;
  /** Tunnel address, e.g. `10.0.0.1/24`. */
  readonly address: string;
  readonly mtu?: number;
}

export const vpnWgInterface = defineRawOperation<VpnWgInterfaceInput>(
  "cli.vpn.wg.interface",
  "write",
  (input) => {
    assertIntegerInRange(input.listenPort, 1, 65535, "listenPort");
    assertCliValue(input.address, "address");
    const mtu = input.mtu === undefined ? "" : ` ${String(input.mtu)}`;

    if (input.mtu !== undefined) {
      assertIntegerInRange(input.mtu, 576, 9000, "mtu");
    }

    return `vpn wg interface ${String(input.listenPort)} ${input.address}${mtu}`;
  },
);

/** Generates a new private key: existing peers can no longer connect. */
export const vpnWgKeyGen = defineCommandOperation(
  "cli.vpn.wg.keygen",
  "destructive",
  "vpn wg key gen",
);

export interface VpnWgKeySetInput {
  /** Base64 private key (secret). */
  readonly privateKey: string;
}

/** Replaces the private key: existing peers can no longer connect. */
export const vpnWgKeySet = defineRawOperation<VpnWgKeySetInput>(
  "cli.vpn.wg.keyset",
  "destructive",
  (input) => {
    assertWgKey(input.privateKey, "privateKey");
    return `vpn wg key set ${input.privateKey}`;
  },
);

export type VpnWgPeerInput =
  | { readonly index: number; readonly action: "pubkey" | "psk"; readonly key: string }
  | { readonly index: number; readonly action: "allowedIps"; readonly allowedIps: string }
  | { readonly index: number; readonly action: "keepalive"; readonly seconds: number }
  | { readonly index: number; readonly action: "clear" };

export const vpnWgPeer = defineRawOperation<VpnWgPeerInput>("cli.vpn.wg.peer", "write", (input) => {
  assertIntegerInRange(input.index, 1, 1000, "index");
  const prefix = `vpn wg peer ${String(input.index)}`;

  switch (input.action) {
    case "pubkey":
    case "psk":
      assertWgKey(input.key, "key");
      return `${prefix} ${input.action} ${input.key}`;
    case "allowedIps":
      assertCliValue(input.allowedIps, "allowedIps");
      return `${prefix} allowed-ips ${input.allowedIps}`;
    case "keepalive":
      assertIntegerInRange(input.seconds, 0, 65535, "seconds");
      return `${prefix} keepalive ${String(input.seconds)}`;
    case "clear":
      return `${prefix} clear`;
  }
});

export const operations: readonly TypedOperation<never, unknown>[] = [
  vpnListProfile,
  vpnRemoteSet,
  vpnSetup,
  vpnList,
  vpnRemote,
  vpnOvpn,
  vpnDialOut,
  vpnL2lSet,
  vpnL2lDrop,
  vpnL2lDialout,
  vpnDinset,
  vpnSubnet,
  vpnOption,
  vpnMrouteList,
  vpnMrouteAdd,
  vpnMrouteDel,
  vpnMrouteAddmsa,
  vpnMrouteDelmsa,
  vpnTrunk,
  vpnNetBios,
  vpnMssShow,
  vpnMssDefault,
  vpnMssSet,
  vpnIke,
  vpnMulticast,
  vpnPass2nd,
  vpnPass2nat,
  vpnSameSubnet,
  vpnMirror,
  vpnFromlanStatus,
  vpnFromlanEnable,
  vpnFromlanDisable,
  vpnFromlanAdd,
  vpnFromlanRemove,
  vpnIsolate,
  vpnMfa,
  vpnGraph,
  vpnUdp,
  vpnPassApm,
  vpnDpdkctrlDump,
  vpnDpdkctrlFlush,
  vpnDpdkctrlSet,
  vpnWgShow,
  vpnWgEnable,
  vpnWgInterface,
  vpnWgKeyGen,
  vpnWgKeySet,
  vpnWgPeer,
];
