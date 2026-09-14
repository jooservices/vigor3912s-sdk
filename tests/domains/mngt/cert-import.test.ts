import { describe, expect, it } from "vitest";

import { mngtCertImport } from "../../../src/domains/mngt.js";
import { parseCertImport } from "../../../src/internal/parsers/mngt/cert-import.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import {
  dispatchThroughFakeTransport,
  exchanges,
  expectClosedTransportFailure,
} from "./test-helpers.js";

const SAMPLE_TEXT = "Import OK\n";

describe("cli.mngt.certimport", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      mngtCertImport.buildFrames({ kind: "trusted_ca", url: "http://example.com/ca.p12" }),
    );

    expect(frame.command).toBe("mngt cert_import trusted_ca http://example.com/ca.p12");
    expect(() => mngtCertImport.buildFrames({ kind: "trusted_ca", url: "" })).toThrow(/url/);
    expect(() =>
      mngtCertImport.buildFrames({
        kind: "local_cert",
        url: "http://example.com/a.p12",
        password: "a b",
      }),
    ).toThrow(/password/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parseCertImport(SAMPLE_TEXT)).toEqual({
      raw: "Import OK",
    });
  });

  it("wires buildFrames output through parse via firstExchangeStdout", () => {
    expect(mngtCertImport.parse(exchanges(SAMPLE_TEXT))).toEqual(parseCertImport(SAMPLE_TEXT));
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(mngtCertImport, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      mngtCertImport.buildFrames({ kind: "trusted_ca", url: "http://example.com/ca.p12" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TEXT);

    expect(stdout).toBe(SAMPLE_TEXT);
    await expectClosedTransportFailure(command);
  });
});
