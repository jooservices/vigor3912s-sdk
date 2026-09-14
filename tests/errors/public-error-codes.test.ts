import { describe, expect, it } from "vitest";

import { Vigor3912SError, sdkErrorCodes } from "../../src/errors.js";

describe("public SDK error codes", () => {
  it("exposes the forged operation rejection code", () => {
    expect(sdkErrorCodes.forgedOperationRejected).toBe("forged_operation_rejected");
    expect(new Vigor3912SError(sdkErrorCodes.forgedOperationRejected, "x").code).toBe(
      sdkErrorCodes.forgedOperationRejected,
    );
  });

  it("does not expose removed ChangePlan error codes", () => {
    expect(sdkErrorCodes).not.toHaveProperty("changePlanUnverified");
    expect(sdkErrorCodes).not.toHaveProperty("typedWriteRequiresChangePlan");
  });
});
