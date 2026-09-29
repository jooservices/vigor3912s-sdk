/** Live-firmware-recon CLI rows (commands absent from the Part VIII PDF). */

import type { CliCapabilityEntry } from "../../src/manifest/types.js";

import { slugifyCommandPath } from "./cli-corpus.ts";

/**
 * CLI commands live-verified on firmware 4.4.7_RC2 that are absent from the
 * Part VIII PDF corpus (`ARCHITECTURE.md` amendment 2026-09-13, Citation
 * corpus `live-firmware-recon`). `evidenceRef` is a location pointer only
 * (sibling registry path + command id) — never embedded output. Consulted as
 * static evidence; never a runtime dependency on vigor3912s-mcp.
 */
interface LiveFirmwareReconCommand {
  /**
   * Explicit id, only when `cli.<commandPath>` would collide with a Part VIII
   * heading id (a live-only bare form of a documented heading).
   */
  readonly id?: string;
  readonly commandPath: readonly string[];
  readonly command: string;
  readonly classification: "read" | "write" | "destructive";
  /** Defaults to `sibling-live-verified` (MCP e2e); owner `?` captures use `live-help-syntax`. */
  readonly basis?: "sibling-live-verified" | "live-help-syntax";
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
  // Bare forms of documented headings. Evidence level: the sibling e2e run
  // passed with non-empty output; the output itself was not captured, so the
  // operations return raw text and assume no structure.
  {
    id: "cli.ddns.show.all",
    commandPath: ["ddns", "show"],
    command: "ddns show",
    classification: "read",
    evidenceRef:
      "vigor3912s-mcp/recon-output/e2e-passed.json#ddns_show (e2e passed, non-empty output, shape not captured)",
  },
  {
    id: "cli.ip.session.list",
    commandPath: ["ip", "session"],
    command: "ip session",
    classification: "read",
    evidenceRef:
      "vigor3912s-mcp/recon-output/e2e-passed.json#ip_session (e2e passed, non-empty output, shape not captured)",
  },
  {
    id: "cli.local8021x.cerset",
    commandPath: ["local_8021x", "cer_set"],
    command: "local_8021x cer_set <UID>",
    classification: "write",
    evidenceRef:
      "references/live-help-fw-4.4.7_RC2.txt#local_8021x (fw help: `local_8021x cer_set [UID]`)",
  },
  {
    id: "cli.local8021x.showlocalcer",
    commandPath: ["local_8021x", "show_local_cer"],
    command: "local_8021x show_local_cer",
    classification: "read",
    evidenceRef:
      "references/live-help-fw-4.4.7_RC2.txt#local_8021x (fw help: lists local certificate UIDs)",
  },
  {
    commandPath: ["fs", "format"],
    command: "fs format",
    classification: "destructive",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#fs format",
  },
  {
    commandPath: ["fs", "mkfile"],
    command: "fs mkfile <file>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#fs mkfile",
  },
  {
    commandPath: ["fs", "mkdir"],
    command: "fs mkdir <dir>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#fs mkdir",
  },
  {
    commandPath: ["fs", "rm"],
    command: "fs rm <dir|file>",
    classification: "destructive",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#fs rm",
  },
  {
    commandPath: ["fs", "ren"],
    command: "fs ren <src> <dst>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#fs ren",
  },
  {
    commandPath: ["fs", "cd"],
    command: "fs cd <dir>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#fs cd",
  },
  {
    commandPath: ["fs", "cp"],
    command: "fs cp <srcFile> <dstFile>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#fs cp",
  },
  {
    commandPath: ["fs", "cat"],
    command: "fs cat <file>",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#fs cat",
  },
  {
    commandPath: ["fs", "test"],
    command: "fs test <dstFile>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#fs test",
  },
  {
    id: "cli.vpn.udp",
    commandPath: ["vpn", "udp"],
    command: "vpn udp add|del|set|clear ...",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vpn udp",
  },
  {
    id: "cli.vpn.passapm",
    commandPath: ["vpn", "passAPM"],
    command: "vpn passAPM <on/off>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vpn passAPM",
  },
  {
    id: "cli.vpn.dpdkctrl.dump",
    commandPath: ["vpn", "dpdkctrl"],
    command: 'vpn dpdkctrl "sp|sa dump"',
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vpn dpdkctrl",
  },
  {
    id: "cli.vpn.dpdkctrl.flush",
    commandPath: ["vpn", "dpdkctrl"],
    command: 'vpn dpdkctrl "sp|sa flush"',
    classification: "destructive",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vpn dpdkctrl",
  },
  {
    id: "cli.vpn.dpdkctrl.set",
    commandPath: ["vpn", "dpdkctrl"],
    command: "vpn dpdkctrl pptp|wireguard on/off, fastroute <mode>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vpn dpdkctrl",
  },
  {
    id: "cli.vpn.wg.show",
    commandPath: ["vpn", "wg"],
    command: "vpn wg show",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vpn wg",
  },
  {
    id: "cli.vpn.wg.enable",
    commandPath: ["vpn", "wg"],
    command: "vpn wg enable <on|off>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vpn wg",
  },
  {
    id: "cli.vpn.wg.interface",
    commandPath: ["vpn", "wg"],
    command: "vpn wg interface <listen_port> <wg_ip> [mtu]",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vpn wg",
  },
  {
    id: "cli.vpn.wg.keygen",
    commandPath: ["vpn", "wg"],
    command: "vpn wg key gen",
    classification: "destructive",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vpn wg",
  },
  {
    id: "cli.vpn.wg.keyset",
    commandPath: ["vpn", "wg"],
    command: "vpn wg key set <privkey_b64>",
    classification: "destructive",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vpn wg",
  },
  {
    id: "cli.vpn.wg.peer",
    commandPath: ["vpn", "wg"],
    command: "vpn wg peer <idx> pubkey|psk|allowed-ips|keepalive|clear ...",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vpn wg",
  },
  {
    id: "cli.mngt.ssholdkex",
    commandPath: ["mngt", "ssh_oldkex"],
    command: "mngt ssh_oldkex enable/disable",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#mngt ssh_oldkex",
  },
  {
    id: "cli.mngt.nosecurel2tpmngt",
    commandPath: ["mngt", "NoSecureL2TPMngt"],
    command: "mngt NoSecureL2TPMngt enable/disable",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#mngt NoSecureL2TPMngt",
  },
  {
    id: "cli.mngt.validationcode",
    commandPath: ["mngt", "ValidationCode"],
    command: "mngt ValidationCode enable/disable",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#mngt ValidationCode",
  },
  {
    id: "cli.mngt.lbinterface",
    commandPath: ["mngt", "lb_interface"],
    command: "mngt lb_interface on/off/lan <n>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#mngt lb_interface",
  },
  {
    id: "cli.mngt.lbinterface.status",
    commandPath: ["mngt", "lb_interface"],
    command: "mngt lb_interface status",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#mngt lb_interface",
  },
  {
    id: "cli.wan.dpdkport",
    commandPath: ["wan", "dpdk-port"],
    command: "wan dpdk-port <wan_no> <port_id>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan dpdk-port",
  },
  {
    id: "cli.wan.drop",
    commandPath: ["wan", "drop"],
    command: "wan drop <wan1/wan2/...>",
    classification: "destructive",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan drop",
  },
  {
    id: "cli.wan.detect2",
    commandPath: ["wan", "detect2"],
    command: "wan detect2 -w|-x|-p|-t|-i|-j|-k|-g|-d|-v|-r|-l|-b <value>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan detect2",
  },
  {
    id: "cli.wan.detect2.show",
    commandPath: ["wan", "detect2"],
    command: "wan detect2 -s",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan detect2",
  },
  {
    id: "cli.wan.detect2.result",
    commandPath: ["wan", "detect2"],
    command: "wan detect2 -u",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan detect2",
  },
  {
    id: "cli.wan.lbweight",
    commandPath: ["wan", "lbweight"],
    command: "wan lbweight -u|-d|-l|-j|-p|-t <value>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan lbweight",
  },
  {
    id: "cli.wan.lbweight.status",
    commandPath: ["wan", "lbweight"],
    command: "wan lbweight -s",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan lbweight",
  },
  {
    id: "cli.wan.voipdect",
    commandPath: ["wan", "voipdect"],
    command: "wan voipdect -e|-t|-b|-d <value>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan voipdect",
  },
  {
    id: "cli.wan.voipdect.view",
    commandPath: ["wan", "voipdect"],
    command: "wan voipdect -v",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan voipdect",
  },
  {
    id: "cli.wan.voipdect.rtp",
    commandPath: ["wan", "voipdect"],
    command: "wan voipdect -i",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan voipdect",
  },
  {
    id: "cli.wan.phymode.status",
    commandPath: ["wan", "phymode"],
    command: "wan phymode status",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan phymode",
  },
  {
    id: "cli.wan.phymode",
    commandPath: ["wan", "phymode"],
    command: "wan phymode <wan number> <mode>",
    classification: "destructive",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#wan phymode",
  },
  {
    id: "cli.sys.pwenc",
    commandPath: ["sys", "pwenc"],
    command: "sys pwenc -e <0|1>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#sys pwenc",
  },
  {
    id: "cli.sys.con2tel",
    commandPath: ["sys", "con2tel"],
    command: "sys con2tel enable",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#sys con2tel",
  },
  {
    id: "cli.sys.mpage",
    commandPath: ["sys", "mpage"],
    command: "sys mpage enable/disable",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#sys mpage",
  },
  {
    id: "cli.sys.ipfixnetflow.status",
    commandPath: ["sys", "ipfix_netflow"],
    command: "sys ipfix_netflow status",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#sys ipfix_netflow",
  },
  {
    id: "cli.sys.ipfixnetflow",
    commandPath: ["sys", "ipfix_netflow"],
    command: "sys ipfix_netflow <setting> <value>",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#sys ipfix_netflow",
  },
  {
    id: "cli.ip.igmpfl",
    commandPath: ["ip", "igmp_fl"],
    command: "ip igmp_fl enable/disable",
    classification: "write",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#ip igmp_fl",
  },
  {
    id: "cli.ip.igmpfl.status",
    commandPath: ["ip", "igmp_fl"],
    command: "ip igmp_fl status",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#ip igmp_fl",
  },

