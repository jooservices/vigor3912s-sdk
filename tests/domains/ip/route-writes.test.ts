import {
  ipRouteAdd,
  ipRouteClean,
  ipRouteCnc,
  ipRouteDefault,
  ipRouteDel,
  ipRouteTel,
} from "../../../src/domains/ip.js";
import { describeOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: ipRouteAdd,
  classification: "write",
  valid: [
    [
      {
        dst: "172.16.2.0",
        netmask: "255.255.255.0",
        gateway: "172.16.2.4",
        ifno: 3,
        rtype: "static",
      },
      "ip route add 172.16.2.0 255.255.255.0 172.16.2.4 3 static",
    ],
  ],
  invalid: [
    [
      {
        dst: "172.16.2.0",
        netmask: "255.0.255.0",
        gateway: "172.16.2.4",
        ifno: 3,
        rtype: "static",
      },
      /contiguous netmask/,
    ],
    [
      { dst: "172.16.2.0", netmask: "255.255.255.0", gateway: "x", ifno: 3, rtype: "static" },
      /gateway/,
    ],
    [
      { dst: "172.16.2.0", netmask: "255.255.255.0", gateway: "1.1.1.1", ifno: 2, rtype: "static" },
      /ifno must be between 3 and 12/,
    ],
    [
      { dst: "172.16.2.0", netmask: "255.255.255.0", gateway: "1.1.1.1", ifno: 3, rtype: "x" },
      /rtype/,
    ],
  ],
});

describeOperation({
  operation: ipRouteDel,
  classification: "write",
  valid: [
    [
      { dst: "0.0.0.0", netmask: "0.0.0.0", rtype: "default" },
      "ip route del 0.0.0.0 0.0.0.0 default",
    ],
  ],
  invalid: [[{ dst: "0.0.0.0", netmask: "0.255.0.0", rtype: "default" }, /contiguous netmask/]],
});

describeOperation({
  operation: ipRouteCnc,
  classification: "read",
  valid: [[undefined, "ip route cnc"]],
});

describeOperation({
  operation: ipRouteTel,
  classification: "read",
  valid: [[undefined, "ip route tel"]],
});

describeOperation({
  operation: ipRouteDefault,
  classification: "destructive",
  valid: [
    [{ mode: "add" }, "ip route default add"],
    [{ mode: "off" }, "ip route default off"],
  ],
  invalid: [[{ mode: "?" }, /mode/]],
});

describeOperation({
  operation: ipRouteClean,
  classification: "destructive",
  valid: [
    [{ enabled: true }, "ip route clean 1"],
    [{ enabled: false }, "ip route clean 0"],
  ],
});
