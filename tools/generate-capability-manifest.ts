/**
 * Capability manifest generator (`ARCHITECTURE.md` Item 1) + self-assembling
 * operation registry aggregator (`ARCHITECTURE.md` Item 5, `BACKLOG.md` B1
 * refinement).
 *
 * Manual tool — not part of `npm test`/`npm run verify` directly. Run via
 * `npm run manifest:generate` to (re)write, in one run:
 *   - `src/manifest/capability-manifest.generated.ts` (corpus-derived
 *     manifest, overlaid with `status: "implemented"`/`operationIds` for
 *     every id that has a self-assembled registry entry — see the "Domain
 *     self-assembly" section below);
 *   - `src/internal/registry/registry.generated.ts` (the self-assembled
 *     `OperationRegistry`, aggregated from `src/domains/*.ts`).
 * `npm run manifest:check` detects drift in *both* generated files between
 * what is committed and what this tool would produce today (see `--check`
 * below).
 *
 * Inputs (read-only, never modified, never embedded beyond location
 * citations):
 *   - `references/cli-reference-raw.txt` (vendored Part VIII CLI corpus).
 *   - `references/webui-index.md` (vendored WebUI capture INDEX).
 *   - `src/domains/*.ts` (domain modules, added incrementally by Wave 4; see
 *     `src/internal/registry/self-assembly.ts` for the required export
 *     convention). This directory does not exist yet as of this task — zero
 *     domains is a valid, non-error state, and the registry overlay below is
 *     a no-op until Wave 4 adds the first domain module.
 *
 * Both corpora are evidence-only: this tool never embeds capture text or
 * PDF prose into the generated output, only structural facts (title/command,
 * a line/row citation, and a classification derived from a hand-maintained
 * lookup table below — never inferred from the command string itself).
 *
 * Domain-module discovery/assembly is deliberately kept in its own module
 * (`src/internal/registry/self-assembly.ts`, imported below) rather than
 * inlined here, per the existing SRP note against entangling
 * manifest-corpus-reading with domain-discovery — this file only orchestrates
 * both concerns and writes their outputs.
 */

import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as prettier from "prettier";

import type {
  CapabilityEntry,
  CliCapabilityEntry,
  Classification,
  ClassificationBasis,
  WebUiCapabilityEntry,
} from "../src/manifest/types.js";
// Runtime (non-type-only) import of a local module: `node
// --experimental-strip-types` only strips types for the entry file's own
// static/dynamic graph resolved by specifier, not arbitrary `src/**.ts`
// sibling files reached via a `.js` specifier at plain Node runtime
// resolution. Mirrors `tools/import-redacted-fixture.ts`'s existing pattern
// of importing the *built* `dist/` output at runtime instead: this tool's
// `npm run manifest:generate`/`manifest:check` scripts run the narrow
// `tsc -p tsconfig.generator.json` build first (not the full `npm run
// build`) — narrow on purpose, so a stale/missing `src/domains/**` file or
// either `*.generated.ts` output can never block regenerating them.
import type * as SelfAssemblyModule from "../src/internal/registry/self-assembly.js";

const toolDir = fileURLToPath(new URL(".", import.meta.url));
const sdkRoot = path.resolve(toolDir, "..");
// Standalone package: corpora are vendored under references/ so CI and
// clones do not depend on the JOOservices workspace layout.
const CLI_RAW_PATH = path.join(sdkRoot, "references", "cli-reference-raw.txt");
const WEBUI_INDEX_PATH = path.join(sdkRoot, "references", "webui-index.md");
const GENERATED_OUTPUT_PATH = path.join(sdkRoot, "src/manifest/capability-manifest.generated.ts");
const DOMAINS_DIR = path.join(sdkRoot, "src/domains");
// Real (non-type-only) runtime import of discovered domain modules must use
// the `tsconfig.generator.json`-compiled output, not raw `src/domains/*.ts`
// -- see `discoverDomainOperations`'s `importDir` doc comment for why.
const DIST_DOMAINS_DIR = path.join(sdkRoot, "dist/domains");
const REGISTRY_OUTPUT_PATH = path.join(sdkRoot, "src/internal/registry/registry.generated.ts");
const OPERATIONS_OUTPUT_PATH = path.join(sdkRoot, "src/operations/index.ts");

// ---------------------------------------------------------------------------
// CLI corpus parsing
// ---------------------------------------------------------------------------

/**
 * `cli-reference-raw.txt` was extracted from a PDF whose "bold" headings were
 * rendered by doubling every character (including spaces): the printed
 * heading "Telnet Command: wan vlan" appears in the raw text as
 * "TTeellnneett  CCoommmmaanndd::  wwaann  vvllaann" — each character, including
 * spaces, is duplicated in place. Decoding is therefore just "keep every
 * even-indexed character".
 */
function decodeDoubledLetters(doubled: string): string {
  let decoded = "";

  for (let i = 0; i < doubled.length; i += 2) {
    decoded += doubled.charAt(i);
  }

  return decoded;
}

const HEADING_MARKER_DOUBLED = "TTeellnneett  CCoommmmaanndd::";

/**
 * Indentation trap (`ARCHITECTURE.md`, `BACKLOG.md` A2): 326 of the 327
 * headings start at column 0; the "wan vlan" heading (raw line 11191) is
 * indented by two spaces. A naive `^`-anchored regex against the doubled
 * marker undercounts to 326. This scans for the marker as a substring
 * anywhere on the line (via `String.includes`), so both indented and
 * column-0 headings are found identically — verified against the raw file:
 * exactly 327 lines contain the marker; exactly 1 of those 327 is indented.
 */
function findCliHeadingLines(rawLines: readonly string[]): readonly number[] {
  const headingLineNumbers: number[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i]?.includes(HEADING_MARKER_DOUBLED) === true) {
      headingLineNumbers.push(i + 1); // 1-based raw line number, matches the file on disk.
    }
  }

  return headingLineNumbers;
}

/** Finds the PDF page number in effect at a given raw-text line (`===PAGE N===` markers). */
function buildPageIndex(rawLines: readonly string[]): readonly (number | null)[] {
  const pageAtLine: (number | null)[] = [];
  let currentPage: number | null = null;

  for (const line of rawLines) {
    const match = /^===PAGE (\d+)===$/.exec(line.trim());

    if (match?.[1] !== undefined) {
      currentPage = Number(match[1]);
    }

    pageAtLine.push(currentPage);
  }

  return pageAtLine;
}

/**
 * Extracts the command title from a decoded heading line, e.g.
 * `"Telnet Command: wan vlan"` -> `"wan vlan"`.
 */
function extractCommandTitle(decodedLine: string): string {
  const marker = "Command:";
  const index = decodedLine.indexOf(marker);

  if (index === -1) {
    throw new Error(`Decoded CLI heading line missing "${marker}" marker: "${decodedLine}"`);
  }

  return decodedLine.slice(index + marker.length).trim();
}

/**
 * Many headings bundle multiple sibling variants behind a single documented
 * heading, e.g. `"swm enable / disable"`, `"wan mtu / mtu2"`,
 * `"apm enable/disable/show/clear/discover/query"`. The "family key" used
 * for classification lookups is the first variant, normalized to lowercase.
 */
function familyKey(title: string): string {
  const firstVariant = title.split("/")[0] ?? title;
  return firstVariant.trim().toLowerCase();
}

/** `commandPath`: the heading's words, dropping bare `/` separators from bundled headings. */
function commandPathFromTitle(title: string): readonly string[] {
  return title
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && token !== "/");
}

function slugifyCommandPath(commandPath: readonly string[]): string {
  return commandPath
    .map((token) => token.toLowerCase().replace(/[^a-z0-9]+/g, ""))
    .filter((token) => token.length > 0)
    .join(".");
}

// ---------------------------------------------------------------------------
// Classification: hand-maintained lookup table only, never inferred from the
// command string. Cross-references `command-map.md`'s two literally-named
// categorized table families:
//   - "Status & diagnostics (read-only, safe)"  -> classification: "read"
//   - the four "... (write — require confirm[+commit])" tables -> "write"
// Commands from every *other* command-map.md section (Objects & firewall,
// VPN, QoS/services/misc, Linux application, etc.) are intentionally left
// out of this table and stay "unknown"/"unclassified" — those sections are
// not literally one of the two table families this task scopes in.
// ---------------------------------------------------------------------------

/** Exact family-key matches from command-map.md's "Status & diagnostics (read-only, safe)" table. */
const READ_ONLY_FAMILIES: ReadonlySet<string> = new Set([
  "show status",
  "show lan",
  "show dmz",
  "show dns",
  "show openport",
  "show nat",
  "show portmap",
  "show pmtime",
  "show session",
  "show traffic",
  "show clienttraffic",
  "show statistic",
  "sys version",
  "sys cmdlog",
  "sys cc",
  "sys qrybuf",
  "sys health",
  "wan status",
  "ip ping",
  "ip tracert",
  "ip6 ping",
  "ip6 tracert",
]);

/**
 * Exact family-key matches from command-map.md's four "write — require
 * confirm[+commit]" tables (System / Management-access / WAN /
 * LAN-DHCP-NAT). Deliberately excludes `sys cfg status`, `sys cfg default`,
 * `mngt rmtcfg status`, `mngt rmtcfg enable`, `mngt rmtcfg disable` — those
 * commands live under the single `sys cfg` / `mngt rmtcfg` CLI headings that
 * the danger-list overlay (below) already claims in full; see this file's
 * "Danger list" comment for why the whole heading is excluded rather than
 * split at the subcommand level. `wan status` is intentionally omitted here
 * even though command-map.md's WAN table also lists it — the "Status &
 * diagnostics" table already classifies it "read", which takes precedence.
 */