  {
    id: "cli.ipf.default",
    commandPath: ["ipf", "default"],
    command: "ipf default",
    classification: "destructive",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#ipf default",
  },
  {
    id: "cli.ipf.hashanalysis",
    commandPath: ["ipf", "hash_analysis"],
    command: "ipf hash_analysis summary|total|threshold|interval|detail ...",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#ipf hash_analysis",
  },
  {
    id: "cli.qos.setdefault",
    commandPath: ["qos", "setdefault"],
    command: "qos setdefault",
    classification: "destructive",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#qos setdefault",
  },
  {
    id: "cli.show.ping",
    commandPath: ["show", "ping"],
    command: "show ping [wan1~wan12] [daily]",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#show ping",
  },
  {
    id: "cli.usb.ftpusage",
    commandPath: ["usb", "FTPusage"],
    command: "usb FTPusage",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#usb FTPusage",
  },
  {
    id: "cli.vlan.map",
    commandPath: ["vlan", "map"],
    command: "vlan map",
    classification: "read",
    basis: "live-help-syntax",
    evidenceRef: "references/live-help-fw-4.4.7_RC2.txt#vlan map",
  },
  {
    commandPath: ["radius", "show_local_cer"],
    command: "radius show_local_cer",
    classification: "read",
    evidenceRef: "vigor3912s-mcp/src/commands/registry/families/radius.ts#radius_show_local_cer",
  },
];

export function buildLiveFirmwareReconEntries(): readonly CliCapabilityEntry[] {
  return LIVE_FIRMWARE_RECON_COMMANDS.map((row) => {
    const id = row.id ?? `cli.${slugifyCommandPath(row.commandPath)}`;
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
      classificationBasis: row.basis ?? "sibling-live-verified",
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
