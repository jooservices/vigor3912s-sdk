/**
 * Operations for fw 4.4.7_RC2 commands that are absent from the Part VIII PDF;
 * syntax from the router's own `?` help (`references/live-help-fw-4.4.7_RC2.txt`).
 */

import * as fs from "../../../src/domains/fs.js";
import * as ip from "../../../src/domains/ip.js";
import * as ipf from "../../../src/domains/ipf.js";
import * as mngt from "../../../src/domains/mngt.js";
import * as qos from "../../../src/domains/qos.js";
import * as show from "../../../src/domains/show.js";
import * as sys from "../../../src/domains/sys.js";
import * as usb from "../../../src/domains/usb.js";
import * as vlan from "../../../src/domains/vlan.js";
import * as vpn from "../../../src/domains/vpn.js";
import * as wan from "../../../src/domains/wan.js";
import { describeOperation } from "../../support/operation-cases.js";

const KEY = "yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=";

// fs
describeOperation({
  operation: fs.fsFormat,
  classification: "destructive",
  valid: [[undefined, "fs format"]],
});
describeOperation({
  operation: fs.fsRm,
  classification: "destructive",
  valid: [
    [{ path: "readMe.txt" }, "fs rm readMe.txt"],
    [{ path: "readMe.txt", directory: "/" }, 'fs rm readMe.txt "/"'],
  ],
  invalid: [
    [{ path: "a b" }, /single path token/],
    [{ path: 'x"y' }, /single path token/],
  ],
});
for (const [operation, verb, classification] of [
  [fs.fsMkfile, "mkfile", "write"],
  [fs.fsMkdir, "mkdir", "write"],
  [fs.fsCd, "cd", "write"],
  [fs.fsCat, "cat", "read"],
  [fs.fsTest, "test", "write"],
] as const) {
  describeOperation({
    operation,
    classification,
    valid: [[{ path: "vigor/readMe.txt" }, `fs ${verb} vigor/readMe.txt`]],
    invalid: [[{ path: "" }, /single path token/]],
  });
}
describeOperation({
  operation: fs.fsRen,
  classification: "write",
  valid: [[{ source: "old.txt", target: "new.txt" }, "fs ren old.txt new.txt"]],
});
describeOperation({
  operation: fs.fsCp,
  classification: "write",
  valid: [[{ source: "a.txt", target: "b.txt" }, "fs cp a.txt b.txt"]],
  invalid: [[{ source: "a.txt", target: "b c" }, /target/]],
});

// vpn
describeOperation({
  operation: vpn.vpnUdp,
  classification: "write",
  valid: [
    [
      { action: "add", remoteIp: "1.2.3.4", remotePort: 5555, localPort: 6666 },
      "vpn udp add 1.2.3.4 5555 6666",
    ],
    [
      { action: "del", remoteIp: "1.2.3.4", remotePort: 5555, localPort: 6666 },
      "vpn udp del 1.2.3.4 5555 6666",
    ],
    [
      { action: "set", serverIp: "1.2.3.4", serverPort: 8888, enabled: true },
      "vpn udp set 1.2.3.4 8888 enable",
    ],
    [{ action: "clear", host: "udp.aabbccdd.local" }, "vpn udp clear udp.aabbccdd.local"],
  ],
  invalid: [
    [{ action: "clear", host: "evil.example" }, /udp.<DeviceID>.local/],
    [{ action: "add", remoteIp: "1.2.3.4", remotePort: 0, localPort: 1 }, /remotePort/],
  ],
});
describeOperation({
  operation: vpn.vpnPassApm,
  classification: "write",
  valid: [[{ enabled: true }, "vpn passAPM on"]],
});
describeOperation({
  operation: vpn.vpnDpdkctrlDump,
  classification: "read",
  valid: [
    [{ table: "sp" }, 'vpn dpdkctrl "sp dump"'],
    [{ table: "sa" }, 'vpn dpdkctrl "sa dump"'],
  ],
});
describeOperation({
  operation: vpn.vpnDpdkctrlFlush,
  classification: "destructive",
  valid: [[{ table: "sa" }, 'vpn dpdkctrl "sa flush"']],
  invalid: [[{ table: "rt" }, /table/]],
});
describeOperation({
  operation: vpn.vpnDpdkctrlSet,
  classification: "write",
  valid: [
    [{ feature: "pptp", enabled: false }, "vpn dpdkctrl pptp off"],
    [{ feature: "wireguard", enabled: true }, "vpn dpdkctrl wireguard on"],
    [{ feature: "fastroute", mode: "subnet_all" }, "vpn dpdkctrl fastroute subnet_all"],
  ],
});
describeOperation({
  operation: vpn.vpnWgShow,
  classification: "read",
  valid: [[undefined, "vpn wg show"]],
});
describeOperation({
  operation: vpn.vpnWgEnable,
  classification: "write",
  valid: [[{ enabled: false }, "vpn wg enable off"]],
});
describeOperation({
  operation: vpn.vpnWgInterface,
  classification: "write",
  valid: [
    [{ listenPort: 51820, address: "10.0.0.1/24" }, "vpn wg interface 51820 10.0.0.1/24"],
    [
      { listenPort: 51820, address: "10.0.0.1/24", mtu: 1420 },
      "vpn wg interface 51820 10.0.0.1/24 1420",
    ],
  ],
  invalid: [[{ listenPort: 51820, address: "10.0.0.1/24", mtu: 100 }, /mtu/]],
});
describeOperation({
  operation: vpn.vpnWgKeyGen,
  classification: "destructive",
  valid: [[undefined, "vpn wg key gen"]],
});
describeOperation({
  operation: vpn.vpnWgKeySet,
  classification: "destructive",
  valid: [[{ privateKey: KEY }, `vpn wg key set ${KEY}`]],
  invalid: [[{ privateKey: "not-a-key" }, /base64 WireGuard key/]],
});
describeOperation({
  operation: vpn.vpnWgPeer,
  classification: "write",
  valid: [
    [{ index: 1, action: "pubkey", key: KEY }, `vpn wg peer 1 pubkey ${KEY}`],
    [{ index: 1, action: "psk", key: KEY }, `vpn wg peer 1 psk ${KEY}`],
    [
      { index: 1, action: "allowedIps", allowedIps: "10.0.0.2/32" },
      "vpn wg peer 1 allowed-ips 10.0.0.2/32",
    ],
    [{ index: 1, action: "keepalive", seconds: 25 }, "vpn wg peer 1 keepalive 25"],
    [{ index: 1, action: "clear" }, "vpn wg peer 1 clear"],
  ],
});

