import { describe, expect, it } from "vitest";

import { Vigor3912SClient } from "../../../src/client.js";
import { operations, sysPollbufOff, sysPollbufOn } from "../../../src/domains/sys.js";
import { frameSingleCommand } from "../../../src/internal/execution/framing.js";
import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import { operationRegistry } from "../../../src/internal/registry/registry.generated.js";
import { byId } from "../../../src/manifest/index.js";
import { FakeTransport } from "../../support/fake-transport.js";

const MANIFEST_ID = "cli.sys.pollbuf";

describe("sys pollbuf read capability", () => {
  it("preserves the read classification while blocking an unverified query", () => {
    const entry = byId(MANIFEST_ID);

    expect(entry?.classification).toBe("read");
    expect(entry?.classificationBasis).toBe("sibling-live-verified");
    expect(entry?.status).toBe("blocked-by-documentation");
    expect(entry?.blockedReason).toMatch(/rejected as incomplete on DEV/);
    expect(operations.some((operation) => operation.manifestId === MANIFEST_ID)).toBe(false);
    expect(operationRegistry.has(MANIFEST_ID)).toBe(false);
  });

  it("rejects a stale descriptor before it can reach even a fake transport", async () => {
    const staleDescriptor: TypedOperation<void, { readonly raw: string }> = {
      manifestId: MANIFEST_ID,
      classification: "read",
      buildFrames: () => [frameSingleCommand("sys pollbuf")],
      parse: () => ({ raw: "" }),
    };
    const transport = new FakeTransport();
    const client = Vigor3912SClient.fromTransport(transport);

    await expect(client.invoke(staleDescriptor, undefined)).rejects.toMatchObject({
      code: "forged_operation_rejected",
    });
    expect(transport.calls).toEqual([]);
  });

  it("keeps the documented on/off forms classified as writes", () => {
    expect(sysPollbufOn.classification).toBe("write");
    expect(sysPollbufOn.buildFrames(undefined)[0]?.command).toBe("sys pollbuf on");
    expect(byId("cli.sys.pollbuf.on")?.classification).toBe("write");

    expect(sysPollbufOff.classification).toBe("write");
    expect(sysPollbufOff.buildFrames(undefined)[0]?.command).toBe("sys pollbuf off");
    expect(byId("cli.sys.pollbuf.off")?.classification).toBe("write");
  });
});
