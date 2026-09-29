import {
  wanDetectInterval,
  wanDetectMode,
  wanDetectRetry,
  wanDetectTarget,
  wanDetectTarget2,
  wanDetectTargetGw,
  wanDetectTtl,
} from "../../../src/domains/wan.js";
import { describeOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: wanDetectMode,
  classification: "write",
  valid: [
    [{ wanInterface: "wan1", mode: "on" }, "wan detect wan1 on"],
    [{ wanInterface: "wan2", mode: "always_on" }, "wan detect wan2 always_on"],
    [{ wanInterface: "wan1", mode: "off" }, "wan detect wan1 off"],
    [{ wanInterface: "wan1", mode: "off", timeSeconds: 30 }, "wan detect wan1 off -t 30"],
    [{ wanInterface: "wan1", mode: "off", intervalSeconds: 5 }, "wan detect wan1 off -i 5"],
  ],
  invalid: [
    [{ wanInterface: "wan13", mode: "on" }, /wanInterface/],
    [{ wanInterface: "wan1", mode: "auto" }, /mode/],
    [
      { wanInterface: "wan1", mode: "off", timeSeconds: 257 },
      /timeSeconds must be between 0 and 256/,
    ],
    [
      { wanInterface: "wan1", mode: "off", timeSeconds: 30, intervalSeconds: 5 },
      /separate commands/,
    ],
  ],
});

describeOperation({
  operation: wanDetectTarget,
  classification: "write",
  valid: [[{ wanInterface: "wan1", ipv4Address: "8.8.8.8" }, "wan detect wan1 target 8.8.8.8"]],
  invalid: [[{ wanInterface: "wan1", ipv4Address: "8.8.8" }, /ipv4Address/]],
});

describeOperation({
  operation: wanDetectTarget2,
  classification: "write",
  valid: [[{ wanInterface: "wan3", ipv4Address: "1.1.1.1" }, "wan detect wan3 target2 1.1.1.1"]],
});

describeOperation({
  operation: wanDetectTargetGw,
  classification: "write",
  valid: [
    [{ wanInterface: "wan1", enabled: true }, "wan detect wan1 target_gw 1"],
    [{ wanInterface: "wan1", enabled: false }, "wan detect wan1 target_gw 0"],
  ],
});

describeOperation({
  operation: wanDetectTtl,
  classification: "write",
  valid: [[{ wanInterface: "wan1", value: 0 }, "wan detect wan1 ttl 0"]],
  invalid: [[{ wanInterface: "wan1", value: 256 }, /value must be between 0 and 255/]],
});

describeOperation({
  operation: wanDetectInterval,
  classification: "write",
  valid: [[{ wanInterface: "wan1", value: 3600 }, "wan detect wan1 interval 3600"]],
  invalid: [[{ wanInterface: "wan1", value: 0 }, /value must be between 1 and 3600/]],
});

describeOperation({
  operation: wanDetectRetry,
  classification: "write",
  valid: [[{ wanInterface: "wan1", value: 255 }, "wan detect wan1 retry 255"]],
  invalid: [[{ wanInterface: "wan1", value: 0 }, /value must be between 1 and 255/]],
});
