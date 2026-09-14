import { describe, expect, it } from "vitest";

import { switchList } from "../../../src/domains/switch.js";
import { parseSwitchList } from "../../../src/internal/parsers/switch/list.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_LIST_TEXT = [
  "No.       Mac             IP        status     Dur Time   CWMP   ACS_CTL  Model_Name   firmware_version",
  "-----------------------------------------------------------------------------------------------",
  "[1] 00-1d-aa-0c-cd-08  192.168.1.11    On-Line   01:07:45    -1     -1   G2282x",
  "[2] 00-1d-aa-0c-cd-09  192.168.1.12    On-Line   00:02:10    -1     -1   G2282x  1.2.3",
  "",
].join("\n");

describe("cli.switch.list -- switch list (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = switchList.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("switch list");
  });

  it("parses the documented device rows (synthetic sample)", () => {
    const report = parseSwitchList(SAMPLE_LIST_TEXT);

    expect(report.devices).toEqual([
      {
        index: 1,
        mac: "00-1d-aa-0c-cd-08",
        ip: "192.168.1.11",
        status: "On-Line",
        durationTime: "01:07:45",
        cwmp: "-1",
        acsCtl: "-1",
        modelName: "G2282x",
        firmwareVersion: undefined,
      },
      {
        index: 2,
        mac: "00-1d-aa-0c-cd-09",
        ip: "192.168.1.12",
        status: "On-Line",
        durationTime: "00:02:10",
        cwmp: "-1",
        acsCtl: "-1",
        modelName: "G2282x",
        firmwareVersion: "1.2.3",
      },
    ]);
  });

  it("returns no devices for text that doesn't match the documented shape", () => {
    expect(parseSwitchList("not a switch list")).toEqual({ devices: [] });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(switchList, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(switchList.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_LIST_TEXT);
    const report = switchList.parse([{ stdout, stderr: "" }]);

    expect(report.devices).toHaveLength(2);

    await expectClosedTransportFailure(command);
  });
});
