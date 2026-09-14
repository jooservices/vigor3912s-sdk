import { describe, expect, it } from "vitest";

import { logFlush } from "../../../src/domains/log.js";
import { parseFlush } from "../../../src/internal/parsers/log/flush.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "% Flush log buffer OK\n";

describe("cli.log.F -- log -F a|c|f|w (write)", () => {
  it("builds the documented flush frame for each target and rejects invalid input", () => {
    expect(firstFrame(logFlush.buildFrames({ target: "a" })).command).toBe("log -F a");
    expect(firstFrame(logFlush.buildFrames({ target: "c" })).command).toBe("log -F c");
    expect(firstFrame(logFlush.buildFrames({ target: "f" })).command).toBe("log -F f");
    expect(firstFrame(logFlush.buildFrames({ target: "w" })).command).toBe("log -F w");

    expect(() => logFlush.buildFrames({ target: "" as never })).toThrow(/target/);
    expect(() => logFlush.buildFrames({ target: "x" as never })).toThrow(/target/);
    expect(() => logFlush.buildFrames({ target: "all" as never })).toThrow(/target/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseFlush(SAMPLE_TEXT)).toEqual({ raw: "% Flush log buffer OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(logFlush, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const { stdout } = await dispatchThroughFakeTransport(
      firstFrame(logFlush.buildFrames({ target: "a" })).command,
      SAMPLE_TEXT,
    );

    expect(logFlush.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Flush log buffer OK" });

    await expectClosedTransportFailure("log -F a");
  });
});
