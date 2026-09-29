import { ddnsSetUpdate } from "../../../src/domains/ddns.js";
import { ipfRule, ipfSet, ipfSetRule } from "../../../src/domains/ipf.js";
import { srvDhcpPublicAdd, srvDhcpPublicDel } from "../../../src/domains/srv.js";
import { describeOperation, registryOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: ipfSet,
  classification: "write",
  valid: [
    [{ action: "view" }, "ipf set -v"],
    [{ action: "filterSetView", setNo: 2 }, "ipf set 2 -v"],
    [{ action: "filterSetComment", setNo: 2, comment: "branch" }, "ipf set 2 -m branch"],
    [{ action: "filterSetNext", setNo: 2, nextSetNo: 3 }, "ipf set 2 -n 3"],
  ],
  invalid: [
    [{ action: "filterSetView", setNo: 51 }, /setNo/],
    [{ action: "filterSetComment", setNo: 2, comment: "two words" }, /comment/],
  ],
});

describeOperation({
  operation: ipfRule,
  classification: "write",
  valid: [
    [
      {
        setNo: 3,
        ruleNo: 1,
        action: "configure",
        options: [
          { flag: "e", values: [1] },
          { flag: "I", values: ["e", "LAN1"] },
        ],
      },
      'ipf rule 3 1 -e 1 -I "e LAN1"',
    ],
    [
      {
        setNo: 3,
        ruleNo: 1,
        action: "configure",
        options: [
          { flag: "s", values: ["u", 0, "192.168.1.10", "255.255.255.0"] },
          { flag: "S", values: ["o", 1] },
          { flag: "L", values: [1, 100] },
          { flag: "U", values: ["up"] },
        ],
      },
      'ipf rule 3 1 -s "u 0 192.168.1.10 255.255.255.0" -S "o 1" -L 1 100 -U "up"',
    ],
  ],
  invalid: [
    [{ setNo: 3, ruleNo: 1, action: "configure", options: [] }, /at least one rule option/],
    [{ setNo: 3, ruleNo: 1, action: "configure", options: [{ flag: "Z" }] }, /flag/],
    [
      { setNo: 3, ruleNo: 1, action: "configure", options: [{ flag: "M", values: ["a b"] }] },
      /-M value #1/,
    ],
  ],
});

describeOperation({
  operation: ipfSetRule,
  classification: "write",
  valid: [
    [
      {
        setNo: 2,
        ruleNo: 1,
        options: [
          { flag: "e", values: [1] },
          { flag: "D", values: [0] },
        ],
      },
      "ipf set 2 rule 1 -e 1 -D 0",
    ],
    [{ setNo: 2, ruleNo: 1, options: [{ flag: "v" }] }, "ipf set 2 rule 1 -v"],
  ],
  invalid: [[{ setNo: 2, ruleNo: 31, options: [{ flag: "v" }] }, /ruleNo/]],
});

describeOperation({
  operation: ddnsSetUpdate,
  classification: "write",
  valid: [
    [{ accountIndex: 1, enabled: true }, "ddns set -i 1 -E 1"],
    [
      {
        accountIndex: 1,
        serviceProvider: 6,
        serviceType: 1,
        domain: { hostName: "hostname", subDomain: "dnsalias.net" },
        loginName: "user1",
        password: "pwd1",
      },
      'ddns set -i 1 -S 6 -T 1 -D "hostname dnsalias.net" -L user1 -P pwd1',
    ],
    [
      {
        accountIndex: 2,
        wanInterface: 1,
        wildcards: true,
        backupMx: false,
        mailExtender: "mx.example",
        realWanIp: 1,
        providerHost: "dyn.example",
        serviceApi: "/update",
        authType: 0,
        connectionType: 1,
        serverResponse: "good",
      },
      "ddns set -i 2 -W 1 -C 1 -B 0 -M mx.example -R 1 -H dyn.example -A /update -a 0 -N 1 -O good",
    ],
  ],
  invalid: [
    [{ accountIndex: 1 }, /at least one setting/],
    [{ accountIndex: 7, enabled: true }, /accountIndex/],
    [{ accountIndex: 1, wanInterface: 15 }, /wanInterface/],
    [{ accountIndex: 1, password: "p".repeat(25) }, /at most 24 characters/],
  ],
});

describeOperation({
  operation: srvDhcpPublicAdd,
  classification: "write",
  valid: [[{ mac: "00-1D-AA-11-22-33" }, "srv dhcp public add 00-1D-AA-11-22-33"]],
  invalid: [[{ mac: "00:1D:AA:11:22:33" }, /XX-XX-XX-XX-XX-XX/]],
});

describeOperation({
  operation: srvDhcpPublicDel,
  classification: "write",
  valid: [
    [{ mac: "00-1D-AA-11-22-33" }, "srv dhcp public del 00-1D-AA-11-22-33"],
    [{ mac: "all" }, "srv dhcp public del all"],
  ],
});

describeOperation({
  operation: registryOperation<Record<string, unknown>>("cli.radius.client.add"),
  classification: "write",
  valid: [
    [
      {
        index: 1,
        ipv4Address: "192.168.1.1",
        ipv4Mask: "255.255.255.0",
        ipv6Prefix: "2001:cc::1",
        ipv6PrefixLength: 64,
        secret: "123",
      },
      "radius client add 1 -i 192.168.1.1 -m 255.255.255.0 -p 2001:cc::1 -l 64 -s 123",
    ],
  ],
});

describeOperation({
  operation: registryOperation<{ args: readonly string[] }>("cli.dos"),
  classification: "write",
  valid: [
    "-P add4 192.168.1.10",
    "-P remove4 all",
    "-P add6 2001:db8::1",
    "-P show",
    "-B add4 203.0.113.5",
    "-B show",
    "-f 1",
    "-i 2",
  ].map((args) => [{ args: args.split(" ") }, `dos ${args}`] as const),
});