const WRITE_FAMILIES: ReadonlySet<string> = new Set([
  // System (write — require confirm + commit)
  "sys passwd",
  "sys autoreboot",
  "sys commit",
  "sys name",
  "sys domainname",
  "sys tftpd",
  "sys syslog",
  "sys mailalert",
  "sys webhook",
  "sys tr069",
  "sys license",
  "sys alg",
  // Management / access (write — require confirm)
  "mngt sshport",
  "mngt telnetport",
  "mngt httpport",
  "mngt httpsport",
  "mngt ftpport",
  "mngt sslvpnport",
  "mngt accesslist",
  "mngt wanlogin",
  "mngt bfp",
  "mngt snmp",
  "mngt noping",
  "mngt echoicmp",
  "mngt defenseworm",
  "mngt telnettimeout",
  "mngt sshtimeout",
  // WAN (write — require confirm)
  "wan enable",
  "wan disable",
  "wan mtu",
  "wan ppp_mru",
  "wan dns",
  "wan detect",
  "wan detect_mtu",
  "wan detect_mtu6",
  "wan lb",
  "wan failover",
  "wan forward",
  "wan vlan",
  "wan mvlan",
  "wan budget",
  // LAN / DHCP / NAT (write — require confirm)
  "srv dhcp on",
  "srv dhcp off",
  "srv dhcp dns1",
  "srv dhcp dns2",
  "srv dhcp gateway",
  "srv dhcp startip",
  "srv dhcp leasetime",
  "srv dhcp status",
  "srv dhcp relay",
  "srv nat dmz",
  "srv nat openport",
  "srv nat portmap",
  "srv nat trigger",
  "ip addr",
  "ip nmask",
  "ip pubaddr",
  "ip lanalias",
  "ip arp",
  "ip dhcpc",
  "ip route",
  "ip session",
  "ip bindmac",
  "ip bandwidth",
  "vlan group",
  "vlan on",
  "vlan off",
  "vlan status",
  "vlan vid",
  "vlan subnet",
  "vlan tagged",
  "vlan sysvid",
]);

/**
 * command-map.md documents these two families with an explicit "..."
 * ellipsis (`mngt lanaccess ...`, `msubnet ...`) meaning "the whole family",
 * rather than enumerating variants — so a prefix match is the literal
 * source, not an inference.
 */
const WRITE_FAMILY_PREFIXES: readonly string[] = ["mngt lanaccess", "msubnet"];

/**
 * Sibling live-verified classification overlay (root audit, 2026-09-13,
 * `ARCHITECTURE.md`'s "Amendment 2026-09-13 (root audit, `sibling-live-verified`
 * classification basis added)"). Cross-references the sibling
 * `projects/vigor3912s-mcp` project's `src/commands/registry/families/*.ts` (217
 * commands / 42 families, **live-verified against the real router, fw
 * 4.4.7_RC2**), which is a stronger, per-command, device-verified evidence
 * source than `command-map.md`'s coarse per-family summary tables (the
 * source of `READ_ONLY_FAMILIES`/`WRITE_FAMILIES`/`WRITE_FAMILY_PREFIXES`
 * above). Every entry below is one of two kinds, produced by the audit:
 *
 *   - previously `"unknown"`/`"unclassified"` manifest entries that
 *     `vigor3912s-mcp` classifies consistently as one kind (`read` or
 *     `write`) — resolved here for the first time;
 *   - entries whose existing `command-map-family` classification actively
 *     *disagreed* with the live-verified kind (all corrected `write` ->
 *     `read`) — a correction, not an addition.
 *
 * Keyed by this SDK's own manifest `id` (not the sibling project's
 * `snake_case` tool ids — consulted for evidence only, never imported or
 * depended on at runtime; see the citation comment on each row). Takes
 * priority over `command-map-family`/danger-list/streaming-derived
 * classification for any id it covers (`buildCliEntriesForHeading` below
 * applies it as a final overlay onto `classifyCliCommand`'s result), since it
 * is device-verified rather than inferred from a documentation summary
 * table. It only ever overrides the `classification`/`classificationBasis`
 * fields — never `status`/`blockedReason` (e.g. `cli.log` stays
 * `status: "blocked-by-documentation"` for its documented streaming/tail
 * sub-form even though its overall family is now known to be read-shaped;
 * `classification` and `status` are independent axes per the existing
 * "destructive is classification, not exclusion" precedent).
 */
