import { describe, expect, it } from "vitest";

import { testmailSend } from "../../../src/domains/testmail.js";
import { parseSend } from "../../../src/internal/parsers/testmail/send.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = [
  "Send out test mail",
  " Mail Alert:[Enable]",
  " Interface :Any",
  " WAN_Alias index:[0]",
  " SMTP_Server:[255.255.255.255]",
  " SMTP_Port:[25]",
  " Mail to:[]",
  " Return-Path:[]",
  " Connection Security:[Plaintext]",
  "",
].join("\n");

describe("cli.testmail -- testmail (write)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = testmailSend.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("testmail");
  });

  it("parses the documented settings dump (synthetic sample)", () => {
    expect(parseSend(SAMPLE_TEXT)).toEqual({ raw: SAMPLE_TEXT.trim() });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(testmailSend, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(testmailSend.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(testmailSend.parse([{ stdout, stderr: "" }])).toEqual({ raw: SAMPLE_TEXT.trim() });

    await expectClosedTransportFailure(command);
  });
});
