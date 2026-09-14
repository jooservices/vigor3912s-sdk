import { describe, expect, it } from "vitest";

import { operations } from "../../src/operations/index.js";
import type { OperationClassification, TypedOperation } from "../../src/operations/index.js";

describe("public operations namespace", () => {
  it("exposes typed operations grouped by domain family", () => {
    const typedOperation: TypedOperation<void, unknown> = operations.wan.wanStatus;
    const classification: OperationClassification = typedOperation.classification;

    expect(operations.wan.wanStatus.manifestId).toBe("cli.wan.status");
    expect(typeof operations.wan.wanStatus.buildFrames).toBe("function");
    expect(operations.dpdk.dpdkStatistic.manifestId).toBe("cli.dpdk.statistic");
    expect(operations.ip.ipPing.manifestId).toBe("cli.ip.ping");
    expect(operations.ha.haStatus.manifestId).toBe("cli.ha.status");
    expect(classification).toBe("read");
  });

  it("keeps every generated domain family namespace non-empty", () => {
    expect(Object.values(operations).every((family) => Object.keys(family).length > 0)).toBe(true);
  });
});
