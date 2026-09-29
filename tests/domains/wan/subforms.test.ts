import {
  wanBudget,
  wanBudgetStatus,
  wanFailover,
  wanLbMode,
  wanLbStatus,
  wanVlanStat,
} from "../../../src/domains/wan.js";
import { describeOperation, registryOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: registryOperation<{ wanInterface: string; state: string }>("cli.wan.lb"),
  classification: "write",
  valid: [
    [{ wanInterface: "wan1", state: "on" }, "wan lb wan1 on"],
    [{ wanInterface: "wan2", state: "off" }, "wan lb wan2 off"],
  ],
});

describeOperation({
  operation: wanLbMode,
  classification: "write",
  valid: [
    [{ mode: "ip" }, "wan lb ip"],
    [{ mode: "session" }, "wan lb session"],
  ],
  invalid: [[{ mode: "flow" }, /mode/]],
});

describeOperation({
  operation: wanLbStatus,
  classification: "read",
  valid: [[undefined, "wan lb status"]],
});
describeOperation({
  operation: wanVlanStat,
  classification: "read",
  valid: [[undefined, "wan vlan stat"]],
});
describeOperation({
  operation: wanBudgetStatus,
  classification: "read",
  valid: [[undefined, "wan budget status"]],
});

describeOperation({
  operation: wanBudget,
  classification: "write",
  valid: [
    [{ wanInterface: 1, action: "refreshDate", day: 5, hour: 10 }, "wan budget wan 1 rdate 5 10"],
    [{ wanInterface: 1, action: "mode", mode: "periodic" }, "wan budget wan 1 mode periodic"],
    [{ wanInterface: 5, action: "periodStartDay", day: 5 }, "wan budget wan 5 psday 5"],
    [{ wanInterface: 1, action: "customMode", customMode: 1 }, "wan budget wan 1 custom_mode 1"],
    [
      { wanInterface: 1, action: "customModeResetHour", hour: 23 },
      "wan budget wan 1 custom_mode_reset_hour 23",
    ],
    [{ wanInterface: 1, action: "limitAction", bitmap: 5 }, "wan budget wan 1 action 5"],
  ],
  invalid: [
    [{ wanInterface: 1, action: "refreshDate", day: 31, hour: 10 }, /day must be between 1 and 30/],
    [{ wanInterface: 1, action: "mode", mode: "weekly" }, /mode/],
    [{ wanInterface: 1, action: "customMode", customMode: 2 }, /customMode/],
    [{ wanInterface: 1, action: "limitAction", bitmap: 8 }, /bitmap must be between 0 and 7/],
  ],
});

describeOperation({
  operation: wanFailover,
  classification: "write",
  valid: [
    [
      {
        action: "newlb",
        index: 2,
        settings: [
          { flag: "a", value: 1 },
          { flag: "u", value: 1 },
          { flag: "m", value: 100 },
          { flag: "z", value: 5 },
        ],
      },
      "wan failover newlb 2 -a 1 -u 1 -m 100 -z 5",
    ],
  ],
  invalid: [
    [{ action: "newlb", index: 2, settings: [] }, /at least one flag/],
    [
      { action: "newlb", index: 2, settings: [{ flag: "u", value: 2 }] },
      /-u must be between 0 and 1/,
    ],
    [{ action: "newlb", index: 13, settings: [{ flag: "a", value: 1 }] }, /index/],
    [{ action: "newlb", index: 2, settings: [{ flag: "q", value: 1 }] }, /flag/],
  ],
});
