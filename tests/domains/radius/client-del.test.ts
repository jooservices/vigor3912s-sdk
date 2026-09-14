import { describe, expect, it } from "vitest";

import { radiusClientDel } from "../../../src/domains/radius.js";
import { parseClientDel } from "../../../src/internal/parsers/radius/client-del.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.radius.client.del -- radius client del (write)", () => {
  it("builds the documented client-del frame and rejects invalid indexes", () => {
    expect(firstFrame(radiusClientDel.buildFrames({ index: 2 })).command).toBe(
      "radius client del 2",
    );

    expect(() => radiusClientDel.buildFrames({ index: 0 })).toThrow(/index/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseClientDel("% client deleted\n")).toEqual({ raw: "% client deleted" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(radiusClientDel, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(radiusClientDel.buildFrames({ index: 2 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% client deleted\n");

    expect(radiusClientDel.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% client deleted" });

    await expectClosedTransportFailure(command);
  });
});