const SIBLING_LIVE_VERIFIED_CLASSIFICATION: Readonly<Record<string, "read" | "write">> = {
  "cli.csm.appe.set": "write", // vigor3912s-mcp: csm_appe_set, live-verified fw 4.4.7_RC2
  "cli.csm.appe.show": "read", // vigor3912s-mcp: csm_appe_show, live-verified fw 4.4.7_RC2
  "cli.csm.ucf": "write", // vigor3912s-mcp: csm_ucf, live-verified fw 4.4.7_RC2
  "cli.csm.ucf.obj.index.uac": "write", // vigor3912s-mcp: csm_ucf, live-verified fw 4.4.7_RC2
  "cli.csm.ucf.obj.index.eac": "write", // vigor3912s-mcp: csm_ucf, live-verified fw 4.4.7_RC2
  "cli.csm.ucf.obj.index.wf": "write", // vigor3912s-mcp: csm_ucf, live-verified fw 4.4.7_RC2
  "cli.csm.wcf": "write", // vigor3912s-mcp: csm_wcf, live-verified fw 4.4.7_RC2
  "cli.csm.dnsf": "write", // vigor3912s-mcp: csm_dnsf, live-verified fw 4.4.7_RC2
  "cli.ddns.enable": "write", // vigor3912s-mcp: ddns_enable, live-verified fw 4.4.7_RC2
  "cli.ddns.log": "read", // vigor3912s-mcp: ddns_log, live-verified fw 4.4.7_RC2
  "cli.ddns.forceupdate": "write", // vigor3912s-mcp: ddns_forceupdate, live-verified fw 4.4.7_RC2
  "cli.ddns.show": "read", // vigor3912s-mcp: ddns_show, live-verified fw 4.4.7_RC2
  "cli.ip.landnsres": "read", // vigor3912s-mcp: ip_lanDNSRes, live-verified fw 4.4.7_RC2
  "cli.ip.dnsforward": "read", // vigor3912s-mcp: ip_dnsforward, live-verified fw 4.4.7_RC2
  "cli.ip6.addr": "write", // vigor3912s-mcp: ip6_addr, live-verified fw 4.4.7_RC2
  "cli.ip6.mngt": "write", // vigor3912s-mcp: ip6_mngt, live-verified fw 4.4.7_RC2
  "cli.ipf.view": "read", // vigor3912s-mcp: ipf_view, live-verified fw 4.4.7_RC2
  "cli.ipf.set": "write", // vigor3912s-mcp: ipf_set, live-verified fw 4.4.7_RC2
  "cli.ipf.rule": "write", // vigor3912s-mcp: ipf_rule, live-verified fw 4.4.7_RC2
  "cli.ldap.user": "write", // vigor3912s-mcp: ldap_user, live-verified fw 4.4.7_RC2
  "cli.ldap.set": "write", // vigor3912s-mcp: ldap_set, live-verified fw 4.4.7_RC2
  "cli.ldap.view": "read", // vigor3912s-mcp: ldap_view, live-verified fw 4.4.7_RC2
  "cli.tacacsplus.set": "write", // vigor3912s-mcp: tacacsplus_set, live-verified fw 4.4.7_RC2
  "cli.tacacsplus.view": "read", // vigor3912s-mcp: tacacsplus_view, live-verified fw 4.4.7_RC2
  "cli.object.ip.obj": "read", // vigor3912s-mcp: object_ip_view, live-verified fw 4.4.7_RC2
  "cli.object.service.obj": "read", // vigor3912s-mcp: object_service_view, live-verified fw 4.4.7_RC2
  "cli.qos.setup": "write", // vigor3912s-mcp: qos_setup, live-verified fw 4.4.7_RC2
  "cli.qos.class": "write", // vigor3912s-mcp: qos_class, live-verified fw 4.4.7_RC2
  "cli.switch.status": "read", // vigor3912s-mcp: switch_status, live-verified fw 4.4.7_RC2
  "cli.switch.on": "write", // vigor3912s-mcp: switch_on, live-verified fw 4.4.7_RC2
  "cli.switch.off": "write", // vigor3912s-mcp: switch_off, live-verified fw 4.4.7_RC2
  "cli.switch.list": "read", // vigor3912s-mcp: switch_list, live-verified fw 4.4.7_RC2
  "cli.switch.query": "read", // vigor3912s-mcp: switch_query, live-verified fw 4.4.7_RC2
  // The next 6 entries reconcile a genuine tension flagged by review: the
  // vendor PDF (v4.3.5.1) only documents a SET syntax for `sys pollbuf
  // on|off`, `sys max_session <300K/500K/1000K>`, and (for `sys time`) a
  // set-time form -- no bare/no-arg query form is spelled out in the PDF text
  // for any of the 6 below. `vigor3912s-mcp`'s registry classifies all 6 as
  // `R()` (read) using the exact bare command with zero arguments, and its
  // README states its 108 `R()` entries were "all verified against the real
  // router" (fw 4.4.7_RC2) -- i.e. this is a live-observed behavior, not a
  // guess. This is a well-known DrayOS CLI convention also visible elsewhere
  // in this same manifest (e.g. many `sys`/`show` commands: bare invocation
  // displays current state, an argument changes it) -- the PDF documents only
  // the "how to configure" form and omits the inspection form as too obvious
  // to state. Accepted as `sibling-live-verified` read evidence. All 6 are
  // now implemented as `TypedOperation`s in `src/domains/sys.ts` (Wave 4
  // completion push, 2026-09-13); only `cli.sys.admin` remains genuinely
  // deferred (see `src/domains/sys.ts`'s `deferredUnknownSysIds`).
  "cli.sys.pollbuf": "read", // vigor3912s-mcp: sys_pollbuf, live-verified fw 4.4.7_RC2 (bare-invocation query; PDF only documents on|off set form)
  "cli.sys.frlog": "read", // vigor3912s-mcp: sys_fr_log, live-verified fw 4.4.7_RC2
  "cli.sys.dnscachetbl": "read", // vigor3912s-mcp: sys_dnsCacheTbl, live-verified fw 4.4.7_RC2
  "cli.sys.time": "read", // vigor3912s-mcp: sys_time, live-verified fw 4.4.7_RC2 (bare-invocation query; PDF only documents a set-time form)
  "cli.sys.dashboard": "read", // vigor3912s-mcp: sys_dashboard, live-verified fw 4.4.7_RC2
  "cli.sys.maxsession": "read", // vigor3912s-mcp: sys_max_session, live-verified fw 4.4.7_RC2 (bare-invocation query; PDF only documents the <300K/500K/1000K> set form)
  "cli.testmail": "write", // vigor3912s-mcp: testmail_send, live-verified fw 4.4.7_RC2
  "cli.upnp.off": "write", // vigor3912s-mcp: upnp_off, live-verified fw 4.4.7_RC2
  "cli.upnp.on": "write", // vigor3912s-mcp: upnp_on, live-verified fw 4.4.7_RC2
  "cli.upnp.nat": "read", // vigor3912s-mcp: upnp_nat, live-verified fw 4.4.7_RC2
  "cli.usb.devstat": "read", // vigor3912s-mcp: usb_devstat, live-verified fw 4.4.7_RC2
  "cli.usb.temp": "read", // vigor3912s-mcp: usb_temp, live-verified fw 4.4.7_RC2
  "cli.vigbrg.set": "write", // vigor3912s-mcp: vigbrg_set, live-verified fw 4.4.7_RC2
  "cli.vigbrg.status": "read", // vigor3912s-mcp: vigbrg_status, live-verified fw 4.4.7_RC2
  "cli.vigbrg.wanstatus": "read", // vigor3912s-mcp: vigbrg_wanstatus, live-verified fw 4.4.7_RC2
  "cli.vigbrg.wlanstatus": "read", // vigor3912s-mcp: vigbrg_wlanstatus, live-verified fw 4.4.7_RC2
  "cli.vpn.setup": "write", // vigor3912s-mcp: vpn_setup, live-verified fw 4.4.7_RC2
  "cli.vpn.list": "read", // vigor3912s-mcp: vpn_list, live-verified fw 4.4.7_RC2
  "cli.vpn.remote": "read", // vigor3912s-mcp: vpn_remote, live-verified fw 4.4.7_RC2
  "cli.vpn.ovpn": "write", // vigor3912s-mcp: vpn_ovpn, live-verified fw 4.4.7_RC2
  "cli.vpn.dialout": "write", // vigor3912s-mcp: vpn_dial_out, live-verified fw 4.4.7_RC2
  "cli.hsportal.setup": "write", // vigor3912s-mcp: hsportal_setup, live-verified fw 4.4.7_RC2
  "cli.hsportal.info": "read", // vigor3912s-mcp: hsportal_info, live-verified fw 4.4.7_RC2
  "cli.hsportal.level": "read", // vigor3912s-mcp: hsportal_level, live-verified fw 4.4.7_RC2
  "cli.local8021x": "read", // vigor3912s-mcp: local8021x_show, local8021x_show_local_cer, live-verified fw 4.4.7_RC2
  "cli.wol": "write", // vigor3912s-mcp: wol_send, live-verified fw 4.4.7_RC2
  "cli.user": "write", // vigor3912s-mcp: user_account, user_edit, user_set, user_setdefault, live-verified fw 4.4.7_RC2
  "cli.nand.bad.nand.usage": "read", // vigor3912s-mcp: nand_bad, live-verified fw 4.4.7_RC2
  "cli.apm.stanum": "read", // vigor3912s-mcp: apm_stanum, live-verified fw 4.4.7_RC2
  "cli.ha.set": "write", // vigor3912s-mcp: ha_set, live-verified fw 4.4.7_RC2
  "cli.ha.show": "read", // vigor3912s-mcp: ha_show, live-verified fw 4.4.7_RC2
  "cli.ha.status": "read", // vigor3912s-mcp: ha_status, live-verified fw 4.4.7_RC2
  "cli.swm.show": "read", // vigor3912s-mcp: swm_show, live-verified fw 4.4.7_RC2
  "cli.swm.get": "read", // vigor3912s-mcp: swm_get, live-verified fw 4.4.7_RC2
  "cli.swm.post": "write", // vigor3912s-mcp: swm_post, live-verified fw 4.4.7_RC2
  "cli.swm.enable.disable": "write", // vigor3912s-mcp: swm_enable, live-verified fw 4.4.7_RC2
  "cli.swm.group": "write", // vigor3912s-mcp: swm_group, live-verified fw 4.4.7_RC2
  "cli.swm.profile": "write", // vigor3912s-mcp: swm_profile, live-verified fw 4.4.7_RC2
  "cli.swm.detail": "write", // vigor3912s-mcp: swm_detail, live-verified fw 4.4.7_RC2
  "cli.swm.maintain": "write", // vigor3912s-mcp: swm_maintain, live-verified fw 4.4.7_RC2
  "cli.swm.search": "write", // vigor3912s-mcp: swm_search, live-verified fw 4.4.7_RC2
  "cli.swm.db": "write", // vigor3912s-mcp: swm_db, live-verified fw 4.4.7_RC2
  "cli.swm.alert": "write", // vigor3912s-mcp: swm_alert, live-verified fw 4.4.7_RC2
  "cli.swm.log": "write", // vigor3912s-mcp: swm_log, live-verified fw 4.4.7_RC2
  "cli.swm.snmp": "write", // vigor3912s-mcp: swm_snmp, live-verified fw 4.4.7_RC2
  "cli.service": "read", // vigor3912s-mcp: service_show, service_get, live-verified fw 4.4.7_RC2
  "cli.ip.arp": "read", // vigor3912s-mcp: ip_arp_status, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.ip.route": "read", // vigor3912s-mcp: ip_route_status, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.ip.session": "read", // vigor3912s-mcp: ip_session, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.msubnet.status": "read", // vigor3912s-mcp: msubnet_status, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.srv.dhcp.status": "read", // vigor3912s-mcp: dhcp_status, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.vlan.status": "read", // vigor3912s-mcp: vlan_status, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.wan.detect": "read", // vigor3912s-mcp: wan_detect, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.wan.detectmtu": "read", // vigor3912s-mcp: wan_detect_mtu, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.wan.detectmtu6": "read", // vigor3912s-mcp: wan_detect_mtu6, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
};

/**
 * `operations.md` "Danger list (never run)": `sys cfg default`, `sys
 * reboot`, `mngt rmtcfg enable`, `linux clean -w`/`-o`.
 *
 * Amended 2026-09-13 (`ARCHITECTURE.md` amendment note + updated Item 1):
 * the SDK does not exclude anything from the manifest — `"destructive"` is
 * accurate classification metadata only, same status shape
 * (`status: "documented"`) as any other command. Of the four danger-list
 * commands, only `sys reboot` has a CLI heading dedicated to exactly that
 * command, so it is classified in place via this set. The other three share
 * a heading with non-dangerous siblings (`sys cfg` also documents `sys cfg
 * status`; `mngt rmtcfg` also documents `status`/`disable`/per-protocol
 * variants; `linux` also documents `status`/`service ssh
 * .../setlinuxip`/etc.) — those three headings are handled by
 * `SPLIT_FAMILIES` below instead, which emits one entry per real documented
 * command (each citing the same shared heading) so the destructive
 * subcommand gets its own accurate classification without over- or
 * under-classifying its siblings.
 */
const DANGER_LIST_FAMILIES: ReadonlySet<string> = new Set(["sys reboot"]);

/**
 * Per-heading command splits (`ARCHITECTURE.md` amendment 2026-09-13 +
 * updated Item 1): these three CLI headings each document several distinct
 * real commands (piped/grouped syntax, or multiple named subcommands)
 * spanning more than one safety classification — a single manifest entry
 * per heading would either over-classify safe siblings as destructive or
 * hide a destructive subcommand behind a benign heading. Every split
 * sub-command below still cites the same shared heading's `rawLine`/
 * `pdfPage` (they come from the same documented source), gets its own `id`/
 * `command`/`commandPath`, and its own classification.
 *
 * Evidence: `command-map.md`'s "System"/"Management / access"/"Linux
 * application" tables (rows cited per split below) and, where a sub-command
 * is also live-verified there, `vigor3912s-mcp`'s
 * `src/commands/registry/families/*.ts` (217 real DrayOS commands / 42 families /
 * fw 4.4.7_RC2) as an independent cross-check — consulted for evidence only,
 * never imported or depended on at runtime; ids/naming here are this SDK's
 * own `cli.<path>.<segments>` scheme, not a copy of the sibling project's
 * `snake_case` tool ids.
 *
 * Further PDF-documented splits (Parameter Description / Syntax Description
 * in `cli-reference-raw.txt`, amendment 2026-09-13 follow-up) are appended
 * below for mixed read/write headings that were still `unknown` after the
 * command-map and sibling overlays — including `linux service telnet` and
 * `linux ring`, whose Part VIII syntax enumerates the same piped variants as
 * the ssh/syslog rows (`enable|disable|status|setport` / `set|send|clean|
 * test|debug`).
 */
interface SplitSubCommand {
  readonly commandPath: readonly string[];
  readonly command: string;
  readonly classification: Classification;
  readonly classificationBasis: ClassificationBasis;
  /**
   * Optional explicit id when `slugifyCommandPath` would collide (Part VIII
   * `log -f` vs `log -F` both slugify to `cli.log.f` because the helper
   * lowercases). Prefer omitting this and using distinct path segments when
   * possible (see `radius external` view / view-profile).
   */
  readonly id?: string;
}

