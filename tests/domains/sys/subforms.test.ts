import {
  sysAdminuser,
  sysBoard,
  sysDashboardSet,
  sysDashboardShow,
  sysMaxSessionSet,
  sysPollbufOff,
  sysPollbufOn,
  sysTimeInquire,
  sysTimePseudo,
  sysTimeServer,
  sysTimeShow,
  sysTimeWan,
  sysTimeZone,
} from "../../../src/domains/sys.js";
import { parseSysHealth } from "../../../src/internal/parsers/sys/health.js";
import { describeOperation, registryOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: sysPollbufOn,
  classification: "write",
  valid: [[undefined, "sys pollbuf on"]],
});
describeOperation({
  operation: sysPollbufOff,
  classification: "write",
  valid: [[undefined, "sys pollbuf off"]],
});

describeOperation({
  operation: sysTimeShow,
  classification: "read",
  valid: [[undefined, "sys time show"]],
});
describeOperation({
  operation: sysTimeInquire,
  classification: "write",
  valid: [[undefined, "sys time inquire"]],
});
describeOperation({
  operation: sysTimePseudo,
  classification: "write",
  valid: [[undefined, "sys time pseudo"]],
});
describeOperation({
  operation: sysTimeServer,
  classification: "write",
  valid: [[{ domain: "pool.ntp.org" }, "sys time server pool.ntp.org"]],
  invalid: [
    [{ domain: "has space" }, /whitespace/],
    [{ domain: "a".repeat(40) }, /at most 39 characters/],
  ],
});
describeOperation({
  operation: sysTimeWan,
  classification: "write",
  valid: [
    [{ wan: 0 }, "sys time wan 0"],
    [{ wan: 12 }, "sys time wan 12"],
  ],
  invalid: [[{ wan: 13 }, /wan must be between 0 and 12/]],
});
describeOperation({
  operation: sysTimeZone,
  classification: "write",
  valid: [[{ index: 23 }, "sys time zone 23"]],
  invalid: [[{ index: 0 }, /positive integer/]],
});

describeOperation({
  operation: sysDashboardShow,
  classification: "read",
  valid: [[undefined, "sys dashboard show"]],
});
describeOperation({
  operation: sysDashboardSet,
  classification: "write",
  valid: [
    [{ sections: [{ section: "0", enabled: true }] }, "sys dashboard -0 1"],
    [
      {
        sections: [
          { section: "a", enabled: false },
          { section: "5", enabled: true },
        ],
      },
      "sys dashboard -a 0 -5 1",
    ],
  ],
  invalid: [
    [{ sections: [] }, /at least one entry/],
    [{ sections: [{ section: "b", enabled: true }] }, /section/],
  ],
});

describeOperation({
  operation: sysMaxSessionSet,
  classification: "write",
  valid: [
    [{ value: "300K" }, "sys max_session 300K"],
    [{ value: "1000K" }, "sys max_session 1000K"],
  ],
  invalid: [[{ value: "200K" }, /value/]],
});

describeOperation({
  operation: sysAdminuser,
  classification: "write",
  valid: [
    [{ target: "Local", enabled: true }, "sys adminuser Local 1"],
    [
      { target: "edit", index: 1, username: "carrie", password: "test123" },
      "sys adminuser edit 1 carrie test123",
    ],
    [{ target: "delete", index: 8 }, "sys adminuser delete 8"],
    [{ target: "view", index: 1 }, "sys adminuser view 1"],
  ],
  invalid: [
    [{ target: "edit", index: 9, username: "a", password: "b" }, /index/],
    [{ target: "edit", index: 1, username: "a b", password: "b" }, /username/],
  ],
});

describeOperation({
  operation: sysBoard,
  classification: "write",
  valid: [
    [{ target: "ledSleepModeTime", minutes: 10 }, "sys board led sleepMode time 10"],
    [{ target: "usb", port: "p2", enabled: false }, "sys board usb p2 off"],
  ],
});

describeOperation({
  operation: registryOperation<{ metric: string }>("cli.sys.health"),
  classification: "read",
  valid: [
    "cpu_usage",
    "mem_usage",
    "arp_status",
    "dos_status",
    "sess_usage",
    "view",
    "vpn_status",
    "voip_status",
  ].map((metric) => [{ metric }, `sys health ${metric}`] as const),
  invalid: [[{ metric: "disk" }, /sys health metric/]],
  sampleOutput: "CPU usage: 3%\n",
  expectedParse: parseSysHealth("CPU usage: 3%\n"),
});

const argsCases = (prefix: string, forms: readonly string[]) =>
  forms.map((form) => [{ args: form.split(" ") }, `${prefix} ${form}`] as const);

describeOperation({
  operation: registryOperation<{ args: readonly string[] }>("cli.sys.tr069"),
  classification: "write",
  valid: argsCases("sys tr069", [
    "get InternetGatewayDevice. nextlevel",
    "set InternetGatewayDevice.ManagementServer.PeriodicInformEnable 1",
    "getnoti InternetGatewayDevice.DeviceInfo.SoftwareVersion",
    "setnoti InternetGatewayDevice.DeviceInfo.SoftwareVersion 2",
    "log",
    "debug on",
    "save",
    "clear",
    "inform 2",
    "port 8069",
    "cert_auth off",
    "only_standard_parm on",
    "notify -S",
    "notify -n on",
    "notify -l off",
    "notify -c on",
    "notify -h off",
    "notify -b on",
  ]),
  invalid: [[{ args: ["reboot"] }, /sys tr069 subcommand/]],
});

describeOperation({
  operation: registryOperation<{ args: readonly string[] }>("cli.sys.license"),
  classification: "write",
  valid: argsCases("sys license", [
    "reset_regser",
    "licera",
    "licifno wan1",
    "licalias 1",
    "lic_trigger",
    "liclog",
  ]),
  invalid: [[{ args: ["format"] }, /sys license subcommand/]],
});

describeOperation({
  operation: registryOperation<{ args: readonly string[] }>("cli.sys.webhook"),
  classification: "write",
  valid: argsCases("sys webhook", [
    "enable 1",
    "send",
    "status",
    "url http://192.168.1.10/hook",
    "period 3",
  ]),
});
