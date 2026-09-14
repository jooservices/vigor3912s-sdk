import { describe, expect, it } from "vitest";

import { srvNatView } from "../../../src/domains/srv.js";
import { parseNatView } from "../../../src/internal/parsers/srv/nat-view.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "NAT view table\n";

describe("cli.srv.nat.view -- srv nat view", () => {
  it("builds the documented no-argument frame", () => {
    const frames = srvNatView.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("srv nat view");
  });

  it("parses the documented sample output (synthetic sample)", () => {
    expect(parseNatView(SAMPLE_TEXT)).toEqual({
      raw: "NAT view table",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(srvNatView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvNatView.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    expect(srvNatView.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
