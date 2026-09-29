import {
  ipSessionAdd,
  ipSessionBlock,
  ipSessionDefault,
  ipSessionDefaultP2p,
  ipSessionDel,
  ipSessionList,
  ipSessionOff,
  ipSessionOn,
  ipSessionTimer,
  ipSessionUnblock,
} from "../../../src/domains/ip.js";
import { describeOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: ipSessionList,
  classification: "read",
  valid: [[undefined, "ip session"]],
  sampleOutput: "Session limit: on\n",
});

describeOperation({
  operation: ipSessionOn,
  classification: "write",
  valid: [[undefined, "ip session on"]],
});
describeOperation({
  operation: ipSessionOff,
  classification: "write",
  valid: [[undefined, "ip session off"]],
});

describeOperation({
  operation: ipSessionDefault,
  classification: "write",
  valid: [
    [{ value: 100 }, "ip session default 100"],
    [{ value: 0 }, "ip session default 0"],
  ],
  invalid: [
    [{ value: -1 }, /must not be negative/],
    [{ value: 1.5 }, /must be an integer/],
  ],
});

describeOperation({
  operation: ipSessionDefaultP2p,
  classification: "write",
  valid: [[{ value: 50 }, "ip session defaultp2p 50"]],
});

describeOperation({
  operation: ipSessionTimer,
  classification: "write",
  valid: [[{ value: 30 }, "ip session timer 30"]],
});

describeOperation({
  operation: ipSessionBlock,
  classification: "write",
  valid: [[{ ipv4Address: "192.168.1.5" }, "ip session block 192.168.1.5"]],
  invalid: [[{ ipv4Address: "bad" }, /ipv4Address/]],
});

describeOperation({
  operation: ipSessionUnblock,
  classification: "write",
  valid: [[{ ipv4Address: "192.168.1.5" }, "ip session unblock 192.168.1.5"]],
});

const range = { ip1: "192.168.1.5", ip2: "192.168.1.100", num: 100, p2pNum: 50 };

describeOperation({
  operation: ipSessionAdd,
  classification: "write",
  valid: [[range, "ip session add 192.168.1.5-192.168.1.100 100 50"]],
  invalid: [
    [{ ...range, ip1: "192.168.1.200" }, /ip1 must not be greater than ip2/],
    [{ ...range, num: -1 }, /num must not be negative/],
    [{ ...range, p2pNum: 0.5 }, /p2pNum must be an integer/],
  ],
});

describeOperation({
  operation: ipSessionDel,
  classification: "write",
  valid: [[range, "ip session del 192.168.1.5-192.168.1.100 100 50"]],
});
