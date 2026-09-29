import type { Classification, ClassificationBasis } from "../../src/manifest/types.js";

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
export interface SplitSubCommand {
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

export const SPLIT_FAMILIES: ReadonlyMap<string, readonly SplitSubCommand[]> = new Map([
  [
    "ipf set",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["ipf", "set"],
        command: "ipf set",
        classification: "write",
        classificationBasis: "sibling-live-verified",
      },
      // filter rule options through `ipf set` (rawLine 3125).
      {
        id: "cli.ipf.set.rule",
        commandPath: ["ipf", "set"],
        command: "ipf set <SET_NO> rule <RULE_NO> <Options>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "ddns set",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["ddns", "set"],
        command: "ddns set",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // updates any subset of one DDNS account (rawLine 643).
      {
        id: "cli.ddns.set.update",
        commandPath: ["ddns", "set"],
        command: "ddns set -i <index> [-<flag> <value> ...]",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "hsportal info",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["hsportal", "info"],
        command: "hsportal info",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // user-info database, notification, backup, notification objects (rawLine 11458).
      {
        id: "cli.hsportal.info.set",
        commandPath: ["hsportal", "info"],
        command: "hsportal info -e|-n|-a <0/1> / -m|-s <1~10>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // clears the user information database (destructive).
      {
        id: "cli.hsportal.info.clear",
        commandPath: ["hsportal", "info"],
        command: "hsportal info -c",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "hsportal level",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["hsportal", "level"],
        command: "hsportal level",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // quota policy profile settings (rawLine 11494).
      {
        id: "cli.hsportal.level.set",
        commandPath: ["hsportal", "level"],
        command: "hsportal level -p <index> [-e ..] [-t ..] ...",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // deletes a quota policy profile.
      {
        id: "cli.hsportal.level.delete",
        commandPath: ["hsportal", "level"],
        command: "hsportal level -c <index>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "local_8021x",
    [
      // pre-existing entry (id unchanged); the operation is `local_8021x show`.
      {
        id: "cli.local8021x",
        commandPath: ["local_8021x", "show"],
        command: "local_8021x show",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // enables the local 802.1X server (rawLine 11727).
      {
        id: "cli.local8021x.enable",
        commandPath: ["local_8021x", "enable"],
        command: "local_8021x enable <0/1>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // sets/deletes an authentication method.
      {
        id: "cli.local8021x.method",
        commandPath: ["local_8021x", "set_localdot1x_method"],
        command: "local_8021x set_localdot1x_method -e|-d <method_idx>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "wol",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["wol"],
        command: "wol",
        classification: "write",
        classificationBasis: "sibling-live-verified",
      },
      // WoL from WAN (rawLine 11766).
      {
        id: "cli.wol.fromwan",
        commandPath: ["wol", "fromWan"],
        command: "wol fromWan <on/off/any>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // WoL-from-WAN source whitelist entry.
      {
        id: "cli.wol.fromwansetting",
        commandPath: ["wol", "fromWan_Setting"],
        command: "wol fromWan_Setting <idx> <ip address> <mask>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "show traffic",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["show", "traffic"],
        command: "show traffic",
        classification: "read",
        classificationBasis: "command-map-family",
      },
      // per-WAN traffic graph (rawLine 6905).
      {
        id: "cli.show.traffic.wan",
        commandPath: ["show", "traffic"],
        command: "show traffic <wan1~wan7> <tx/rx> [weekly]",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // per-IP traffic graph.
      {
        id: "cli.show.traffic.ip",
        commandPath: ["show", "traffic"],
        command: "show traffic <ipaddr> <tx/rx>",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // session graph.
      {
        id: "cli.show.traffic.session",
        commandPath: ["show", "traffic", "session"],
        command: "show traffic session [weekly]",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // enables/disables per-IP traffic statistics.
      {
        id: "cli.show.traffic.ipstats",
        commandPath: ["show", "traffic", "ip"],
        command: "show traffic ip [1/0]",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "show clienttraffic",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["show", "clienttraffic"],
        command: "show clienttraffic",
        classification: "read",
        classificationBasis: "command-map-family",
      },
      // external device traffic (rawLine 6928).
      {
        id: "cli.show.clienttraffic.device",
        commandPath: ["show", "clienttraffic"],
        command: "show clienttraffic <device index> <wan#|lan#> <tx/rx> [weekly]",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "show statistic",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["show", "statistic"],
        command: "show statistic",
        classification: "read",
        classificationBasis: "command-map-family",
      },
      // resets a WAN's byte counters (rawLine 6947).
      {
        id: "cli.show.statistic.reset",
        commandPath: ["show", "statistic", "reset"],
        command: "show statistic reset <interface>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "service",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["service"],
        command: "service",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // refreshes the MyVigor service status (rawLine 13038).
      {
        id: "cli.service.refresh",
        commandPath: ["service"],
        command: "service -r",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // logs in to MyVigor.
      {
        id: "cli.service.login",
        commandPath: ["service"],
        command: "service -l <account> <password>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // stages the new owner for a transfer.
      {
        id: "cli.service.transferowner",
        commandPath: ["service"],
        command: "service -i <new_owner> <new_owner_email>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // transfers device ownership (destructive).
      {
        id: "cli.service.transfer",
        commandPath: ["service"],
        command: "service -t <yes/no>",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // clears the owner's account information (destructive).
      {
        id: "cli.service.clear",
        commandPath: ["service"],
        command: "service -c",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "wan lb",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["wan", "lb"],
        command: "wan lb",
        classification: "write",
        classificationBasis: "command-map-family",
      },
      // load-balance mode (rawLine 11010).
      {
        id: "cli.wan.lb.mode",
        commandPath: ["wan", "lb"],
        command: "wan lb <ip/session>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // load-balance membership status.
      {
        id: "cli.wan.lb.status",
        commandPath: ["wan", "lb", "status"],
        command: "wan lb status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "wan vlan",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["wan", "vlan"],
        command: "wan vlan",
        classification: "write",
        classificationBasis: "command-map-family",
      },
      // current WAN VLAN tagging (rawLine 11191).
      {
        id: "cli.wan.vlan.stat",
        commandPath: ["wan", "vlan", "stat"],
        command: "wan vlan stat",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "wan budget",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["wan", "budget"],
        command: "wan budget",
        classification: "write",
        classificationBasis: "command-map-family",
      },
      // WAN budget configuration (rawLine 11223).
      {
        id: "cli.wan.budget.status",
        commandPath: ["wan", "budget", "status"],
        command: "wan budget status",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "csm dnsf",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["csm", "dnsf"],
        command: "csm dnsf",
        classification: "write",
        classificationBasis: "sibling-live-verified",
      },
      // shows the DNS filter local black/white list (rawLine 588).
      {
        id: "cli.csm.dnsf.localbw.show",
        commandPath: ["csm", "dnsf", "local_bw"],
        command: "csm dnsf local_bw s",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // clears the local black/white list to factory defaults.
      {
        id: "cli.csm.dnsf.localbw.clear",
        commandPath: ["csm", "dnsf", "local_bw"],
        command: "csm dnsf local_bw c",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // configures the local black/white list.
      {
        id: "cli.csm.dnsf.localbw.set",
        commandPath: ["csm", "dnsf", "local_bw"],
        command: "csm dnsf local_bw e/d/p/b/a/g/o",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "vpn list",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["vpn", "list"],
        command: "vpn list",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // one LAN-to-LAN profile's settings (rawLine 10146).
      {
        id: "cli.vpn.list.profile",
        commandPath: ["vpn", "list"],
        command: "vpn list <index> <all/com/out/in/net>",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "vpn remote",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["vpn", "remote"],
        command: "vpn remote",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // enables/disables a remote dial-in VPN service (rawLine 10208).
      {
        id: "cli.vpn.remote.set",
        commandPath: ["vpn", "remote"],
        command: "vpn remote <service> [<wanN>] <on/off>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object ip obj",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "ip", "obj"],
        command: "object ip obj",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.ip.obj.setdefault",
        commandPath: ["object", "ip", "obj", "setdefault"],
        command: "object ip obj setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object ip obj INDEX -n/-i/-s/-a`.
      {
        id: "cli.object.ip.obj.set",
        commandPath: ["object", "ip", "obj"],
        command: "object ip obj INDEX -n/-i/-s/-a",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object ip grp",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "ip", "grp"],
        command: "object ip grp",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object ip grp INDEX -v`.
      {
        id: "cli.object.ip.grp.view",
        commandPath: ["object", "ip", "grp", "view"],
        command: "object ip grp INDEX -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.ip.grp.setdefault",
        commandPath: ["object", "ip", "grp", "setdefault"],
        command: "object ip grp setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object ip grp INDEX -i/-a`.
      {
        id: "cli.object.ip.grp.set",
        commandPath: ["object", "ip", "grp"],
        command: "object ip grp INDEX -i/-a",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object ipv6 obj",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "ipv6", "obj"],
        command: "object ipv6 obj",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object ipv6 obj INDEX -v`.
      {
        id: "cli.object.ipv6.obj.view",
        commandPath: ["object", "ipv6", "obj", "view"],
        command: "object ipv6 obj INDEX -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.ipv6.obj.setdefault",
        commandPath: ["object", "ipv6", "obj", "setdefault"],
        command: "object ipv6 obj setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object ipv6 obj INDEX -s/-e/-a`.
      {
        id: "cli.object.ipv6.obj.set",
        commandPath: ["object", "ipv6", "obj"],
        command: "object ipv6 obj INDEX -s/-e/-a",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object ipv6 grp",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "ipv6", "grp"],
        command: "object ipv6 grp",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object ipv6 grp INDEX -v`.
      {
        id: "cli.object.ipv6.grp.view",
        commandPath: ["object", "ipv6", "grp", "view"],
        command: "object ipv6 grp INDEX -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.ipv6.grp.setdefault",
        commandPath: ["object", "ipv6", "grp", "setdefault"],
        command: "object ipv6 grp setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object ipv6 grp INDEX -a`.
      {
        id: "cli.object.ipv6.grp.set",
        commandPath: ["object", "ipv6", "grp"],
        command: "object ipv6 grp INDEX -a",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object country",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "country"],
        command: "object country",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object country set INDEX -v`.
      {
        id: "cli.object.country.view",
        commandPath: ["object", "country", "view"],
        command: "object country set INDEX -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // `object country set INDEX -a`.
      {
        id: "cli.object.country.set",
        commandPath: ["object", "country"],
        command: "object country set INDEX -a",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object country activate`.
      {
        id: "cli.object.country.activate",
        commandPath: ["object", "country", "activate"],
        command: "object country activate",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.country.setdefault",
        commandPath: ["object", "country", "setdefault"],
        command: "object country setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object country list`.
      {
        id: "cli.object.country.list",
        commandPath: ["object", "country", "list"],
        command: "object country list",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object service obj",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "service", "obj"],
        command: "object service obj",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.service.obj.setdefault",
        commandPath: ["object", "service", "obj", "setdefault"],
        command: "object service obj setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object service obj INDEX -n/-p/-s/-d`.
      {
        id: "cli.object.service.obj.set",
        commandPath: ["object", "service", "obj"],
        command: "object service obj INDEX -n/-p/-s/-d",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object service grp",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "service", "grp"],
        command: "object service grp",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object service grp INDEX -v`.
      {
        id: "cli.object.service.grp.view",
        commandPath: ["object", "service", "grp", "view"],
        command: "object service grp INDEX -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.service.grp.setdefault",
        commandPath: ["object", "service", "grp", "setdefault"],
        command: "object service grp setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object service grp INDEX -a`.
      {
        id: "cli.object.service.grp.set",
        commandPath: ["object", "service", "grp"],
        command: "object service grp INDEX -a",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object kw",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "kw"],
        command: "object kw",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object kw obj show PAGE`.
      {
        id: "cli.object.kw.show",
        commandPath: ["object", "kw", "show"],
        command: "object kw obj show PAGE",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // `object kw obj INDEX -v`.
      {
        id: "cli.object.kw.view",
        commandPath: ["object", "kw", "view"],
        command: "object kw obj INDEX -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.kw.setdefault",
        commandPath: ["object", "kw", "setdefault"],
        command: "object kw obj setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object kw obj INDEX -a/-c`.
      {
        id: "cli.object.kw.set",
        commandPath: ["object", "kw"],
        command: "object kw obj INDEX -a/-c",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object fe",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "fe"],
        command: "object fe",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object fe show`.
      {
        id: "cli.object.fe.show",
        commandPath: ["object", "fe", "show"],
        command: "object fe show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.fe.setdefault",
        commandPath: ["object", "fe", "setdefault"],
        command: "object fe setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object fe obj INDEX -v`.
      {
        id: "cli.object.fe.view",
        commandPath: ["object", "fe", "view"],
        command: "object fe obj INDEX -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // `object fe obj INDEX -e/-d`.
      {
        id: "cli.object.fe.set",
        commandPath: ["object", "fe"],
        command: "object fe obj INDEX -e/-d",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object sms",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "sms"],
        command: "object sms",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object sms show`.
      {
        id: "cli.object.sms.show",
        commandPath: ["object", "sms", "show"],
        command: "object sms show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.sms.setdefault",
        commandPath: ["object", "sms", "setdefault"],
        command: "object sms setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object sms obj INDEX -v`.
      {
        id: "cli.object.sms.view",
        commandPath: ["object", "sms", "view"],
        command: "object sms obj INDEX -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // `object sms obj INDEX -s/-u/-p/-q/-i/-l`.
      {
        id: "cli.object.sms.set",
        commandPath: ["object", "sms"],
        command: "object sms obj INDEX -s/-u/-p/-q/-i/-l",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object mail",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "mail"],
        command: "object mail",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object mail show`.
      {
        id: "cli.object.mail.show",
        commandPath: ["object", "mail", "show"],
        command: "object mail show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.mail.setdefault",
        commandPath: ["object", "mail", "setdefault"],
        command: "object mail setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object mail obj INDEX -v`.
      {
        id: "cli.object.mail.view",
        commandPath: ["object", "mail", "view"],
        command: "object mail obj INDEX -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // `object mail obj INDEX -s/-l/-m/-a/-t/-u/-p/-i/-w/-x`.
      {
        id: "cli.object.mail.set",
        commandPath: ["object", "mail"],
        command: "object mail obj INDEX -s/-l/-m/-a/-t/-u/-p/-i/-w/-x",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object noti",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "noti"],
        command: "object noti",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object noti show`.
      {
        id: "cli.object.noti.show",
        commandPath: ["object", "noti", "show"],
        command: "object noti show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.noti.setdefault",
        commandPath: ["object", "noti", "setdefault"],
        command: "object noti setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // `object noti obj INDEX -v`.
      {
        id: "cli.object.noti.view",
        commandPath: ["object", "noti", "view"],
        command: "object noti obj INDEX -v",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // `object noti obj INDEX -e/-d`.
      {
        id: "cli.object.noti.set",
        commandPath: ["object", "noti"],
        command: "object noti obj INDEX -e/-d",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "object schedule",
    [
      // pre-existing entry (id/metadata unchanged).
      {
        commandPath: ["object", "schedule"],
        command: "object schedule",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object schedule set INDEX <option>`.
      {
        id: "cli.object.schedule.set",
        commandPath: ["object", "schedule"],
        command: "object schedule set INDEX <option>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // `object schedule view [INDEX]`.
      {
        id: "cli.object.schedule.view",
        commandPath: ["object", "schedule", "view"],
        command: "object schedule view [INDEX]",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // returns every profile to defaults (destructive).
      {
        id: "cli.object.schedule.setdefault",
        commandPath: ["object", "schedule", "setdefault"],
        command: "object schedule setdefault",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "sys pollbuf",
    [
      // live-verified bare query (unchanged).
      {
        commandPath: ["sys", "pollbuf"],
        command: "sys pollbuf",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // rawLine 8121.
      {
        commandPath: ["sys", "pollbuf", "on"],
        command: "sys pollbuf on",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 8122.
      {
        commandPath: ["sys", "pollbuf", "off"],
        command: "sys pollbuf off",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "sys time",
    [
      // live-verified bare query (unchanged).
      {
        commandPath: ["sys", "time"],
        command: "sys time",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // displays the time-server setting.
      {
        commandPath: ["sys", "time", "show"],
        command: "sys time show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // queries the time server now.
      {
        commandPath: ["sys", "time", "inquire"],
        command: "sys time inquire",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // sets the time server domain.
      {
        commandPath: ["sys", "time", "server"],
        command: "sys time server",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // sets the NTP request interface.
      {
        commandPath: ["sys", "time", "wan"],
        command: "sys time wan",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // sets the time zone.
      {
        commandPath: ["sys", "time", "zone"],
        command: "sys time zone",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // pseudo time mode.
      {
        commandPath: ["sys", "time", "pseudo"],
        command: "sys time pseudo",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "sys dashboard",
    [
      // live-verified bare query (unchanged).
      {
        commandPath: ["sys", "dashboard"],
        command: "sys dashboard",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // shows each dashboard item state.
      {
        commandPath: ["sys", "dashboard", "show"],
        command: "sys dashboard show",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // shows/hides dashboard sections.
      {
        commandPath: ["sys", "dashboard", "set"],
        command: "sys dashboard -<section> <1/0>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "sys max_session",
    [
      // live-verified bare query (unchanged).
      {
        commandPath: ["sys", "max_session"],
        command: "sys max_session",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // sets the session ceiling (applied after reboot).
      {
        commandPath: ["sys", "max_session", "set"],
        command: "sys max_session <300K/500K/1000K>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
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
      // rawLine 7027: binds a MAC to the second-subnet DHCP pool.
      {
        commandPath: ["srv", "dhcp", "public", "add"],
        command: "srv dhcp public add",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 7028: removes one MAC (or all) from the second-subnet pool.
      {
        commandPath: ["srv", "dhcp", "public", "del"],
        command: "srv dhcp public del",
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
  // S2 (`IMPLEMENTATION.md`, `BACKLOG.md` "Tracked follow-up" 2026-09-13):
  // these four headings each already had a single, whole-heading
  // `"sibling-live-verified"` `"read"` entry (`src/domains/ip.ts` /
  // `wan.ts`, root audit 2026-09-13) covering only their query sub-forms,
  // with the heading's real mutating sub-forms narrowed out entirely (no
  // manifest representation). Same split mechanism as `sys cfg`/
  // `mngt rmtcfg`/`linux` above: the read sub-form keeps the original id/
  // classification/basis (its `commandPath` slugifies back to the same id,
  // e.g. `["ip","arp"]` -> `cli.ip.arp`), and each genuinely mutating
  // sub-form documented in `cli-reference-raw.txt`'s Syntax block gets its
  // own new, accurately classified entry citing the same shared heading.
  [
    "ip arp",
    [
      // rawLine 1097 `ip arp status` (+ 1098 `ip arp accept status`) --
      // unchanged id/classification/basis from the prior whole-heading entry.
      {
        commandPath: ["ip", "arp"],
        command: "ip arp",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // rawLine 1094: adds a new static ARP entry.
      {
        commandPath: ["ip", "arp", "add"],
        command: "ip arp add",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1095: removes a static ARP entry.
      {
        commandPath: ["ip", "arp", "del"],
        command: "ip arp del",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1096: clears the ARP cache.
      {
        commandPath: ["ip", "arp", "flush"],
        command: "ip arp flush",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1098: accept/reject illegal source/dest MAC, VRRP MAC (0..7).
      {
        commandPath: ["ip", "arp", "accept"],
        command: "ip arp accept",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1099: ARP cache lifetime (10..2550 s).
      {
        commandPath: ["ip", "arp", "setcachelife"],
        command: "ip arp setCacheLife",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "ip route",
    [
      // rawLine 1315 `ip route status` -- unchanged id/classification/basis.
      {
        commandPath: ["ip", "route"],
        command: "ip route",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // rawLine 1313: adds a static route.
      {
        commandPath: ["ip", "route", "add"],
        command: "ip route add",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1314: removes a static route.
      {
        commandPath: ["ip", "route", "del"],
        command: "ip route del",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1316: displays the CNC network IP range.
      {
        commandPath: ["ip", "route", "cnc"],
        command: "ip route cnc",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1317: displays the China Telecom network IP range.
      {
        commandPath: ["ip", "route", "tel"],
        command: "ip route tel",
        classification: "read",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1318: configures the default route (`add/del/off/?`).
      // Destructive: `del`/`off` remove the default route, which cuts WAN
      // reachability (including the management session itself).
      {
        commandPath: ["ip", "route", "default"],
        command: "ip route default",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1319 + 1340-1342: "Clean all of the route settings" --
      // destructive (wipes every static route).
      {
        commandPath: ["ip", "route", "clean"],
        command: "ip route clean",
        classification: "destructive",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "ip session",
    [
      // rawLine 1450/1451 `ip session status`/`show` -- unchanged
      // id/classification/basis.
      {
        commandPath: ["ip", "session"],
        command: "ip session",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // rawLine 1446: turns on the per-IP session limit.
      {
        commandPath: ["ip", "session", "on"],
        command: "ip session on",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1447: turns off the per-IP session limit.
      {
        commandPath: ["ip", "session", "off"],
        command: "ip session off",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1454: adds an IP range session-limit entry.
      {
        commandPath: ["ip", "session", "add"],
        command: "ip session add",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1454: removes an IP range session-limit entry.
      {
        commandPath: ["ip", "session", "del"],
        command: "ip session del",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1448: default per-IP session limit.
      {
        commandPath: ["ip", "session", "default"],
        command: "ip session default",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1449: default per-IP P2P session limit.
      {
        commandPath: ["ip", "session", "defaultp2p"],
        command: "ip session defaultp2p",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1452: session block timer (seconds).
      {
        commandPath: ["ip", "session", "timer"],
        command: "ip session timer",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1453: blocks Internet access for one IP.
      {
        commandPath: ["ip", "session", "block"],
        command: "ip session block",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 1453: unblocks Internet access for one IP.
      {
        commandPath: ["ip", "session", "unblock"],
        command: "ip session unblock",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
  [
    "wan detect",
    [
      // rawLine 10937 `wan detect status` -- unchanged id/classification/basis.
      {
        commandPath: ["wan", "detect"],
        command: "wan detect",
        classification: "read",
        classificationBasis: "sibling-live-verified",
      },
      // rawLine 10925: sets a WAN's detection mode.
      {
        commandPath: ["wan", "detect", "mode"],
        command: "wan detect <wan1/wan2/...> <on/off/strict/always_on>",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 10928: primary ping target.
      {
        commandPath: ["wan", "detect", "target"],
        command: "wan detect target",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 10929: secondary ping target.
      {
        commandPath: ["wan", "detect", "target2"],
        command: "wan detect target2",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 10930: use gateway as ping target.
      {
        commandPath: ["wan", "detect", "target_gw"],
        command: "wan detect target_gw",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 10934: ping TTL.
      {
        commandPath: ["wan", "detect", "ttl"],
        command: "wan detect ttl",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 10935: ping interval.
      {
        commandPath: ["wan", "detect", "interval"],
        command: "wan detect interval",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
      // rawLine 10936: ping retry count.
      {
        commandPath: ["wan", "detect", "retry"],
        command: "wan detect retry",
        classification: "write",
        classificationBasis: "documented-syntax",
      },
    ],
  ],
]);
