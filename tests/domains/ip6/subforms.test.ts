import { ip6Addr } from "../../../src/domains/ip6.js";
import { describeOperation, registryOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: ip6Addr,
  classification: "write",
  valid: [
    [
      {
        action: "updateStatic",
        oldPrefix: "2001:db8:1::",
        oldPrefixLength: 64,
        newPrefix: "2001:db8:2::",
        newPrefixLength: 64,
        interfaceLabel: "WAN1",
      },
      "ip6 addr -t 2001:db8:1:: 64 2001:db8:2:: 64 WAN1",
    ],
    [{ action: "oldPrefix", mode: 1 }, "ip6 addr -o 1"],
    [{ action: "oldPrefix", mode: 2 }, "ip6 addr -o 2"],
    [
      { action: "setOldPrefix", prefix: "2001:db8:1::", prefixLength: 64, wan: "WAN2" },
      "ip6 addr -o 3 2001:db8:1:: 64 WAN2",
    ],
    [
      { action: "addUla", prefix: "fd00:1::", prefixLength: 64, lan: "LAN1" },
      "ip6 addr -l fd00:1:: 64 LAN1",
    ],
    [
      { action: "prefixListAdd", prefix: "2001:db8:3::", prefixLength: 48, wan: "WAN1" },
      "ip6 addr -p 2001:db8:3:: 48 WAN1",
    ],
    [
      { action: "prefixListDelete", prefix: "2001:db8:3::", prefixLength: 48, wan: "WAN1" },
      "ip6 addr -b 2001:db8:3:: 48 WAN1",
    ],
    [{ action: "autoUla", lan: "LAN2" }, "ip6 addr -x LAN2"],
    [{ action: "deleteUla", lan: "LAN100" }, "ip6 addr -c LAN100"],
    [{ action: "ulaType", type: 2, lan: "LAN3" }, "ip6 addr -e 2 LAN3"],
  ],
  invalid: [
    [{ action: "oldPrefix", mode: 3 }, /mode/],
    [
      { action: "setOldPrefix", prefix: "2001:db8::", prefixLength: 64, wan: "LAN1" },
      /wan must be WAN1..WAN10/,
    ],
    [{ action: "addUla", prefix: "fd00::", prefixLength: 129, lan: "LAN1" }, /prefixLength/],
    [{ action: "autoUla", lan: "LAN101" }, /lan must be LAN1..LAN100/],
    [{ action: "ulaType", type: 3, lan: "LAN1" }, /type must be between 0 and 2/],
  ],
});

describeOperation({
  operation: registryOperation<Record<string, unknown>>("cli.ip6.lan"),
  classification: "write",
  valid: [
    [
      {
        action: "set",
        lan: 2,
        dns2: "2001:4860:4860::8844",
        management: 2,
        addExtensionWan: 3,
        deleteExtensionWan: 4,
        extensionWanBitmap: 5,
        ripng: true,
      },
      "ip6 lan -l 2 -D 2001:4860:4860::8844 -m 2 -e 3 -E 4 -b 5 -R 1",
    ],
  ],
  invalid: [
    [{ action: "set", lan: 1, management: 3 }, /management/],
    [{ action: "set", lan: 1, addExtensionWan: 11 }, /addExtensionWan/],
  ],
});

describeOperation({
  operation: registryOperation<{ action: string }>("cli.ip6.dhcp.optionc"),
  classification: "write",
  valid: [[{ action: "list" }, "ip6 dhcp option_c -l"]],
});

describeOperation({
  operation: registryOperation<{ action: string }>("cli.ip6.dhcp.options"),
  classification: "write",
  valid: [[{ action: "list" }, "ip6 dhcp option_s -l"]],
});
