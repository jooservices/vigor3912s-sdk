import { describe, expect, it } from "vitest";

import { Vigor3912SClient } from "../../../src/client.js";
import { wanVlanStat } from "../../../src/domains/wan.js";
import { exchange, FakeTransport } from "../../support/fake-transport.js";

const SAMPLE = "Interface Pri Tag Enabled\nWAN1 6 0 yes\n";

describe("cli.wan.vlan.stat -- long-running read", () => {
  it("keeps the documented read frame and parser on a per-operation timeout", async () => {
    const transport = new FakeTransport({ responses: [exchange(SAMPLE)] });
    const client = Vigor3912SClient.fromTransport(transport);

    expect(wanVlanStat.classification).toBe("read");
    await expect(client.invoke(wanVlanStat, undefined)).resolves.toEqual({ raw: SAMPLE.trim() });
    expect(transport.calls).toHaveLength(1);
    expect(transport.calls[0]?.command).toBe("wan vlan stat");
    expect(transport.calls[0]?.limits.commandTimeoutMs).toBe(120_000);
  });

  it("rejects a fake router insufficient-arguments response", async () => {
    const transport = new FakeTransport({
      responses: [exchange("% Insufficient arguments !!!")],
    });
    const client = Vigor3912SClient.fromTransport(transport);

    await expect(client.invoke(wanVlanStat, undefined)).rejects.toMatchObject({
      code: "command_rejected",
    });
    expect(transport.calls.map((call) => call.command)).toEqual(["wan vlan stat"]);
    expect(transport.calls[0]?.limits.commandTimeoutMs).toBe(120_000);
  });
});
