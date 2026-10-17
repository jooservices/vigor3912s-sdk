import { describe, expect, it } from "vitest";

import { Vigor3912SClient } from "../../../src/client.js";
import type { ShowTrafficInput } from "../../../src/domains/show.js";
import { operations } from "../../../src/domains/show.js";
import {
  parseShowTraffic,
  type ShowTrafficResult,
} from "../../../src/internal/parsers/show/traffic.js";
import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import { byId } from "../../../src/manifest/index.js";
import { exchange, FakeTransport } from "../../support/fake-transport.js";

const MANIFEST_ID = "cli.show.traffic";
const INPUT: ShowTrafficInput = {
  form: "wan",
  wan: "wan1",
  direction: "tx",
  weekly: true,
};

function findOperation(): TypedOperation<ShowTrafficInput, ShowTrafficResult> {
  const operation = operations.find((candidate) => candidate.manifestId === MANIFEST_ID);
  if (operation === undefined) {
    throw new Error(`Operation "${MANIFEST_ID}" not registered by src/domains/show.ts.`);
  }
  return operation as unknown as TypedOperation<ShowTrafficInput, ShowTrafficResult>;
}

const SAMPLE_TEXT = "WAN1 tx=0 rx=0\n";

describe("cli.show.traffic operation", () => {
  it("builds every documented read form and excludes the state-changing toggle", () => {
    const operation = findOperation();

    expect(operation.buildFrames(INPUT)[0]?.command).toBe("show traffic wan1 tx weekly");
    expect(operation.buildFrames({ form: "wan", wan: "wan2", direction: "rx" })[0]?.command).toBe(
      "show traffic wan2 rx",
    );
    expect(
      operation.buildFrames({ form: "ip", ipv4Address: "192.0.2.10", direction: "rx" })[0]?.command,
    ).toBe("show traffic 192.0.2.10 rx");
    expect(operation.buildFrames({ form: "session" })[0]?.command).toBe("show traffic session");
    expect(operation.buildFrames({ form: "session", weekly: true })[0]?.command).toBe(
      "show traffic session weekly",
    );
    expect(() => operation.buildFrames({ form: "wan", wan: "wan8", direction: "tx" })).toThrow(
      /wan/,
    );
    expect(() => {
      Reflect.apply(operation.buildFrames, undefined, [{ form: "invalid" }]);
    }).toThrow(/form must be one of/);
  });

  it("parses the minimal line DTO for a documented query form", () => {
    expect(parseShowTraffic(SAMPLE_TEXT)).toEqual({ lines: ["WAN1 tx=0 rx=0"] });
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

    await expect(client.invoke(operation, INPUT)).resolves.toEqual({ lines: ["WAN1 tx=0 rx=0"] });
    expect(transport.calls.map((call) => call.command)).toEqual(["show traffic wan1 tx weekly"]);
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
    expect(transport.calls.map((call) => call.command)).toEqual(["show traffic wan1 tx weekly"]);
  });
});