// mngt
for (const [operation, command] of [
  [mngt.mngtSshOldKex, "mngt ssh_oldkex"],
  [mngt.mngtNoSecureL2tpMngt, "mngt NoSecureL2TPMngt"],
  [mngt.mngtValidationCode, "mngt ValidationCode"],
] as const) {
  describeOperation({
    operation,
    classification: "write",
    valid: [
      [{ enabled: true }, `${command} enable`],
      [{ enabled: false }, `${command} disable`],
    ],
  });
}
describeOperation({
  operation: mngt.mngtLbInterface,
  classification: "write",
  valid: [
    [{ action: "on" }, "mngt lb_interface on"],
    [{ action: "off" }, "mngt lb_interface off"],
    [{ action: "lan", lan: 3 }, "mngt lb_interface lan 3"],
  ],
  invalid: [[{ action: "lan", lan: 101 }, /lan/]],
});
describeOperation({
  operation: mngt.mngtLbInterfaceStatus,
  classification: "read",
  valid: [[undefined, "mngt lb_interface status"]],
});

// wan
describeOperation({
  operation: wan.wanDpdkPort,
  classification: "write",
  valid: [[{ wanNo: 1, portId: 2 }, "wan dpdk-port 1 2"]],
});
describeOperation({
  operation: wan.wanDrop,
  classification: "destructive",
  valid: [[{ wanInterface: "wan2" }, "wan drop wan2"]],
  invalid: [[{ wanInterface: "wan0" }, /wanInterface/]],
});
describeOperation({
  operation: wan.wanDetect2,
  classification: "write",
  valid: [
    [
      {
        settings: [
          { flag: "w", value: 1 },
          { flag: "t", value: 1 },
          { flag: "i", value: "8.8.8.8" },
          { flag: "v", value: 5 },
        ],
      },
      "wan detect2 -w 1 -t 1 -i 8.8.8.8 -v 5",
    ],
    [{ settings: [{ flag: "b", value: 1 }] }, "wan detect2 -b 1"],
  ],
  invalid: [
    [{ settings: [] }, /at least one flag/],
    [{ settings: [{ flag: "t", value: 3 }] }, /-t must be between 0 and 2/],
    [{ settings: [{ flag: "i", value: "x" }] }, /-i/],
    [{ settings: [{ flag: "z", value: 1 }] }, /flag must be one of/],
  ],
});
describeOperation({
  operation: wan.wanDetect2Show,
  classification: "read",
  valid: [[undefined, "wan detect2 -s"]],
});
describeOperation({
  operation: wan.wanDetect2Result,
  classification: "read",
  valid: [[undefined, "wan detect2 -u"]],
});
describeOperation({
  operation: wan.wanLbWeight,
  classification: "write",
  valid: [
    [
      {
        settings: [
          { flag: "u", value: 3 },
          { flag: "t", value: 0 },
        ],
      },
      "wan lbweight -u 3 -t 0",
    ],
  ],
  invalid: [[{ settings: [{ flag: "d", value: 4 }] }, /-d must be between 1 and 3/]],
});
describeOperation({
  operation: wan.wanLbWeightStatus,
  classification: "read",
  valid: [[undefined, "wan lbweight -s"]],
});
describeOperation({
  operation: wan.wanVoipDetect,
  classification: "write",
  valid: [
    [{ option: "enable", enabled: true }, "wan voipdect -e 1"],
    [{ option: "threshold", mos: 3.5 }, "wan voipdect -t 3.5"],
    [{ option: "better", mos: 0.3 }, "wan voipdect -b 0.3"],
    [{ option: "debugWan", wan: 2 }, "wan voipdect -d 2"],
  ],
  invalid: [
    [{ option: "threshold", mos: 4.5 }, /mos must be between 2 and 4/],
    [{ option: "better", mos: 0 }, /mos must be between 0.1 and 1/],
  ],
});
describeOperation({
  operation: wan.wanVoipDetectView,
  classification: "read",
  valid: [[undefined, "wan voipdect -v"]],
});
describeOperation({
  operation: wan.wanVoipDetectRtp,
  classification: "read",
  valid: [[undefined, "wan voipdect -i"]],
});
describeOperation({
  operation: wan.wanPhymodeStatus,
  classification: "read",
  valid: [[undefined, "wan phymode status"]],
});
describeOperation({
  operation: wan.wanPhymode,
  classification: "destructive",
  valid: [[{ wanNo: 2, mode: 0 }, "wan phymode 2 0"]],
  invalid: [[{ wanNo: 2, mode: 1 }, /mode/]],
});

