import {
  ipArpAccept,
  ipArpAdd,
  ipArpDel,
  ipArpFlush,
  ipArpSetCacheLife,
} from "../../../src/domains/ip.js";
import { describeOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: ipArpAdd,
  classification: "write",
  valid: [
    [
      { ipv4Address: "192.168.100.100", mac: "AA:BB:CC:DD:EE:FF", direction: "WAN" },
      "ip arp add 192.168.100.100 AA:BB:CC:DD:EE:FF WAN",
    ],
  ],
  invalid: [
    [{ ipv4Address: "not-an-ip", mac: "AA:BB:CC:DD:EE:FF", direction: "LAN" }, /ipv4Address/],
    [{ ipv4Address: "192.168.1.1", mac: "AA-BB-CC-DD-EE-FF", direction: "LAN" }, /mac/],
    [{ ipv4Address: "192.168.1.1", mac: "AA:BB:CC:DD:EE:FF", direction: "DMZ" }, /direction/],
  ],
});

describeOperation({
  operation: ipArpDel,
  classification: "write",
  valid: [[{ ipv4Address: "192.168.1.10", direction: "LAN" }, "ip arp del 192.168.1.10 LAN"]],
  invalid: [[{ ipv4Address: "192.168.1.300", direction: "LAN" }, /ipv4Address/]],
});

describeOperation({
  operation: ipArpFlush,
  classification: "write",
  valid: [[undefined, "ip arp flush"]],
});

describeOperation({
  operation: ipArpAccept,
  classification: "write",
  valid: [
    [{ mode: 0 }, "ip arp accept 0"],
    [{ mode: 7 }, "ip arp accept 7"],
  ],
  invalid: [
    [{ mode: 8 }, /mode must be between 0 and 7/],
    [{ mode: 1.5 }, /mode must be an integer/],
  ],
});

describeOperation({
  operation: ipArpSetCacheLife,
  classification: "write",
  valid: [
    [{ seconds: 10 }, "ip arp setCacheLife 10"],
    [{ seconds: 2550 }, "ip arp setCacheLife 2550"],
  ],
  invalid: [
    [{ seconds: 5 }, /between 10 and 2550/],
    [{ seconds: 2560 }, /between 10 and 2550/],
    [{ seconds: 15 }, /multiple of 10/],
  ],
});
