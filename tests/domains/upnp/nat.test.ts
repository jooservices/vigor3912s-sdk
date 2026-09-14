import { describe, expect, it } from "vitest";

import { upnpNat } from "../../../src/domains/upnp.js";
import { parseUpnpNat } from "../../../src/internal/parsers/upnp/nat.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_NAT_TEXT = [
  "******************  IGD NAT Status  ****************",
  "",
  "((0))",
  "InternalClient >>192.168.1.10<<, RemoteHost >>0.0.0.0<<",
  "InternalPort >>21<<, ExternalPort >>21<<",
  "PortMapProtocol >>TCP<<",
  "The tmpvirtual server index >>0<<",
  "PortMapLeaseDuration >>0<<, PortMapEnabled >>0<<",
  "Ftp Example [MICROSOFT]",
  "((1))",
  "InternalClient >>0.0.0.0<<, RemoteHost >>0.0.0.0<<",
  "InternalPort >>0<<, ExternalPort >>0<<",
  "PortMapProtocol >><NULL><<",
  "The tmpvirtual server index >>0<<",
  "PortMapLeaseDuration >>0<<, PortMapEnabled >>0<<",
  "",
].join("\n");

describe("cli.upnp.nat -- upnp nat (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = upnpNat.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("upnp nat");
  });

  it("parses the documented IGD NAT status blocks (synthetic sample)", () => {
    const report = parseUpnpNat(SAMPLE_NAT_TEXT);

    expect(report.entries).toEqual([
      {
        index: 0,
        internalClient: "192.168.1.10",
        remoteHost: "0.0.0.0",
        internalPort: 21,
        externalPort: 21,
        protocol: "TCP",
        tmpVirtualServerIndex: 0,
        portMapLeaseDuration: 0,
        portMapEnabled: false,
      },
      {
        index: 1,
        internalClient: "0.0.0.0",
        remoteHost: "0.0.0.0",
        internalPort: 0,
        externalPort: 0,
        protocol: "<NULL>",
        tmpVirtualServerIndex: 0,
        portMapLeaseDuration: 0,
        portMapEnabled: false,
      },
    ]);
  });

  it("skips an entry block truncated by pagination before all documented fields arrive", () => {
    // Mirrors the documented example's own trailing "MORE" pagination cutoff
    // (`cli-reference-raw.txt` rawLine ~9048-9050), where the last entry's
    // block can be cut short before `PortMapEnabled` is received.
    const truncatedText = [
      "******************  IGD NAT Status  ****************",
      "",
      "((0))",
      "InternalClient >>192.168.1.10<<, RemoteHost >>0.0.0.0<<",
      "InternalPort >>21<<, ExternalPort >>21<<",
      "PortMapProtocol >>TCP<<",
      "The tmpvirtual server index >>0<<",
      "--- MORE ---   ['q': Quit, 'Enter': New Lines, 'Space Bar': Next Page] ---",
    ].join("\n");

    expect(parseUpnpNat(truncatedText)).toEqual({ entries: [] });
  });

  it("returns no entries for text that doesn't match the documented shape", () => {
    expect(parseUpnpNat("not a nat status block")).toEqual({ entries: [] });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(upnpNat, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(upnpNat.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_NAT_TEXT);
    const report = upnpNat.parse([{ stdout, stderr: "" }]);

    expect(report.entries).toHaveLength(2);

    await expectClosedTransportFailure(command);
  });
});
