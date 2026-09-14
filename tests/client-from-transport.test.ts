import { describe, expect, it } from "vitest";

import { Vigor3912SClient, sdkErrorCodes } from "../src/index.js";
import { FakeTransport, exchange } from "./support/fake-transport.js";

describe("Vigor3912SClient.fromTransport", () => {
  it("round-trips execute() through the real DefaultCommandRunner composed with the given Transport", async () => {
    const transport = new FakeTransport({ responses: [exchange("router says hi")] });
    const client = Vigor3912SClient.fromTransport(transport);

    const result = await client.execute("show status");

    expect(result).toEqual({ command: "show status", stdout: "router says hi", stderr: "" });
  });

  it("surfaces session_closed when the injected Transport is already closed", async () => {
    const transport = new FakeTransport();
    await transport.close("pre-closed for test");
    const client = Vigor3912SClient.fromTransport(transport);

    await expect(client.execute("show status")).rejects.toMatchObject({
      code: sdkErrorCodes.sessionClosed,
    });
    expect(transport.calls).toEqual([]);
  });
});
