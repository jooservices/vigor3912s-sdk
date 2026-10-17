import { describe, expect, it } from "vitest";

import { Vigor3912SClient } from "../../../src/client.js";
import type { ShowClientTrafficDeviceInput } from "../../../src/domains/show.js";
import { operations } from "../../../src/domains/show.js";
import {
  parseShowClientTraffic,
  type ShowClientTrafficResult,
} from "../../../src/internal/parsers/show/clienttraffic.js";
import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import { byId } from "../../../src/manifest/index.js";
import { exchange, FakeTransport } from "../../support/fake-transport.js";

const MANIFEST_ID = "cli.show.clienttraffic";
const INPUT: ShowClientTrafficDeviceInput = {
  deviceIndex: 1,
  interfaceLabel: "WAN1",
  direction: "tx",
  weekly: true,
};
const SAMPLE_TEXT = "device01 WAN1 tx=0\n";

function findOperation(): TypedOperation<ShowClientTrafficDeviceInput, ShowClientTrafficResult> {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation as unknown as TypedOperation<
    ShowClientTrafficDeviceInput,
    ShowClientTrafficResult
  >;
}

describe("cli.show.clienttraffic operation", () => {
  it("builds the documented parameterized read frame and validates every selector", () => {
    const operation = findOperation();

    expect(operation.buildFrames(INPUT)[0]?.command).toBe("show clienttraffic 01 WAN1 tx weekly");
    expect(() => operation.buildFrames({ ...INPUT, deviceIndex: 31 })).toThrow(/deviceIndex/);
    expect(() => operation.buildFrames({ ...INPUT, interfaceLabel: "WAN3" })).toThrow(
      /interfaceLabel/,
    );
  });

  it("parses the minimal line DTO for the selected device", () => {
    expect(parseShowClientTraffic(SAMPLE_TEXT)).toEqual({ lines: ["device01 WAN1 tx=0"] });
  });

  it("is linked to a manifest entry with classification read and status implemented", () => {
    const entry = byId(MANIFEST_ID);

    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("read");
    expect(entry?.status).toBe("implemented");
  });

  it("invokes the valid frame and parser through a fake transport", async () => {
    const operation = findOperation();
    const transport = new FakeTransport({ responses: [exchange(SAMPLE_TEXT)] });
    const client = Vigor3912SClient.fromTransport(transport);

    await expect(client.invoke(operation, INPUT)).resolves.toEqual({
      lines: ["device01 WAN1 tx=0"],
    });
    expect(transport.calls.map((call) => call.command)).toEqual([
      "show clienttraffic 01 WAN1 tx weekly",
    ]);
  });

  it("rejects a fake router insufficient-arguments response without parsing it", async () => {
    const operation = findOperation();
    const transport = new FakeTransport({
      responses: [exchange("% Insufficient arguments !!!")],
    });
    const client = Vigor3912SClient.fromTransport(transport);

    await expect(client.invoke(operation, INPUT)).rejects.toMatchObject({
      code: "command_rejected",
    });
    expect(transport.calls.map((call) => call.command)).toEqual([
      "show clienttraffic 01 WAN1 tx weekly",
    ]);
  });
});
