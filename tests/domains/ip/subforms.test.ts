import {
  ipBandwidth,
  ipBindmac,
  ipDhcpc,
  ipIgmpProxySyslog,
  ipIgmpProxyVersion,
  ipPing,
} from "../../../src/domains/ip.js";
import { parsePing } from "../../../src/internal/parsers/ip/ping.js";
import { describeOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: ipDhcpc,
  classification: "write",
  valid: [
    [{ action: "option" }, "ip dhcpc option"],
    [{ action: "optionHelp" }, "ip dhcpc option -h"],
    [{ action: "optionList" }, "ip dhcpc option -l"],
    [{ action: "optionRemoveAll" }, "ip dhcpc option -r"],
    [{ action: "optionDelete", index: 2 }, "ip dhcpc option -d 2"],
    [{ action: "optionUpdate", index: 3 }, "ip dhcpc option -u 3"],
    [
      { action: "setOption", enabled: true, wanNumber: 1, optionNumber: 18, value: "/path1" },
      "ip dhcpc option -e 1 -w 1 -c 18 -v /path1",
    ],
    [
      {
        action: "setOption",
        enabled: false,
        wanNumber: 2,
        optionNumber: 18,
        value: "2f70617468",
        valueType: "hex",
      },
      "ip dhcpc option -e 0 -w 2 -c 18 -x 2f70617468",
    ],
    [
      {
        action: "setOption",
        enabled: true,
        wanNumber: 3,
        optionNumber: 6,
        value: "8.8.8.8",
        valueType: "address",
      },
      "ip dhcpc option -e 1 -w 3 -c 6 -a 8.8.8.8",
    ],
  ],
  invalid: [
    [{ action: "optionDelete", index: 0 }, /index must be a positive integer/],
    [
      {
        action: "setOption",
        enabled: true,
        wanNumber: 1,
        optionNumber: 1,
        value: "x",
        valueType: "raw",
      },
      /valueType/,
    ],
  ],
});

describeOperation({
  operation: ipPing,
  classification: "read",
  valid: [
    [
      { targetIp: "172.16.3.229", wanInterface: "WAN1", sourceIp: "192.168.1.1" },
      "ip ping 172.16.3.229 WAN1 192.168.1.1",
    ],
  ],
  invalid: [
    [{ targetIp: "172.16.3.229", sourceIp: "192.168.1.1" }, /sourceIp requires wanInterface/],
    [{ targetIp: "172.16.3.229", wanInterface: "AUTO", sourceIp: "x" }, /sourceIp/],
  ],
  sampleOutput: "Receive reply from 172.16.3.229, time=0ms\n",
  expectedParse: parsePing("Receive reply from 172.16.3.229, time=0ms\n"),
});

describeOperation({
  operation: ipIgmpProxyVersion,
  classification: "write",
  valid: [
    [{}, "ip igmp_proxy version"],
    [{ version: "v3" }, "ip igmp_proxy version v3"],
  ],
});

describeOperation({
  operation: ipIgmpProxySyslog,
  classification: "write",
  valid: [
    [{}, "ip igmp_proxy syslog"],
    [{ enabled: true }, "ip igmp_proxy syslog 1"],
  ],
});

describeOperation({
  operation: ipBandwidth,
  classification: "write",
  valid: [
    [{ action: "state", enabled: false }, "ip bandwidth off"],
    [{ action: "state", enabled: true }, "ip bandwidth on"],
  ],
});

describeOperation({
  operation: ipBindmac,
  classification: "write",
  valid: (["on", "off", "strict_on", "strict_off"] as const).map(
    (mode) => [{ action: "mode", mode }, `ip bindmac ${mode}`] as const,
  ),
});
