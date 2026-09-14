import { describe, expect, it } from "vitest";

import type { CommandResult } from "../src/index.js";
import {
  OperationNotImplementedError,
  Vigor3912SClient,
  sdkErrorCodes,
  sdkMetadata,
  sdkPackageName,
} from "../src/index.js";
import type { CommandRunner } from "../src/internal/command-runner.js";
import { DefaultCommandRunner } from "../src/internal/execution/default-runner.js";
import { FakeTransport, exchange } from "./support/fake-transport.js";

async function expectOperationNotImplemented(
  promise: Promise<unknown>,
  messageIncludes?: string,
): Promise<void> {
  await expect(promise).rejects.toMatchObject({
    name: "OperationNotImplementedError",
    code: sdkErrorCodes.operationNotImplemented,
  });

  if (messageIncludes !== undefined) {
    await expect(promise).rejects.toThrow(messageIncludes);
  }
}

describe("SDK public source exports", () => {
  it("imports the public metadata surface", () => {
    expect(sdkPackageName).toBe("@jooservices/vigor3912s-sdk");
    expect(sdkMetadata).toEqual({
      packageName: "@jooservices/vigor3912s-sdk",
      status: "cli-operations-implemented",
    });
  });

  it("exposes the raw execute contract as a safe placeholder", async () => {
    const client = new Vigor3912SClient();

    await expectOperationNotImplemented(client.execute("sys version"));
  });

  it("still rejects with OperationNotImplementedError for a blank command", async () => {
    const client = new Vigor3912SClient();

    await expectOperationNotImplemented(client.execute("   "), "empty command");
  });

  it("still rejects with OperationNotImplementedError when options are passed but there is no runner", async () => {
    const client = new Vigor3912SClient();

    await expectOperationNotImplemented(
      client.execute("sys version", { timeoutMs: 1000 }),
      "with options",
    );
  });

  it("does not expose inferred router operations", () => {
    const client = new Vigor3912SClient();

    expect("getWanIp" in client).toBe(false);
  });

  it("uses a typed safe non-implementation error", () => {
    const error = new OperationNotImplementedError();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(OperationNotImplementedError);
    expect(error.code).toBe("operation_not_implemented");
  });
});

describe("Vigor3912SClient raw execute dispatch (injected CommandRunner)", () => {
  it("still rejects with OperationNotImplementedError when no runner is injected", async () => {
    const client = new Vigor3912SClient();

    await expect(client.execute("sys version")).rejects.toMatchObject({
      name: "OperationNotImplementedError",
      code: sdkErrorCodes.operationNotImplemented,
    });
  });

  it("delegates execute() to an injected CommandRunner-like dependency", async () => {
    const seenCalls: Array<{ command: string; options: unknown }> = [];
    const fakeResult: CommandResult = {
      command: "sys version",
      stdout: "fake stdout",
      stderr: "",
    };
    const fakeRunner: CommandRunner = {
      run(command, options) {
        seenCalls.push({ command, options });
        return Promise.resolve(fakeResult);
      },
    };
    const client = new Vigor3912SClient(fakeRunner);

    const result = await client.execute("sys version");

    expect(result).toBe(fakeResult);
    expect(seenCalls).toEqual([{ command: "sys version", options: undefined }]);
  });

  it("passes execute() options through to the injected runner", async () => {
    const controller = new AbortController();
    const seenOptions: Array<unknown> = [];
    const fakeRunner: CommandRunner = {
      run(_command, options) {
        seenOptions.push(options);
        return Promise.resolve({ command: "sys version", stdout: "", stderr: "" });
      },
    };
    const client = new Vigor3912SClient(fakeRunner);

    await client.execute("sys version", { signal: controller.signal, timeoutMs: 1000 });

    expect(seenOptions).toEqual([{ signal: controller.signal, timeoutMs: 1000 }]);
  });

  it("propagates a rejection from the injected runner", async () => {
    const failure = new Error("runner failed");
    const fakeRunner: CommandRunner = {
      run() {
        return Promise.reject(failure);
      },
    };
    const client = new Vigor3912SClient(fakeRunner);

    await expect(client.execute("sys version")).rejects.toBe(failure);
  });

  it("dispatches through the real DefaultCommandRunner composed with a fake Transport", async () => {
    const transport = new FakeTransport({ responses: [exchange("router says hi")] });
    const runner = new DefaultCommandRunner(transport);
    const client = new Vigor3912SClient(runner);

    const result = await client.execute("show status");

    expect(result).toEqual({ command: "show status", stdout: "router says hi", stderr: "" });
  });

  it("builds a public client from an injected Transport", async () => {
    const transport = new FakeTransport({ responses: [exchange("public transport says hi")] });
    const client = Vigor3912SClient.fromTransport(transport);

    const result = await client.execute("show status");

    expect(result).toEqual({
      command: "show status",
      stdout: "public transport says hi",
      stderr: "",
    });
  });

  it("rejects framing-invalid commands even when a real runner is injected", async () => {
    const transport = new FakeTransport();
    const runner = new DefaultCommandRunner(transport);
    const client = new Vigor3912SClient(runner);

    await expect(client.execute("show status; show session")).rejects.toMatchObject({
      code: sdkErrorCodes.commandFramingRejected,
    });
  });
});

describe("CommandResult shape", () => {
  it("does not include exitCode", () => {
    const result: CommandResult = { command: "sys version", stdout: "", stderr: "" };

    expect("exitCode" in result).toBe(false);
  });
});
