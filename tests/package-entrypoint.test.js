import { describe, expect, it } from "vitest";

import {
  OperationNotImplementedError,
  Vigor3912SClient,
  sdkErrorCodes,
  sdkMetadata,
  sdkPackageName,
} from "@jooservices/vigor3912s-sdk";
import * as publicApi from "@jooservices/vigor3912s-sdk";

describe("built package entrypoint", () => {
  it("imports through the public package export", () => {
    expect(sdkPackageName).toBe("@jooservices/vigor3912s-sdk");
    expect(sdkMetadata.status).toBe("cli-operations-implemented");
  });

  it("imports the built public client and error contracts", async () => {
    const client = new Vigor3912SClient();

    await expect(client.execute("sys version")).rejects.toBeInstanceOf(
      OperationNotImplementedError,
    );
    expect("getWanIp" in client).toBe(false);
    expect(publicApi.sdkErrorCodes).toBe(sdkErrorCodes);
    expect("CommandRunner" in publicApi).toBe(false);
  });

  it("does not expose internal command runner subpaths", async () => {
    const internalSubpath = "@jooservices/vigor3912s-sdk/internal/command-runner";

    await expect(import(internalSubpath)).rejects.toThrow();
  });

  it("exposes the public transport subpath without runtime transport implementations", async () => {
    const publicTransportApi = await import("@jooservices/vigor3912s-sdk/transport");

    expect(Object.keys(publicTransportApi)).toEqual([]);
  });

  it("exposes the public operations subpath", async () => {
    const publicOperationsApi = await import("@jooservices/vigor3912s-sdk/operations");

    expect(publicOperationsApi.operations.wan.wanStatus.manifestId).toBe("cli.wan.status");
    expect(publicOperationsApi.operations.sys).toBeDefined();
  });
});

describe("built package raw execute dispatch (injected CommandRunner)", () => {
  it("delegates through the built client to an injected CommandRunner-like dependency", async () => {
    const fakeResult = { command: "sys version", stdout: "fake stdout", stderr: "" };
    const fakeRunner = {
      run() {
        return Promise.resolve(fakeResult);
      },
    };
    const client = new Vigor3912SClient(fakeRunner);

    const result = await client.execute("sys version");

    expect(result).toBe(fakeResult);
    expect("exitCode" in result).toBe(false);
  });

  it("still rejects with OperationNotImplementedError when no runner is injected", async () => {
    const client = new Vigor3912SClient();

    await expect(client.execute("sys version")).rejects.toBeInstanceOf(
      OperationNotImplementedError,
    );
  });
});
