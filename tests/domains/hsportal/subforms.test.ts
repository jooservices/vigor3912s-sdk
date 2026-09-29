import {
  hsportalInfoClear,
  hsportalInfoSet,
  hsportalLevelDelete,
  hsportalLevelSet,
} from "../../../src/domains/hsportal.js";
import {
  local8021xCertSet,
  local8021xEnable,
  local8021xMethod,
  local8021xShowLocalCer,
} from "../../../src/domains/local_8021x.js";
import { wolFromWan, wolFromWanSetting, wolUp } from "../../../src/domains/wol.js";
import { describeOperation, registryOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: hsportalInfoSet,
  classification: "write",
  valid: [
    [{ option: "database", enabled: true }, "hsportal info -e 1"],
    [{ option: "notification", enabled: false }, "hsportal info -n 0"],
    [{ option: "autoBackup", enabled: true }, "hsportal info -a 1"],
    [{ option: "mailObject", objectIndex: 10 }, "hsportal info -m 10"],
    [{ option: "smsObject", objectIndex: 1 }, "hsportal info -s 1"],
  ],
  invalid: [
    [{ option: "mailObject", objectIndex: 11 }, /objectIndex/],
    [{ option: "reset", enabled: true }, /option/],
  ],
});

describeOperation({
  operation: hsportalInfoClear,
  classification: "destructive",
  valid: [[undefined, "hsportal info -c"]],
});

describeOperation({
  operation: hsportalLevelSet,
  classification: "write",
  valid: [
    [
      {
        profile: 1,
        settings: [
          { flag: "e", value: 1 },
          { flag: "i", value: 1 },
          { flag: "o", value: 300 },
        ],
      },
      "hsportal level -p 1 -e 1 -i 1 -o 300",
    ],
    [
      { profile: 1, settings: [{ flag: "r", value: 1 }], reconnectAt: "23:15" },
      "hsportal level -p 1 -r 1 -g 23:15",
    ],
    [
      {
        profile: 20,
        settings: [
          { flag: "b", value: 1 },
          { flag: "ru", value: 1 },
          { flag: "U", value: 10 },
          { flag: "s", value: 1 },
          { flag: "n", value: 6000 },
        ],
      },
      "hsportal level -p 20 -b 1 -ru 1 -U 10 -s 1 -n 6000",
    ],
  ],
  invalid: [
    [{ profile: 21, settings: [{ flag: "e", value: 1 }] }, /profile/],
    [{ profile: 1, settings: [{ flag: "d", value: 101 }] }, /-d must be between 0 and 100/],
    [{ profile: 1, settings: [{ flag: "q", value: 1 }] }, /flag must be one of/],
    [{ profile: 1, settings: [] }, /at least one setting/],
    [{ profile: 1, settings: [], reconnectAt: "24:00" }, /reconnectAt/],
  ],
});

describeOperation({
  operation: hsportalLevelDelete,
  classification: "write",
  valid: [[{ profile: 3 }, "hsportal level -c 3"]],
});

describeOperation({
  operation: registryOperation<Record<string, unknown>>("cli.swm.alert"),
  classification: "write",
  valid: [
    [
      { action: "deviceToggle", scope: "sw", mac: "00:1d:aa:11:22:33", enabled: true },
      "swm alert en sw 00:1d:aa:11:22:33",
    ],
    [
      { action: "deviceToggle", scope: "port", mac: "00:1d:aa:11:22:33", enabled: false },
      "swm alert dis port 00:1d:aa:11:22:33",
    ],
    [{ action: "switchShow", mac: "00:1d:aa:11:22:33" }, "swm alert sw show 00:1d:aa:11:22:33"],
    [{ action: "portShow", mac: "00:1d:aa:11:22:33" }, "swm alert port show 00:1d:aa:11:22:33"],
    [
      { action: "setSwitch", mac: "00:1d:aa:11:22:33", incident: 2, level: 1 },
      "swm alert set sw 00:1d:aa:11:22:33 2 1",
    ],
    [
      { action: "setPort", mac: "00:1d:aa:11:22:33", port: 5, incident: 2, level: 3 },
      "swm alert set port 00:1d:aa:11:22:33 5 2 3",
    ],
  ],
  invalid: [[{ action: "switchShow", mac: "not-a-mac" }, /mac must be a MAC address/]],
});

describeOperation({
  operation: local8021xEnable,
  classification: "write",
  valid: [[{ enabled: true }, "local_8021x enable 1"]],
});

describeOperation({
  operation: local8021xMethod,
  classification: "write",
  valid: [
    [{ action: "set", method: 1 }, "local_8021x set_localdot1x_method -e 1"],
    [{ action: "delete", method: 3 }, "local_8021x set_localdot1x_method -d 3"],
  ],
  invalid: [[{ action: "set", method: 5 }, /method/]],
});

describeOperation({
  operation: local8021xCertSet,
  classification: "write",
  valid: [[{ uid: "a1b2c3" }, "local_8021x cer_set a1b2c3"]],
});

describeOperation({
  operation: local8021xShowLocalCer,
  classification: "read",
  valid: [[undefined, "local_8021x show_local_cer"]],
});

describeOperation({
  operation: wolUp,
  classification: "write",
  valid: [[{ ipAddress: "192.168.1.20" }, "wol up 192.168.1.20"]],
  invalid: [[{ ipAddress: "host" }, /ipAddress/]],
});

describeOperation({
  operation: wolFromWan,
  classification: "write",
  valid: (["on", "off", "any"] as const).map((mode) => [{ mode }, `wol fromWan ${mode}`] as const),
  invalid: [[{ mode: "all" }, /mode/]],
});

describeOperation({
  operation: wolFromWanSetting,
  classification: "write",
  valid: [
    [
      { index: 1, ipAddress: "203.0.113.0", mask: "255.255.255.0" },
      "wol fromWan_Setting 1 203.0.113.0 255.255.255.0",
    ],
  ],
});
