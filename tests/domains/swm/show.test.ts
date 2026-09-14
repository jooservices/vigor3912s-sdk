import { describe, expect, it } from "vitest";

import { swmShow } from "../../../src/domains/swm.js";
import { parseSwmShow } from "../../../src/internal/parsers/swm/show.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.swm.show -- swm show <LAN_port>", () => {
  it("builds the documented frame with a required LAN port and rejects invalid input", () => {
    const frame = firstFrame(swmShow.buildFrames({ lanPort: 3 }));

    expect(frame.command).toBe("swm show 3");

    expect(() => swmShow.buildFrames({ lanPort: 0 })).toThrow(/lanPort/);
    expect(() => swmShow.buildFrames({ lanPort: 13 })).toThrow(/lanPort/);
    expect(() => swmShow.buildFrames({ lanPort: 1.5 })).toThrow(/integer/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSwmShow("(Total 1 Switch)\n")).toEqual({ raw: "(Total 1 Switch)" });
  });

  it("operation.parse() pulls the first exchange's stdout through the shared parser", () => {
    expect(swmShow.parse([exchange("(Total 1 Switch)\n")])).toEqual(
      parseSwmShow("(Total 1 Switch)\n"),
    );
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(swmShow, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(swmShow.buildFrames({ lanPort: 3 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "(Total 1 Switch)");

    expect(stdout).toBe("(Total 1 Switch)");
    await expectClosedTransportFailure(command);
  });
});
