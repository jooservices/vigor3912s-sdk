import { describe, expect, it } from "vitest";

import { Vigor3912SClient } from "../src/client.js";
import { OperationNotImplementedError, sdkErrorCodes } from "../src/errors.js";
import { operations } from "../src/operations/index.js";
import { exchange, FakeTransport } from "./support/fake-transport.js";

describe("Vigor3912SClient.invoke", () => {
  it("dispatches a canonical read operation through FakeTransport and parses", async () => {
    const transport = new FakeTransport({
      responses: [exchange("WAN1: Ready\n")],
    });
    const client = Vigor3912SClient.fromTransport(transport);

    const result = await client.invoke(operations.wan.wanStatus, undefined);

    expect(transport.calls[0]?.command).toBe("wan status");
    expect(result).toBeTruthy();
  });

  it("dispatches a canonical write operation through FakeTransport and parses", async () => {
    const transport = new FakeTransport({
      responses: [exchange("% done")],
    });
    const client = Vigor3912SClient.fromTransport(transport);

    const result = await client.invoke(operations.wan.wanEnable, { wanInterface: 1 });

    expect(transport.calls[0]?.command).toBe("wan enable WAN1");
    expect(result).toBeTruthy();
  });

  it("rejects a forged descriptor with the same manifestId", async () => {
    const client = Vigor3912SClient.fromTransport(new FakeTransport({ responses: [exchange("")] }));
    const forged = {
      ...operations.wan.wanStatus,
      parse: () => ({ forged: true }),
    };

    await expect(
      client.invoke(forged as unknown as typeof operations.wan.wanStatus, undefined),
    ).rejects.toMatchObject({
      code: sdkErrorCodes.forgedOperationRejected,
    });
  });

  it("rejects when no runner is configured", async () => {
    const client = new Vigor3912SClient();

    await expect(client.invoke(operations.wan.wanStatus, undefined)).rejects.toBeInstanceOf(
      OperationNotImplementedError,
    );
  });
});