// sys
describeOperation({
  operation: sys.sysPwenc,
  classification: "write",
  valid: [[{ enabled: true }, "sys pwenc -e 1"]],
});
describeOperation({
  operation: sys.sysCon2tel,
  classification: "write",
  valid: [[undefined, "sys con2tel enable"]],
});
describeOperation({
  operation: sys.sysMpage,
  classification: "write",
  valid: [[{ enabled: false }, "sys mpage disable"]],
});
describeOperation({
  operation: sys.sysIpfixNetflowStatus,
  classification: "read",
  valid: [[undefined, "sys ipfix_netflow status"]],
});
describeOperation({
  operation: sys.sysIpfixNetflow,
  classification: "write",
  valid: [
    [{ setting: "enable", enabled: true }, "sys ipfix_netflow enable 1"],
    [
      { setting: "collector_ip", address: "192.168.1.10" },
      "sys ipfix_netflow collector_ip 192.168.1.10",
    ],
    [{ setting: "collector_port", port: 4739 }, "sys ipfix_netflow collector_port 4739"],
    [{ setting: "collector_proto", protocol: "TCP" }, "sys ipfix_netflow collector_proto TCP"],
    [{ setting: "version", version: 10 }, "sys ipfix_netflow version 10"],
    [{ setting: "inactive_timeout", seconds: 15 }, "sys ipfix_netflow inactive_timeout 15"],
    [{ setting: "active_timeout", seconds: 300 }, "sys ipfix_netflow active_timeout 300"],
  ],
  invalid: [
    [{ setting: "version", version: 8 }, /version/],
    [{ setting: "collector_ip", address: "host name" }, /address/],
  ],
});

// ip / ipf / qos / show / usb / vlan
describeOperation({
  operation: ip.ipIgmpFl,
  classification: "write",
  valid: [[{ enabled: true }, "ip igmp_fl enable"]],
});
describeOperation({
  operation: ip.ipIgmpFlStatus,
  classification: "read",
  valid: [[undefined, "ip igmp_fl status"]],
});
describeOperation({
  operation: ipf.ipfDefault,
  classification: "destructive",
  valid: [[undefined, "ipf default"]],
});
describeOperation({
  operation: ipf.ipfHashAnalysis,
  classification: "read",
  valid: [
    [{ view: "summary" }, "ipf hash_analysis summary"],
    [{ view: "total" }, "ipf hash_analysis total"],
    [{ view: "threshold", hashCounts: 8 }, "ipf hash_analysis threshold 8"],
    [{ view: "interval", begin: 150, end: 450 }, "ipf hash_analysis interval 150 450"],
    [{ view: "detail", begin: 60, end: 150 }, "ipf hash_analysis detail 60 150"],
  ],
  invalid: [[{ view: "detail", begin: 200, end: 100 }, /end must be between 200 and 8191/]],
});
describeOperation({
  operation: qos.qosSetdefault,
  classification: "destructive",
  valid: [[undefined, "qos setdefault"]],
});
describeOperation({
  operation: show.showPing,
  classification: "read",
  valid: [
    [{}, "show ping"],
    [{ wan: "wan1" }, "show ping wan1"],
    [{ wan: "wan12", daily: true }, "show ping wan12 daily"],
  ],
  invalid: [[{ wan: "wan13" }, /wan must match/]],
});
describeOperation({
  operation: usb.usbFtpUsage,
  classification: "read",
  valid: [[undefined, "usb FTPusage"]],
});
describeOperation({
  operation: vlan.vlanMap,
  classification: "read",
  valid: [[undefined, "vlan map"]],
});
