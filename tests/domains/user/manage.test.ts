import { describe, expect, it } from "vitest";

import { userManage } from "../../../src/domains/user.js";
import { parseManage } from "../../../src/internal/parsers/user/manage.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.user -- user set / edit / account / setdefault (write)", () => {
  it("builds the documented frames for each sub-command and rejects invalid input", () => {
    expect(firstFrame(userManage.buildFrames({ action: "set", param: "-o" })).command).toBe(
      "user set -o",
    );
    expect(
      firstFrame(userManage.buildFrames({ action: "edit", profileIdx: 1, param: "-n fortest" }))
        .command,
    ).toBe("user edit 1 -n fortest");
    expect(
      firstFrame(userManage.buildFrames({ action: "account", userName: "carol", param: "-w" }))
        .command,
    ).toBe("user account carol -w");
    expect(firstFrame(userManage.buildFrames({ action: "setdefault" })).command).toBe(
      "user setdefault",
    );

    expect(() => userManage.buildFrames({ action: "set", param: "" })).toThrow(/param/);
    expect(() => userManage.buildFrames({ action: "edit", profileIdx: -1, param: "-e" })).toThrow(
      /profileIdx/,
    );
    expect(() => userManage.buildFrames({ action: "account", userName: "", param: "-q" })).toThrow(
      /userName/,
    );
    expect(() => userManage.buildFrames({ action: "set", param: "-o" })).toThrow(
      /control characters/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseManage("% user set: ok\n")).toEqual({ raw: "% user set: ok" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(userManage, "write");
  });

  it("falls back to empty text when no exchange is returned", () => {
    expect(userManage.parse([])).toEqual({ raw: "" });
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(userManage.buildFrames({ action: "setdefault" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% user setdefault: ok\n");

    expect(userManage.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% user setdefault: ok" });

    await expectClosedTransportFailure(command);
  });
});
