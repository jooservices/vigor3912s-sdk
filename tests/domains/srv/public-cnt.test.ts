import { describe, expect, it } from "vitest";

import { srvDhcpPublicCnt } from "../../../src/domains/srv.js";
import { parsePublicCnt } from "../../../src/internal/parsers/srv/public-cnt.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.public.cnt", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvDhcpPublicCnt.buildFrames({ count: 3 })).command).toBe(
      "srv dhcp public cnt 3",
    );
    expect(() => srvDhcpPublicCnt.buildFrames({ count: 11 })).toThrow(/count/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parsePublicCnt(
        "% public cnt set\
",
      ),
    ).toEqual({ raw: "% public cnt set" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpPublicCnt, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpPublicCnt.buildFrames({ count: 3 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% public cnt set\
",
    );

    expect(stdout).toBe(
      "% public cnt set\
",
    );
    expect(srvDhcpPublicCnt.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
