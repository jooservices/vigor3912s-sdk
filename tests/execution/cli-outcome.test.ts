import { describe, expect, it } from "vitest";

import { Vigor3912SClient, detectCliRejection } from "../../src/index.js";
import { ipArpFlush } from "../../src/domains/ip.js";
import { exchange, FakeTransport } from "../support/fake-transport.js";

describe("detectCliRejection", () => {
  it.each([
    ["% Invalid command", "invalid"],
    ["%% Invalid parameter", "invalid"],
    ["% Unknown command: foo", "unknown"],
    ["% Incomplete command.", "incomplete"],
    ["% Error: out of range", "error"],
    ["% Command not found", "command-not-found"],
    ["% Insufficient arguments !!!", "insufficient-arguments"],
    ["% input wan1/wan2 to set name", "usage"],
    ["% Valid subcommands are:", "help-listing"],
    ["% Valid commands are:", "help-listing"],
  ] as const)("detects %j as %s", (line, kind) => {
    expect(detectCliRejection(exchange(`header\r\n  ${line}\r\n> `))).toBe(kind);
  });

  it("treats any stderr output as a rejection", () => {
    expect(detectCliRejection(exchange("", "Invalid command\n"))).toBe("stderr");
    expect(detectCliRejection(exchange("ok", "   \n"))).toBeUndefined();
  });

  it("does not flag acknowledgements or %-prefixed data lines", () => {
    for (const stdout of [
      "% Set ARP OK !!!",
      "% Current Session Usage : 3%",
      "% Maximum Session Number: 100",
      "Invalid entries: 0",
      "",
    ]) {
      expect(detectCliRejection(exchange(stdout))).toBeUndefined();
    }
  });
});

describe("Vigor3912SClient.invoke on a rejected command", () => {
  it("throws command_rejected (kind only, no router output) instead of parsing", async () => {
    const transport = new FakeTransport({
      responses: [exchange("% Invalid command: secret-token-123\n")],
    });
    const client = Vigor3912SClient.fromTransport(transport);

    const failure = client.invoke(ipArpFlush, undefined);

    await expect(failure).rejects.toMatchObject({ code: "command_rejected" });
    await expect(failure).rejects.toThrow('Router rejected "cli.ip.arp.flush" (invalid).');
    await expect(failure).rejects.not.toThrow(/secret-token-123/);
  });

  it("rejects a write whose failure is reported on stderr", async () => {
    const transport = new FakeTransport({ responses: [exchange("", "denied\n")] });
    const client = Vigor3912SClient.fromTransport(transport);

    await expect(client.invoke(ipArpFlush, undefined)).rejects.toMatchObject({
      code: "command_rejected",
    });
  });

  it("leaves raw execute() results untouched for the consumer to judge", async () => {
    const transport = new FakeTransport({ responses: [exchange("% Invalid command\n")] });
    const client = Vigor3912SClient.fromTransport(transport);

    await expect(client.execute("ip arp flush")).resolves.toMatchObject({
      stdout: "% Invalid command\n",
    });
  });
});