const SPLIT_FAMILIES: ReadonlyMap<string, readonly SplitSubCommand[]> = new Map([
  [
    "sys cfg",
    [
      // command-map.md line 58: "Show profile version + status (state marker)" —
      // a query with no confirm/commit, classified from its own documented
      // syntax rather than the two named table families.
      {
        commandPath: ["sys", "cfg", "status"],
        command: "sys cfg status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // command-map.md line 59 + operations.md danger list: factory reset.
      {
        commandPath: ["sys", "cfg", "default"],
        command: "sys cfg default",
        classification: "destructive",
        classificationBasis: "operations-danger-list",
      },
    ],
  ],
  [
    "mngt rmtcfg",
    [
      // command-map.md line 71: "Show remote-config status" — a query, same
      // basis reasoning as `sys cfg status` above.
      {
        commandPath: ["mngt", "rmtcfg", "status"],
        command: "mngt rmtcfg status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // command-map.md line 72 + operations.md danger list: "exposes
      // management to the Internet".
      {
        commandPath: ["mngt", "rmtcfg", "enable"],
        command: "mngt rmtcfg enable",
        classification: "destructive",
        classificationBasis: "operations-danger-list",
      },
      // command-map.md line 72: the safe opposite direction of `enable`;
      // documented in the same "Management / access (write)" table.
      {
        commandPath: ["mngt", "rmtcfg", "disable"],
        command: "mngt rmtcfg disable",
        classification: "write",
        classificationBasis: "command-map-family",
      },
      // command-map.md line 73: `mngt rmtcfg <proto> on|off` for
      // http/https/ftp/telnet/ssh/tr069/snmp/enforce_https — one templated
      // command (a placeholder + boolean, like `wan enable WAN<n>`), not
      // exploded per protocol.
      {
        commandPath: ["mngt", "rmtcfg", "protocol"],
        command: "mngt rmtcfg <protocol> on|off",
        classification: "write",
        classificationBasis: "command-map-family",
      },
    ],
  ],
  [
    "linux",
    [
      // command-map.md line 150; vigor3912s-mcp registry.ts:292 `linux_status` (R).
      {
        commandPath: ["linux", "status"],
        command: "linux status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // command-map.md line 149; vigor3912s-mcp registry.ts:296 `linux_setlinuxip` (W).
      {
        commandPath: ["linux", "setlinuxip"],
        command: "linux setlinuxip",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // command-map.md line 151 piped list; vigor3912s-mcp registry.ts:293-295
      // `linux_ssh_enable`/`linux_ssh_disable`/`linux_ssh_port` (W); `status`
      // has no dedicated mcp tool but is the same read/status pattern as
      // `linux status` above.
      {
        commandPath: ["linux", "service", "ssh", "enable"],
        command: "linux service ssh enable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "service", "ssh", "disable"],
        command: "linux service ssh disable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "service", "ssh", "status"],
        command: "linux service ssh status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "service", "ssh", "setport"],
        command: "linux service ssh setport",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // Part VIII Syntax: "linux service <telnet/ssh> <enable/disable/status/setport>"
      // — same piped list as ssh, applied to telnet.
      {
        commandPath: ["linux", "service", "telnet", "enable"],
        command: "linux service telnet enable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "service", "telnet", "disable"],
        command: "linux service telnet disable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "service", "telnet", "status"],
        command: "linux service telnet status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "service", "telnet", "setport"],
        command: "linux service telnet setport",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // command-map.md line 153 piped list: "linux syslog enable|disable|status".
      {
        commandPath: ["linux", "syslog", "enable"],
        command: "linux syslog enable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "syslog", "disable"],
        command: "linux syslog disable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "syslog", "status"],
        command: "linux syslog status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // command-map.md line 154: "linux clean -a/-b/-d/-o/-w"; only -w/-o are
      // operations.md danger-listed ("wipes Linux apps / reboots"). -a/-b/-d
      // are still mutating cleanup actions on the same command, classified
      // "write" from their own documented syntax, not the danger list.
      {
        commandPath: ["linux", "clean", "-a"],
        command: "linux clean -a",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "clean", "-b"],
        command: "linux clean -b",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "clean", "-d"],
        command: "linux clean -d",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "clean", "-o"],
        command: "linux clean -o",
        classification: "destructive",
        classificationBasis: "operations-danger-list",
      },
      {
        commandPath: ["linux", "clean", "-w"],
        command: "linux clean -w",
        classification: "destructive",
        classificationBasis: "operations-danger-list",
      },
      // Part VIII Syntax: "linux ring <set/send/clean/test/debug>".
      {
        commandPath: ["linux", "ring", "set"],
        command: "linux ring set",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "ring", "send"],
        command: "linux ring send",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "ring", "clean"],
        command: "linux ring clean",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "ring", "test"],
        command: "linux ring test",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["linux", "ring", "debug"],
        command: "linux ring debug",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "dos",
    [
      // Part VIII Parameter Description: -V view; -A/-D activate/deactivate; -P/-B show list; remaining flags configure DoS defense.
      {
        commandPath: ["dos", "-V"],
        command: "dos -V",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["dos", "-A"],
        command: "dos -A",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["dos", "-D"],
        command: "dos -D",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["dos", "-P", "show"],
        command: "dos -P show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["dos", "-B", "show"],
        command: "dos -B show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["dos"],
        command: "dos",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "internet",
    [
      // Part VIII: -V View Internet Access profile; -W/-M/... configure WAN connection.
      {
        commandPath: ["internet", "-V"],
        command: "internet -V",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["internet"],
        command: "internet",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "port",
    [
      // Part VIII: port status / sniff status / 802.1x status are display; speed/sniff/802.1x mutate forms configure.
      {
        commandPath: ["port", "status"],
        command: "port status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["port", "sniff", "status"],
        command: "port sniff status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["port", "sniff"],
        command: "port sniff",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["port", "802.1x", "status"],
        command: "port 802.1x status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["port", "802.1x", "enable"],
        command: "port 802.1x enable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["port", "802.1x", "disable"],
        command: "port 802.1x disable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["port", "802.1x", "addport"],
        command: "port 802.1x addport",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["port", "802.1x", "delport"],
        command: "port 802.1x delport",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["port"],
        command: "port",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "portmaptime",
    [
      // Part VIII: -l List all settings; -f flush portmaps; -t/-u/-i/-w/-s set session timeouts.
      {
        commandPath: ["portmaptime", "-l"],
        command: "portmaptime -l",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["portmaptime", "-f"],
        command: "portmaptime -f",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["portmaptime"],
        command: "portmaptime",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "radius internal",
    [
      // Part VIII Syntax: radius show displays status; remaining named subcommands configure internal RADIUS.
      {
        commandPath: ["radius", "show"],
        command: "radius show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["radius", "enable"],
        command: "radius enable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["radius", "authport"],
        command: "radius authport",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["radius", "set_auth_method"],
        command: "radius set_auth_method",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["radius", "client", "add"],
        command: "radius client add",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["radius", "client", "del"],
        command: "radius client del",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["radius", "enable_dot1x"],
        command: "radius enable_dot1x",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["radius", "set_dot1x_method"],
        command: "radius set_dot1x_method",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "radius external",
    [
      // Part VIII: -V/-v/-l show settings/log; remaining options configure external RADIUS profiles.
      // Path segments are semantic so slugify keeps -V vs -v distinct
      // (both would otherwise collapse to "cli.radius.external.v").
      {
        commandPath: ["radius", "external", "view"],
        command: "radius external -V",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["radius", "external", "view-profile"],
        command: "radius external -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["radius", "external", "log"],
        command: "radius external -l",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["radius", "external"],
        command: "radius external",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "appqos",
    [
      // Part VIII Parameter Description: view/-v display; enable/-e/-d configure APP QoS.
      {
        commandPath: ["appqos", "view"],
        command: "appqos view",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["appqos", "enable"],
        command: "appqos enable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["appqos", "traceable", "-v"],
        command: "appqos traceable -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["appqos", "traceable", "-e"],
        command: "appqos traceable -e",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["appqos", "traceable", "-d"],
        command: "appqos traceable -d",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["appqos", "untraceable", "-v"],
        command: "appqos untraceable -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["appqos", "untraceable", "-e"],
        command: "appqos untraceable -e",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["appqos", "untraceable", "-d"],
        command: "appqos untraceable -d",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "apm enable",
    [
      // Part VIII piped heading: enable/disable/clear mutate; show/discover/query display/search.
      {
        commandPath: ["apm", "enable"],
        command: "apm enable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "disable"],
        command: "apm disable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "show"],
        command: "apm show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "clear"],
        command: "apm clear",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "discover"],
        command: "apm discover",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "query"],
        command: "apm query",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "apm profile",
    [
      // Part VIII: summary/show display profiles; clone/del/reset/apply mutate.
      {
        commandPath: ["apm", "profile", "summary"],
        command: "apm profile summary",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "profile", "show"],
        command: "apm profile show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "profile", "clone"],
        command: "apm profile clone",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "profile", "del"],
        command: "apm profile del",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "profile", "reset"],
        command: "apm profile reset",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "profile", "apply"],
        command: "apm profile apply",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "apm cache",
    [
      // Part VIII: show displays registered AP cache; clear removes it.
      {
        commandPath: ["apm", "cache", "show"],
        command: "apm cache show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "cache", "clear"],
        command: "apm cache clear",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "apm lbcfg",
    [
      // Part VIII: show displays load-balance config; set writes it.
      {
        commandPath: ["apm", "lbcfg", "show"],
        command: "apm lbcfg show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["apm", "lbcfg", "set"],
        command: "apm lbcfg set",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "ip igmp_proxy",
    [
      // Part VIII: status displays; set/reset/wan/query/ppp/version/syslog configure IGMP proxy.
      {
        commandPath: ["ip", "igmp_proxy", "status"],
        command: "ip igmp_proxy status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_proxy", "set"],
        command: "ip igmp_proxy set",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_proxy", "reset"],
        command: "ip igmp_proxy reset",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_proxy", "wan"],
        command: "ip igmp_proxy wan",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_proxy", "query"],
        command: "ip igmp_proxy query",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_proxy", "ppp"],
        command: "ip igmp_proxy ppp",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_proxy", "version"],
        command: "ip igmp_proxy version",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_proxy", "syslog"],
        command: "ip igmp_proxy syslog",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "ip igmp_snoop",
    [
      // Part VIII: status/table display; remaining named subcommands configure IGMP snoop.
      {
        commandPath: ["ip", "igmp_snoop", "status"],
        command: "ip igmp_snoop status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_snoop", "table"],
        command: "ip igmp_snoop table",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_snoop", "enable"],
        command: "ip igmp_snoop enable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_snoop", "disable"],
        command: "ip igmp_snoop disable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_snoop", "txquery"],
        command: "ip igmp_snoop txquery",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_snoop", "mode"],
        command: "ip igmp_snoop mode",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_snoop", "chkleave"],
        command: "ip igmp_snoop chkleave",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_snoop", "separate"],
        command: "ip igmp_snoop separate",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_snoop", "portchk"],
        command: "ip igmp_snoop portchk",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "igmp_snoop", "acceptlist"],
        command: "ip igmp_snoop acceptlist",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "ip dataflowmonitor",
    [
      // Part VIII: status/show display; on/off enable/disable Data Flow Monitor.
      {
        commandPath: ["ip", "dataflowmonitor", "status"],
        command: "ip dataflowmonitor status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "dataflowmonitor", "on"],
        command: "ip dataflowmonitor on",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "dataflowmonitor", "off"],
        command: "ip dataflowmonitor off",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "ip bgp",
    [
      // Part VIII: show / neighbor show / static show display; remaining BGP forms configure.
      {
        commandPath: ["ip", "bgp", "show"],
        command: "ip bgp show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "bgp", "neighbor", "show"],
        command: "ip bgp neighbor show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "bgp", "static", "show"],
        command: "ip bgp static show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "bgp"],
        command: "ip bgp",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "ip ospf",
    [
      // Part VIII: status/cfg show/nbr display; en/dis/cfg set configure OSPF.
      {
        commandPath: ["ip", "ospf", "status"],
        command: "ip ospf status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "ospf", "cfg", "show"],
        command: "ip ospf cfg show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "ospf", "nbr"],
        command: "ip ospf nbr",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "ospf", "en"],
        command: "ip ospf en",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "ospf", "dis"],
        command: "ip ospf dis",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip", "ospf", "cfg", "set"],
        command: "ip ospf cfg set",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "ipf flowtrack",
    [
      // Part VIII Syntax: flowtrack view displays sessions; flowtrack set mutates tracking.
      {
        commandPath: ["ipf", "flowtrack", "view"],
        command: "ipf flowtrack view",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ipf", "flowtrack", "set"],
        command: "ipf flowtrack set",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "ip6 neigh",
    [
      // Part VIII: -a show neighbour status; -s add; -d delete.
      {
        commandPath: ["ip6", "neigh", "-a"],
        command: "ip6 neigh -a",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip6", "neigh", "-s"],
        command: "ip6 neigh -s",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip6", "neigh", "-d"],
        command: "ip6 neigh -d",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "ip6 ntp",
    [
      // Part VIII: -v displays NTP settings; -p configures them.
      {
        commandPath: ["ip6", "ntp", "-v"],
        command: "ip6 ntp -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["ip6", "ntp", "-p"],
        command: "ip6 ntp -p",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "srv dhcp public",
    [
      // Part VIII: status displays; start/cnt configure second-subnet DHCP.
      {
        commandPath: ["srv", "dhcp", "public", "status"],
        command: "srv dhcp public status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["srv", "dhcp", "public", "start"],
        command: "srv dhcp public start",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["srv", "dhcp", "public", "cnt"],
        command: "srv dhcp public cnt",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "usb user",
    [
      // Part VIII: list displays profiles; rm/enable/disable mutate FTP/SMB users.
      {
        commandPath: ["usb", "user", "list"],
        command: "usb user list",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["usb", "user", "rm"],
        command: "usb user rm",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["usb", "user", "enable"],
        command: "usb user enable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["usb", "user", "disable"],
        command: "usb user disable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "vlan submode",
    [
      // Part VIII Syntax: status displays; on/off switch encapsulation mode.
      {
        commandPath: ["vlan", "submode", "status"],
        command: "vlan submode status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vlan", "submode", "on"],
        command: "vlan submode on",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vlan", "submode", "off"],
        command: "vlan submode off",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "vpn mroute",
    [
      // Part VIII: list displays static routes; add/del(/msa) mutate them.
      {
        commandPath: ["vpn", "mroute", "list"],
        command: "vpn mroute list",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vpn", "mroute", "add"],
        command: "vpn mroute add",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vpn", "mroute", "del"],
        command: "vpn mroute del",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vpn", "mroute", "addmsa"],
        command: "vpn mroute addmsa",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vpn", "mroute", "delmsa"],
        command: "vpn mroute delmsa",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "vpn mss",
    [
      // Part VIII: show displays MSS; default/set configure it.
      {
        commandPath: ["vpn", "mss", "show"],
        command: "vpn mss show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vpn", "mss", "default"],
        command: "vpn mss default",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vpn", "mss", "set"],
        command: "vpn mss set",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "vpn fromlan",
    [
      // Part VIII: status displays; enable/disable/add/remove configure from-LAN access.
      {
        commandPath: ["vpn", "fromlan", "status"],
        command: "vpn fromlan status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vpn", "fromlan", "enable"],
        command: "vpn fromlan enable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vpn", "fromlan", "disable"],
        command: "vpn fromlan disable",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vpn", "fromlan", "add"],
        command: "vpn fromlan add",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["vpn", "fromlan", "remove"],
        command: "vpn fromlan remove",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "wan lbel",
    [
      // Part VIII: status displays exception profiles; remaining form configures them.
      {
        commandPath: ["wan", "lbel", "status"],
        command: "wan lbel status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["wan", "lbel"],
        command: "wan lbel",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "wan multifno",
    [
      // Part VIII: status displays bridge channels; remaining form configures uplink.
      {
        commandPath: ["wan", "multifno", "status"],
        command: "wan multifno status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["wan", "multifno"],
        command: "wan multifno",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    // Part VIII Syntax: `log [-cfhiptwx?] [-F a|c|f|w]` — all bounded single-exchange
    // forms. `operations.md`'s `log -wt` note is Web-Console-only and is not a
    // Part VIII documented flag under this heading, so the heading is split
    // rather than blocked wholesale.
    //
    // Note: the syntax bracket also names `-i`, but the immediately-following
    // Syntax Description's Parameter Description list (rawLine ~3990-4000)
    // never describes `-i` at all -- unlike every other listed flag. This
    // mirrors the `hsportal pin_gen` / `ipf flowtest` / `sys admin` pattern
    // (named heading, no Parameter Description) that elsewhere earns a
    // `blocked-by-documentation` entry via `DOCUMENTATION_BLOCKED_FAMILIES` --
    // but `SplitSubCommand` (used here because the `log` heading covers
    // several real, distinct commands) has no blocked-status variant, only
    // `classification`. Rather than inventing an unevidenced read/write guess
    // for `-i`, it is deliberately left unrepresented in the manifest: no
    // `cli.log.i` entry exists (neither implemented nor blocked). If a future
    // pass wants this gap formally recorded, extend `SplitSubCommand` with an
    // optional blocked variant rather than guessing a classification.
    "log",
    [
      {
        commandPath: ["log", "-c"],
        command: "log -c",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["log", "-f"],
        command: "log -f",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["log", "-t"],
        command: "log -t",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["log", "-w"],
        command: "log -w",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["log", "-p"],
        command: "log -p",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["log", "-x"],
        command: "log -x",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        commandPath: ["log", "-h"],
        command: "log -h",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      {
        // Explicit id: slugify lowercases `-F` to the same `cli.log.f` as `-f`.
        id: "cli.log.F",
        commandPath: ["log", "-F"],
        command: "log -F",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
]);

/**
 * Reserved for headings that are *only* continuous watch/tail with no
 * bounded single-exchange form in Part VIII. The `log` heading was previously
 * blocked wholesale citing `log -wt`, but Part VIII only documents bounded
 * flags (`log [-cfhiptwx?] [-F ...]`) — those are split in `SPLIT_FAMILIES`
 * instead. Keep this set for future true streaming-only headings.
 */
const STREAMING_FAMILIES: ReadonlySet<string> = new Set([]);

/**
 * Session-logout meta-commands (`ARCHITECTURE.md` amendment: exit/quit are not
 * SDK device operations). Same blocked-status pattern as streaming blocks,
 * with an explicit session-meta reason.
 */
const SESSION_META_FAMILIES: ReadonlyMap<string, string> = new Map([
  [
    "exit",
    "Session-logout meta-command (leaves the telnet/SSH CLI session); not an SDK device operation.",
  ],
  [
    "quit",
    "Session-logout meta-command (exits the telnet command screen); not an SDK device operation.",
  ],
]);

/**
 * Headings whose Part VIII text cannot support a safe, implementable
 * classification: no Parameter/Syntax Description, RD-only/test-mode prose,
 * or explicitly "for future use". Prefer `blocked-by-documentation` over
 * leaving `unknown` when the heading is not implementable from the corpus.
 */
const DOCUMENTATION_BLOCKED_FAMILIES: ReadonlyMap<string, string> = new Map([
  [
    "hsportal pin_gen",
    'Part VIII documents only "This command is for future use" with no Syntax/Parameter Description.',
  ],
  [
    "ipf flowtest",
    "Part VIII names an RD firewall-diagnose debug command with no Syntax/Parameter Description.",
  ],
  [
    "sys admin",
    "Part VIII documents RD engineer test-mode access with no Syntax/Parameter Description.",
  ],
  [
    "ip telnet",
    "Opens a nested interactive telnet session to another device; does not fit the bounded single-exchange execution model (ARCHITECTURE.md Item 3).",
  ],
]);

/**
 * Per-manifest-id classification from Part VIII Syntax / Parameter Description
 * (basis `documented-syntax`). Applied as an overlay like
 * `SIBLING_LIVE_VERIFIED_CLASSIFICATION` for headings that stay one entry
 * (not split). Never inferred from the command name alone — each id was
 * checked against `cli-reference-raw.txt` at its citation `rawLine`.
 */
const DOCUMENTATION_SYNTAX_CLASSIFICATION: Readonly<Record<string, "read" | "write">> = {
  // read — Parameter Description / intro documents display/view/status only
  "cli.csm.appe.config": "read", // display IM/P2P/Protocol configuration status
  "cli.ip6.tspc": "read", // display TSPC status
  "cli.ip6.online": "read", // check IPv6 LAN/WAN online status
  "cli.srv.nat.status": "read", // view NAT Port Redirection Running Table
  "cli.srv.nat.showall": "read", // view NAT redirection/openport/DMZ summary
  "cli.sys.iface": "read", // display interface UP/DOWN + addressing
  "cli.upnp.service": "read", // display UPnP service table
  "cli.upnp.subscribe": "read", // show UPnP subscriptions
  "cli.upnp.tmpvs": "read", // display temp Virtual Server status
  "cli.vpn.ike": "read", // display IKE memory status and leakage list
  "cli.apm.syslog": "read", // display central AP management syslog
  "cli.apm.apsyslog": "read", // display AP syslog data from VigorAP
  "cli.switch.i": "read", // obtain TX/RX data for connected switches
  // write — Parameter Description documents configure/set/enable/disable/mutate
  "cli.csm.appe.prof": "write",
  "cli.ddns.set": "write",
  "cli.ddns.time": "write",
  "cli.ddns.setdefault": "write",
  "cli.ip.pubsubnet": "write",
  "cli.ip.pubmask": "write",
  "cli.ip.rip": "write",
  "cli.ip.wanrip": "write",
  "cli.ip.maxnatuser": "write",
  "cli.ip.policyrt": "write",
  "cli.ip.spoofdef": "write",
  "cli.ip6.dhcp.reqopt": "write",
  "cli.ip6.dhcp.client": "write",
  "cli.ip6.dhcp.server": "write",
  "cli.ip6.dhcp.optionc": "write",
  "cli.ip6.dhcp.options": "write",
  "cli.ip6.internet": "write",
  "cli.ip6.pneigh": "write",
  "cli.ip6.route": "write",
  "cli.ip6.radvd": "write",
  "cli.ip6.aiccu": "write",
  "cli.ip6.lan": "write",
  "cli.ip6.session": "write",
  "cli.ip6.bandwidth": "write",
  "cli.mngt.certimport": "write",
  "cli.mngt.ip6iids": "write",
  "cli.object.ip.grp": "write",
  "cli.object.ipv6.obj": "write",
  "cli.object.ipv6.grp": "write",
  "cli.object.country": "write",
  "cli.object.service.grp": "write",
  "cli.object.kw": "write",
  "cli.object.fe": "write",
  "cli.object.sms": "write",
  "cli.object.mail": "write",
  "cli.object.noti": "write",
  "cli.object.schedule": "write",
  "cli.qos.type": "write",
  "cli.qos.voip": "write",
  "cli.srv.dhcp.dhcp2": "write",
  "cli.srv.dhcp.frcdnsmanl": "write",
  "cli.srv.dhcp.ipcnt": "write",
  "cli.srv.dhcp.nodetype": "write",
  "cli.srv.dhcp.primwins": "write",
  "cli.srv.dhcp.secwins": "write",
  "cli.srv.dhcp.expiredrecycleip": "write",
  "cli.srv.dhcp.tftp": "write",
  "cli.srv.dhcp.tftpdel": "write",
  "cli.srv.dhcp.option": "write",
  "cli.srv.nat.ipsecpass": "write",
  "cli.srv.nat.pseudoctl": "write",
  "cli.srv.nat.rsttimeout": "write",
  "cli.switch.notrespond": "write",
  "cli.switch.clear": "write",
  "cli.switch.syslog": "write",
  "cli.sys.adminuser": "write",
  "cli.sys.board": "write",
  "cli.sys.bonjour": "write",
  "cli.sys.ftpd": "write",
  "cli.sys.sipalg": "write",
  "cli.sys.rtspalg": "write",
  "cli.sys.arpautoreq": "write",
  "cli.sys.daylightsave": "write",
  "cli.sys.eaptls": "write",
  "cli.upnp.wan": "write",
  "cli.vigbrg.closeall": "write",
  "cli.vigbrg.cfgip": "write",
  "cli.vlan.pri": "write",
  "cli.vlan.restart": "write",
  "cli.vpn.l2lset": "write",
  "cli.vpn.l2ldrop": "write",
  "cli.vpn.l2ldialout": "write",
  "cli.vpn.dinset": "write",
  "cli.vpn.subnet": "write",
  "cli.vpn.option": "write",
  "cli.vpn.trunk": "write",
  "cli.vpn.netbios": "write",
  "cli.vpn.multicast": "write",
  "cli.vpn.pass2nd": "write",
  "cli.vpn.pass2nat": "write",
  "cli.vpn.samesubnet": "write",
  "cli.vpn.mirror": "write",
  "cli.vpn.isolate": "write",
  "cli.vpn.mfa": "write",
  "cli.wan.dfcheck": "write",
};

interface ClassificationResult {
  readonly classification: Classification;
  readonly classificationBasis: ClassificationBasis;
  readonly status: "documented" | "blocked-by-documentation";
  readonly blockedReason?: string;
}

function classifyCliCommand(title: string): ClassificationResult {
  const key = familyKey(title);

  if (DANGER_LIST_FAMILIES.has(key)) {
    return {
      classification: "destructive",
      classificationBasis: "operations-danger-list",
      status: "documented",
    };
  }

  if (STREAMING_FAMILIES.has(key)) {
    return {
      classification: "unknown",
      classificationBasis: "unclassified",
      status: "blocked-by-documentation",
      blockedReason:
        'Documented as a continuous watch/tail-style command (e.g. "log -wt"); it does not ' +
        "fit the bounded single-exchange execution model (ARCHITECTURE.md Item 3) until a " +
        "dedicated streaming design exists.",
    };
  }

  const sessionMetaReason = SESSION_META_FAMILIES.get(key);
  if (sessionMetaReason !== undefined) {
    return {
      classification: "unknown",
      classificationBasis: "unclassified",
      status: "blocked-by-documentation",
      blockedReason: sessionMetaReason,
    };
  }

  const documentationBlockedReason = DOCUMENTATION_BLOCKED_FAMILIES.get(key);
  if (documentationBlockedReason !== undefined) {
    return {
      classification: "unknown",
      classificationBasis: "unclassified",
      status: "blocked-by-documentation",
      blockedReason: documentationBlockedReason,
    };
  }

  if (READ_ONLY_FAMILIES.has(key)) {
    return {
      classification: "read",
      classificationBasis: "command-map-family",
      status: "documented",
    };
  }

  if (WRITE_FAMILIES.has(key)) {
    return {
      classification: "write",
      classificationBasis: "command-map-family",
      status: "documented",
    };
  }

  if (WRITE_FAMILY_PREFIXES.some((prefix) => key === prefix || key.startsWith(`${prefix} `))) {
    return {
      classification: "write",
      classificationBasis: "command-map-family",
      status: "documented",
    };
  }

  return { classification: "unknown", classificationBasis: "unclassified", status: "documented" };
}

/**
 * Builds every manifest entry sourced from a single CLI heading. Most
 * headings produce exactly one entry (unchanged behavior); headings present
 * in `SPLIT_FAMILIES` (amendment 2026-09-13, see comment above that table)
 * produce one entry per real documented sub-command, all sharing this
 * heading's citation.
 */
function buildCliEntriesForHeading(
  title: string,
  citation: CliCapabilityEntry["citation"],
): readonly CliCapabilityEntry[] {
  const key = familyKey(title);
  const split = SPLIT_FAMILIES.get(key);

  if (split !== undefined) {
    return split.map((sub) => {
      const entry: CliCapabilityEntry = {
        kind: "cli-command",
        id: sub.id ?? `cli.${slugifyCommandPath(sub.commandPath)}`,
        title: sub.command,
        citation,
        classification: sub.classification,
        classificationBasis: sub.classificationBasis,
        status: "documented",
        operationIds: [],
        command: sub.command,
        commandPath: sub.commandPath,
        firmwareBasis: "user-guide-v4.3.5.1",
        verifiedOnFirmware: null,
      };

      return entry;
    });
  }

  const commandPath = commandPathFromTitle(title);
  const id = `cli.${slugifyCommandPath(commandPath)}`;
  const baseResult = classifyCliCommand(title);
  const documentationOverride = DOCUMENTATION_SYNTAX_CLASSIFICATION[id];
  const afterDocumentation =
    documentationOverride !== undefined
      ? {
          ...baseResult,
          classification: documentationOverride,
          classificationBasis: "documented-syntax" as const,
        }
      : baseResult;
  const siblingOverride = SIBLING_LIVE_VERIFIED_CLASSIFICATION[id];
  const { classification, classificationBasis, status, blockedReason } =
    siblingOverride !== undefined
      ? {
          ...afterDocumentation,
          classification: siblingOverride,
          classificationBasis: "sibling-live-verified" as const,
        }
      : afterDocumentation;

  const entry: CliCapabilityEntry = {
    kind: "cli-command",
    id,
    title,
    citation,
    classification,
    classificationBasis,
    status,
    ...(blockedReason !== undefined ? { blockedReason } : {}),
    operationIds: [],
    command: title,
    commandPath,
    firmwareBasis: "user-guide-v4.3.5.1",
    verifiedOnFirmware: null,
  };

  return [entry];
}

function parseCliCorpus(rawText: string): readonly CliCapabilityEntry[] {
  const rawLines = rawText.split("\n");
  const headingLineNumbers = findCliHeadingLines(rawLines);
  const pageAtLine = buildPageIndex(rawLines);

  return headingLineNumbers.flatMap((rawLine) => {
    const rawLineText = rawLines[rawLine - 1] ?? "";
    const decoded = decodeDoubledLetters(rawLineText.trim());
    const title = extractCommandTitle(decoded);
    const pdfPage = pageAtLine[rawLine - 1] ?? 0;
    const citation: CliCapabilityEntry["citation"] = {
      corpus: "user-guide-part-viii",
      rawLine,
      pdfPage,
    };

    return buildCliEntriesForHeading(title, citation);
  });
}

// ---------------------------------------------------------------------------
// WebUI corpus parsing
// ---------------------------------------------------------------------------

interface WebUiIndexRow {
  readonly menuPath: string;
  readonly captureStatus: "ok" | "js-empty";
  readonly captureFile: string;
}

/** Strips a single layer of Markdown inline-code backticks, if present. */
function stripBackticks(cell: string): string {
  const trimmed = cell.trim();

  if (trimmed.startsWith("`") && trimmed.endsWith("`") && trimmed.length >= 2) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/**
 * AppleDouble trap, resolved (`ARCHITECTURE.md`, `BACKLOG.md` A3): this
 * generator never scans the `webui-capture/` directory tree — it parses
 * only `INDEX.md`'s markdown table — but the trap the architecture flags is
 * real and was verified by hand: `webui-capture/{pages,html,text}/` each
 * contain exactly 3 files named `._cgi-bin_v2x00.cgi_fid-{2196,2197,2297}.*`
 * (9 files total). A *naive* rule ("any `._`-prefixed file is a macOS
 * AppleDouble resource-fork sidecar, drop it") turns out to be wrong here:
 * inspecting their bytes shows real PNG/HTML/plain-text page content (e.g.
 * `._cgi-bin_v2x00.cgi_fid-2196.txt` is 749 bytes of real WAN/LAN status
 * text, not the AppleDouble binary magic `0x00051607`), and `INDEX.md`
 * cites exactly these 3 filenames for 3 otherwise-undocumented, non-
 * duplicate rows ("NAT >> Sessions", "Port Setup", "System Maintenance >>
 * Max Connection" — `grep -n "2297\\|2196\\|2197" INDEX.md`). `text/` holds
 * 168 normally-named `.txt` files + these 3 `._`-prefixed ones = 171,
 * matching `INDEX.md`'s row count exactly. So: (a) a *directory* glob over
 * `text/` must not blanket-exclude `._*` — doing so here would silently
 * undercount to 168 and drop 3 real pages; (b) this generator sidesteps the
 * whole question by trusting `INDEX.md`'s 171 rows as ground truth and
 * never re-deriving the count from a filesystem scan. No row is dropped by
 * capture-file name here — only true accidental duplicate rows (same
 * `captureFile` cited twice) would ever be excluded, and none exist (every
 * one of the 171 `captureFile` values in `INDEX.md` is unique).
 */
function parseWebUiIndexRows(indexText: string): readonly WebUiIndexRow[] {
  const rows: WebUiIndexRow[] = [];
  let sawSeparator = false;

  for (const line of indexText.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("|---")) {
      sawSeparator = true;
      continue;
    }

    if (!sawSeparator || !trimmed.startsWith("|")) {
      continue;
    }

    const cells = trimmed
      .slice(1, trimmed.endsWith("|") ? -1 : undefined)
      .split("|")
      .map((cell) => cell.trim());

    if (cells.length < 3) {
      continue;
    }

    const [menuCell, statusCell, captureCell] = cells as [string, string, string];
    const captureFile = stripBackticks(captureCell);
    const statusToken = stripBackticks(statusCell);
    const captureStatus: "ok" | "js-empty" = statusToken.includes("JS") ? "js-empty" : "ok";

    rows.push({ menuPath: menuCell, captureStatus, captureFile });
  }

  const seenCaptureFiles = new Set<string>();

  for (const row of rows) {
    if (seenCaptureFiles.has(row.captureFile)) {
      throw new Error(
        `INDEX.md cites the capture file "${row.captureFile}" more than once; ` +
          "refusing to generate duplicate WebUI manifest entries.",
      );
    }

    seenCaptureFiles.add(row.captureFile);
  }

  return rows;
}

/**
 * WebUI-only functions (no CLI equivalent documented in Part VIII, per
 * `webui-map.md`): Configuration Backup and Firmware Upgrade are the two
 * `(no title)` JS-empty captures identified by `webui-map.md`'s note
 * ("Pages captured as empty ...: ... Configuration Backup (`fid=2016`),
 * Firmware Upgrade (`fid=2019`)"); Port Knocking and Fast NAT are captured
 * `ok` NAT sub-pages `webui-map.md` explicitly marks "WebUI-only (verify:
 * no CLI command found in Part VIII)". Matched by exact capture-file name
 * (a location fact from `INDEX.md`/`webui-map.md`, not embedded content).
 */
const WEBUI_ONLY_BLOCKED_REASONS: ReadonlyMap<string, string> = new Map([
  [
    "cgi-bin_v2x00.cgi_fid-2016.png",
    "WebUI-only function (Configuration Backup): no CLI export/import command exists in " +
      "Part VIII per webui-map.md; the capture also rendered no static content (JS/Angular SPA).",
  ],
  [
    "cgi-bin_v2x00.cgi_fid-2019.png",
    "WebUI-only function (Firmware Upgrade): no CLI upload command exists in Part VIII per " +
      "webui-map.md (only `sys tftpd` enables the TFTP server); the capture also rendered no " +
      "static content (JS/Angular SPA).",
  ],
  [
    "cgi-bin_ptknock.cgi_fid-0-iPageIdx-1.png",
    "WebUI-only function (NAT >> Port Knocking): webui-map.md records no corresponding CLI " +
      "command in Part VIII.",
  ],
  [
    "cgi-bin_v2x00.cgi_fid-2089-iAct-1.png",
    "WebUI-only function (NAT >> Fast NAT): webui-map.md records no corresponding CLI command " +
      "in Part VIII.",
  ],
]);

function slugifyMenuPath(menuPath: string): string {
  return menuPath
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0)
    .join(".");
}

function parseWebUiCorpus(indexText: string): readonly WebUiCapabilityEntry[] {
  const rows = parseWebUiIndexRows(indexText);

  return rows.map((row, zeroBasedIndex) => {
    const indexRow = zeroBasedIndex + 1;
    const slug = slugifyMenuPath(row.menuPath);
    const id = `webui.r${String(indexRow)}${slug.length > 0 ? `.${slug}` : ""}`;
    const blockedReason = WEBUI_ONLY_BLOCKED_REASONS.get(row.captureFile);

    const entry: WebUiCapabilityEntry = {
      kind: "webui-page",
      id,
      title: row.menuPath,
      citation: { corpus: "webui-capture", captureFile: row.captureFile, indexRow },
      classification: "unknown",
      classificationBasis: "unclassified",
      status: blockedReason !== undefined ? "blocked-by-documentation" : "documented",
      ...(blockedReason !== undefined ? { blockedReason } : {}),
      operationIds: [],
      menuPath: row.menuPath,
      captureStatus: row.captureStatus,
      firmwareBasis: "live-capture-4.4.7_RC2",
    };

    return entry;
  });
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

/**
 * CLI commands live-verified on firmware 4.4.7_RC2 that are absent from the
 * Part VIII PDF corpus (`ARCHITECTURE.md` amendment 2026-09-13, Citation
 * corpus `live-firmware-recon`). `evidenceRef` is a location pointer only
 * (sibling registry path + command id) — never embedded output. Consulted as
 * static evidence; never a runtime dependency on vigor3912s-mcp.
 */
interface LiveFirmwareReconCommand {
  readonly commandPath: readonly string[];
  readonly command: string;
  readonly classification: "read" | "write";
  readonly evidenceRef: string;
}

const LIVE_FIRMWARE_RECON_COMMANDS: readonly LiveFirmwareReconCommand[] = [
  // show.*
  {
    commandPath: ["show", "cpu"],
    command: "show cpu",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/show.ts#show_cpu",
  },
  {
    commandPath: ["show", "memory"],
    command: "show memory",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/show.ts#show_memory",
  },
  {
    commandPath: ["show", "cocpu"],
    command: "show cocpu",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/show.ts#show_cocpu",
  },
  {
    commandPath: ["show", "cputemp"],
    command: "show cputemp",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/show.ts#show_cputemp",
  },
  {
    commandPath: ["show", "flow"],
    command: "show flow",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/show.ts#show_flow",
  },
  {
    commandPath: ["show", "voip"],
    command: "show voip",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/show.ts#show_voip",
  },
  {
    commandPath: ["show", "qryrdsl"],
    command: "show qryrdsl",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/show.ts#show_qryrdsl",
  },
  // sys.*
  {
    commandPath: ["sys", "info"],
    command: "sys info",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/sys.ts#sys_info",
  },
  {
    commandPath: ["sys", "app_statistic"],
    command: "sys app_statistic",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/sys.ts#sys_app_statistic",
  },
  {
    commandPath: ["sys", "app_bandwidth"],
    command: "sys app_bandwidth",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/sys.ts#sys_app_bandwidth",
  },
  // fs.* (new family — not in PDF)
  {
    commandPath: ["fs", "ls"],
    command: "fs ls",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/fs.ts#fs_ls",
  },
  {
    commandPath: ["fs", "info"],
    command: "fs info",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/fs.ts#fs_info",
  },
  {
    commandPath: ["fs", "pwd"],
    command: "fs pwd",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/fs.ts#fs_pwd",
  },
  // dpdk.* (new family — not in PDF)
  {
    commandPath: ["dpdk", "statistic"],
    command: "dpdk statistic",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/dpdk.ts#dpdk_statistic",
  },
  {
    commandPath: ["dpdk", "cmdlog"],
    command: "dpdk cmdlog",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/dpdk.ts#dpdk_cmdlog",
  },
  // vrrp.* (new family — not in PDF)
  {
    commandPath: ["vrrp", "show"],
    command: "vrrp show",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/vrrp.ts#vrrp_show",
  },
  {
    commandPath: ["vrrp", "enable"],
    command: "vrrp enable",
    classification: "write",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/vrrp.ts#vrrp_enable",
  },
  {
    commandPath: ["vrrp", "set"],
    command: "vrrp set",
    classification: "write",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/vrrp.ts#vrrp_set",
  },
  {
    commandPath: ["vrrp", "apply"],
    command: "vrrp apply",
    classification: "write",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/vrrp.ts#vrrp_apply",
  },
  {
    commandPath: ["vrrp", "reset"],
    command: "vrrp reset",
    classification: "write",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/vrrp.ts#vrrp_reset",
  },
  // additive members of existing PDF families
  {
    commandPath: ["usb", "disk"],
    command: "usb disk",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/usb.ts#usb_disk",
  },
  {
    commandPath: ["vpn", "graph"],
    command: "vpn graph",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/vpn.ts#vpn_graph",
  },
  {
    commandPath: ["srv", "nat", "view"],
    command: "srv nat view",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/srv.ts#nat_view",
  },
  {
    commandPath: ["radius", "show_local_cer"],
    command: "radius show_local_cer",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/radius.ts#radius_show_local_cer",
  },
];

function buildLiveFirmwareReconEntries(): readonly CliCapabilityEntry[] {
  return LIVE_FIRMWARE_RECON_COMMANDS.map((row) => {
    const id = `cli.${slugifyCommandPath(row.commandPath)}`;
    const entry: CliCapabilityEntry = {
      kind: "cli-command",
      id,
      title: row.command,
      citation: {
        corpus: "live-firmware-recon",
        firmware: "4.4.7_RC2",
        evidenceRef: row.evidenceRef,
      },
      classification: row.classification,
      classificationBasis: "sibling-live-verified",
      status: "documented",
      operationIds: [],
      command: row.command,
      commandPath: row.commandPath,
      firmwareBasis: "live-recon-4.4.7_RC2",
      verifiedOnFirmware: "4.4.7_RC2",
    };

    return entry;
  });
}

function buildManifest(): readonly CapabilityEntry[] {
  const cliRawText = readFileSync(CLI_RAW_PATH, "utf-8");
  const webUiIndexText = readFileSync(WEBUI_INDEX_PATH, "utf-8");

  const cliEntries = parseCliCorpus(cliRawText);
  const reconEntries = buildLiveFirmwareReconEntries();
  const webUiEntries = parseWebUiCorpus(webUiIndexText);

  return [...cliEntries, ...reconEntries, ...webUiEntries];
}

function renderGeneratedModule(manifest: readonly CapabilityEntry[]): string {
  const body = JSON.stringify(manifest, null, 2);

  return `/**
 * GENERATED FILE — do not hand-edit.
 *
 * Produced by \`tools/generate-capability-manifest.ts\` from:
 *   - \`references/cli-reference-raw.txt\` (327 CLI headings)
 *   - live-firmware-recon additive CLI rows (fw 4.4.7_RC2; not in PDF)
 *   - \`references/webui-index.md\` (171 WebUI capture rows)
 *
 * Regenerate with \`npm run manifest:generate\`; drift is caught by
 * \`npm run manifest:check\` (folded into \`npm run verify\`).
 */

import type { CapabilityEntry } from "./types.js";

export const capabilityManifest = ${body} as const satisfies readonly CapabilityEntry[];
`;
}

function domainFamilyIdentifier(fileName: string): string {
  const family = fileName.replace(/\.ts$/, "");

  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(family)) {
    throw new Error(
      `Domain file basename "${family}" is not a valid TypeScript identifier for the public operations namespace.`,
    );
  }

  return family;
}

function domainNamespaceImportIdentifier(fileName: string): string {
  const family = domainFamilyIdentifier(fileName);
  const reservedIdentifiers = new Set(["switch"]);

  return reservedIdentifiers.has(family) ? `${family}Domain` : family;
}

function renderOperationsModule(domainFileNames: readonly string[]): string {
  const imports = domainFileNames
    .map((fileName) => {
      const family = domainFamilyIdentifier(fileName);
      const importIdentifier = domainNamespaceImportIdentifier(fileName);

      return `import * as ${importIdentifier} from "../domains/${family}.js";`;
    })
    .join("\n");

  const entries = domainFileNames
    .map((fileName) => {
      const family = domainFamilyIdentifier(fileName);
      const importIdentifier = domainNamespaceImportIdentifier(fileName);

      return family === importIdentifier ? `  ${family},` : `  ${family}: ${importIdentifier},`;
    })
    .join("\n");

  return `/**
 * GENERATED FILE — do not hand-edit.
 * Produced by tools/generate-capability-manifest.ts.
 */

${imports.length > 0 ? `${imports}\n\n` : ""}export const operations = {
${entries}
} as const;

export type { TypedOperation, OperationClassification } from "../internal/registry/operation.js";
export type { CommandExchange } from "../internal/execution/transport.js";
export type { CommandFrame } from "../internal/execution/framing.js";
export type { ExecutionLimits } from "../internal/execution/limits.js";
`;
}

/**
 * Formats generated output with the project's own Prettier config so the
 * committed file always matches `npm run format:check` byte-for-byte
 * (`JSON.stringify` quotes every object key; Prettier's default
 * `quoteProps: "as-needed"` does not) and so `manifest:check`'s string
 * comparison is stable across regenerations.
 */
async function formatGeneratedModule(source: string, outputPath: string): Promise<string> {
  const config = await prettier.resolveConfig(outputPath);

  return prettier.format(source, {
    ...config,
    filepath: outputPath,
  });
}

function assertNoDuplicateIds(manifest: readonly CapabilityEntry[]): void {
  const seen = new Set<string>();

  for (const entry of manifest) {
    if (seen.has(entry.id)) {
      throw new Error(`Duplicate manifest id generated: "${entry.id}"`);
    }

    seen.add(entry.id);
  }
}

/**
 * Reads a committed generated file, returning `null` if it does not exist
 * yet (distinct from an empty file).
 */
function readCommitted(outputPath: string): string | null {
  try {
    return readFileSync(outputPath, "utf-8");
  } catch {
    return null;
  }
}

interface GeneratedArtifact {
  readonly label: string;
  readonly outputPath: string;
  readonly rendered: string;
}

/**
 * Writes (generate mode) or diffs against the committed file (check mode) for
 * a single generated artifact. Returns `true` when the artifact is in sync
 * (either freshly written, or matched the committed file in check mode).
 */
function writeOrCheckArtifact(artifact: GeneratedArtifact, checkMode: boolean): boolean {
  const { label, outputPath, rendered } = artifact;

  if (!checkMode) {
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, rendered, "utf-8");
    console.log(`Generated ${label} -> ${path.relative(sdkRoot, outputPath)}`);
    return true;
  }

  const committed = readCommitted(outputPath);

  if (committed === rendered) {
    console.log(`manifest:check OK — ${label} matches the committed file.`);
    return true;
  }

  const tempDir = mkdtempSync(path.join(tmpdir(), "vigor3912s-manifest-check-"));
  const tempPath = path.join(tempDir, path.basename(outputPath));
  writeFileSync(tempPath, rendered, "utf-8");

  console.error(
    committed === null
      ? `manifest:check FAILED — ${path.relative(sdkRoot, outputPath)} does not exist. ` +
          `Freshly generated output written to ${tempPath} for inspection. Run "npm run manifest:generate".`
      : `manifest:check FAILED — ${path.relative(sdkRoot, outputPath)} is stale/drifted. ` +
          `Freshly generated output written to ${tempPath} for inspection/diff. Run "npm run manifest:generate".`,
  );

  return false;
}

async function main(): Promise<void> {
  const checkMode = process.argv.includes("--check");
  const corpusManifest = buildManifest();

  assertNoDuplicateIds(corpusManifest);

  const selfAssemblyUrl = new URL("../dist/internal/registry/self-assembly.js", import.meta.url)
    .href;
  const {
    buildSelfAssembledRegistry,
    discoverDomainOperations,
    listDomainModuleFiles,
    overlayImplementedStatus,
    renderRegistryModule,
  } = (await import(selfAssemblyUrl)) as typeof SelfAssemblyModule;

  // Domain self-assembly (BACKLOG.md B1 refinement; ARCHITECTURE.md Item 5):
  // discover `src/domains/*.ts` modules (none exist yet -> empty registry,
  // manifest overlay is a no-op today), assemble a registry from their
  // `operations` exports, and overlay `status: "implemented"` back onto the
  // corpus-derived manifest. See `src/internal/registry/self-assembly.ts` for
  // the domain export convention and validation rules.
  const domainOperations = await discoverDomainOperations(DOMAINS_DIR, DIST_DOMAINS_DIR);
  const registry = buildSelfAssembledRegistry(domainOperations, corpusManifest);
  const manifest = overlayImplementedStatus(corpusManifest, registry);
  const domainFileNames = await listDomainModuleFiles(DOMAINS_DIR);

  const cliCount = manifest.filter((entry) => entry.kind === "cli-command").length;
  const webUiCount = manifest.filter((entry) => entry.kind === "webui-page").length;

  const renderedManifest = await formatGeneratedModule(
    renderGeneratedModule(manifest),
    GENERATED_OUTPUT_PATH,
  );
  const renderedRegistry = await formatGeneratedModule(
    renderRegistryModule(domainFileNames),
    REGISTRY_OUTPUT_PATH,
  );
  const renderedOperations = await formatGeneratedModule(
    renderOperationsModule(domainFileNames),
    OPERATIONS_OUTPUT_PATH,
  );

  const manifestOk = writeOrCheckArtifact(
    {
      label:
        `${String(manifest.length)} capability manifest entries ` +
        `(${String(cliCount)} cli-command, ${String(webUiCount)} webui-page)`,
      outputPath: GENERATED_OUTPUT_PATH,
      rendered: renderedManifest,
    },
    checkMode,
  );
  const registryOk = writeOrCheckArtifact(
    {
      label:
        `self-assembled operation registry (${String(registry.size)} operations from ` +
        `${String(domainFileNames.length)} domain module(s))`,
      outputPath: REGISTRY_OUTPUT_PATH,
      rendered: renderedRegistry,
    },
    checkMode,
  );
  const operationsOk = writeOrCheckArtifact(
    {
      label: `public operations namespace (${String(domainFileNames.length)} domain family namespace(s))`,
      outputPath: OPERATIONS_OUTPUT_PATH,
      rendered: renderedOperations,
    },
    checkMode,
  );

  if (checkMode && (!manifestOk || !registryOk || !operationsOk)) {
    process.exitCode = 1;
  }
}

await main();
