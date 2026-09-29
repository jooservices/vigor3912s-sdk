import { mngtCertImport, mngtIp6Iids } from "../../../src/domains/mngt.js";
import { describeOperation, registryOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: registryOperation<{ action: string }>("cli.mngt.noping"),
  classification: "write",
  valid: (["on", "off", "viewlog", "clearlog"] as const).map(
    (action) => [{ action }, `mngt noping ${action}`] as const,
  ),
  invalid: [[{ action: "reset" }, /mngt noping action/]],
});

describeOperation({
  operation: registryOperation<{ action: string; port?: number }>("cli.mngt.defenseworm"),
  classification: "write",
  valid: [
    [{ action: "on" }, "mngt defenseworm on"],
    [{ action: "off" }, "mngt defenseworm off"],
    [{ action: "add", port: 21 }, "mngt defenseworm add 21"],
    [{ action: "del", port: 21 }, "mngt defenseworm del 21"],
    [{ action: "viewlog" }, "mngt defenseworm viewlog"],
    [{ action: "clearlog" }, "mngt defenseworm clearlog"],
  ],
  invalid: [[{ action: "add", port: 70000 }, /port/]],
});

describeOperation({
  operation: registryOperation<{ args: readonly string[] }>("cli.mngt.lanaccess"),
  classification: "write",
  valid: ["-e 1 -s 1 -i 1 -I 1", "-I", "-E", "-f", "-d", "-v", "-h"].map(
    (args) => [{ args: args.split(" ") }, `mngt lanaccess ${args}`] as const,
  ),
  invalid: [[{ args: ["-z"] }, /not one of the documented flags/]],
});

describeOperation({
  operation: registryOperation<{ args: readonly string[] }>("cli.mngt.accesslist"),
  classification: "write",
  valid: ["list", "add 192.168.1.10 1 1", "remove 1", "flush"].map(
    (args) => [{ args: args.split(" ") }, `mngt accesslist ${args}`] as const,
  ),
  invalid: [[{ args: ["purge"] }, /mngt accesslist subcommand/]],
});

describeOperation({
  operation: mngtCertImport,
  classification: "write",
  valid: [
    [
      { kind: "local_cert", url: "tftp://192.168.1.10/cert.p12", password: "p12pass" },
      "mngt cert_import local_cert tftp://192.168.1.10/cert.p12 p12pass",
    ],
    [
      { kind: "trusted_ca", url: "tftp://192.168.1.10/ca.pem" },
      "mngt cert_import trusted_ca tftp://192.168.1.10/ca.pem",
    ],
  ],
});

describeOperation({
  operation: mngtIp6Iids,
  classification: "write",
  valid: [
    [{ action: "setMode", mode: 1 }, "mngt ip6_IIDs -e 1"],
    [{ action: "regenerate", iface: "LAN1" }, "mngt ip6_IIDs -r LAN1"],
    [{ action: "show" }, "mngt ip6_IIDs -s"],
  ],
});
