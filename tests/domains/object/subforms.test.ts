import * as object from "../../../src/domains/object.js";
import { describeOperation } from "../../support/operation-cases.js";

const destructiveCommands = [
  [object.objectIpObjSetdefault, "object ip obj setdefault"],
  [object.objectIpGrpSetdefault, "object ip grp setdefault"],
  [object.objectIpv6ObjSetdefault, "object ipv6 obj setdefault"],
  [object.objectIpv6GrpSetdefault, "object ipv6 grp setdefault"],
  [object.objectCountrySetdefault, "object country setdefault"],
  [object.objectServiceObjSetdefault, "object service obj setdefault"],
  [object.objectServiceGrpSetdefault, "object service grp setdefault"],
  [object.objectKwSetdefault, "object kw obj setdefault"],
  [object.objectFeSetdefault, "object fe setdefault"],
  [object.objectSmsSetdefault, "object sms setdefault"],
  [object.objectMailSetdefault, "object mail setdefault"],
  [object.objectNotiSetdefault, "object noti setdefault"],
  [object.objectScheduleSetdefault, "object schedule setdefault"],
] as const;

for (const [operation, command] of destructiveCommands) {
  describeOperation({ operation, classification: "destructive", valid: [[undefined, command]] });
}

const readAllCommands = [
  [object.objectCountryList, "object country list"],
  [object.objectFeShow, "object fe show"],
  [object.objectSmsShow, "object sms show"],
  [object.objectMailShow, "object mail show"],
  [object.objectNotiShow, "object noti show"],
] as const;

for (const [operation, command] of readAllCommands) {
  describeOperation({ operation, classification: "read", valid: [[undefined, command]] });
}

const views = [
  [object.objectIpGrpView, "object ip grp", 255],
  [object.objectIpv6ObjView, "object ipv6 obj", 255],
  [object.objectIpv6GrpView, "object ipv6 grp", 255],
  [object.objectCountryView, "object country set", 32],
  [object.objectServiceGrpView, "object service grp", 255],
  [object.objectKwView, "object kw obj", 255],
  [object.objectFeView, "object fe obj", 8],
  [object.objectSmsView, "object sms obj", 10],
  [object.objectMailView, "object mail obj", 10],
  [object.objectNotiView, "object noti obj", 8],
] as const;

for (const [operation, prefix, max] of views) {
  describeOperation({
    operation,
    classification: "read",
    valid: [
      [{ index: 1 }, `${prefix} 1 -v`],
      [{ index: max }, `${prefix} ${String(max)} -v`],
    ],
    invalid: [[{ index: max + 1 }, /index must be between 1 and/]],
  });
}

describeOperation({
  operation: object.objectCountryActivate,
  classification: "write",
  valid: [[undefined, "object country activate"]],
});

describeOperation({
  operation: object.objectKwShow,
  classification: "read",
  valid: [[{ page: 2 }, "object kw obj show 2"]],
  invalid: [[{ page: 0 }, /positive integer/]],
});

describeOperation({
  operation: object.objectScheduleView,
  classification: "read",
  valid: [
    [{}, "object schedule view"],
    [{ index: 1 }, "object schedule view 1"],
  ],
  invalid: [[{ index: 16 }, /index must be between 1 and 15/]],
});

describeOperation({
  operation: object.objectIpObjSet,
  classification: "write",
  valid: [
    [{ index: 9, flag: "n", values: ["bruce"] }, "object ip obj 9 -n bruce"],
    [{ index: 8, flag: "i", values: [0] }, "object ip obj 8 -i 0"],
    [{ index: 3, flag: "s", values: [1] }, "object ip obj 3 -s 1"],
    [{ index: 3, flag: "a", values: [2] }, "object ip obj 3 -a 2"],
    [
      { index: 3, flag: "a", values: [3, "192.168.1.1", "192.168.1.20"] },
      "object ip obj 3 -a 3 192.168.1.1 192.168.1.20",
    ],
  ],
  invalid: [
    [{ index: 1, flag: "i", values: [2] }, /values\[0] must be one of/],
    [{ index: 1, flag: "n", values: ["a-very-long-profile-name"] }, /at most 15 characters/],
    [{ index: 1, flag: "z", values: [1] }, /flag must be one of/],
    [{ index: 1, flag: "a", values: [] }, /requires 1 value/],
    [{ index: 1, flag: "s", values: [1, 2] }, /takes at most 1 value/],
    [{ index: 256, flag: "s", values: [1] }, /index must be between 1 and 255/],
  ],
});

describeOperation({
  operation: object.objectIpGrpSet,
  classification: "write",
  valid: [
    [{ index: 3, flag: "i", values: [0] }, "object ip grp 3 -i 0"],
    [{ index: 3, flag: "a", values: [1, 2, 3, 4, 5] }, 'object ip grp 3 -a "1 2 3 4 5"'],
    [{ index: 3, flag: "a", values: [7] }, "object ip grp 3 -a 7"],
  ],
  invalid: [[{ index: 3, flag: "a", values: [] }, /requires 1 value/]],
});

describeOperation({
  operation: object.objectIpv6ObjSet,
  classification: "write",
  valid: [
    [{ index: 3, flag: "s", values: [1] }, "object ipv6 obj 3 -s 1"],
    [{ index: 8, flag: "e", values: [0] }, "object ipv6 obj 8 -e 0"],
    [
      { index: 3, flag: "a", values: [3, "2607:F0D0:1002:51::4", "2607:F0D0:1002:51::9", 64] },
      "object ipv6 obj 3 -a 3 2607:F0D0:1002:51::4 2607:F0D0:1002:51::9 64",
    ],
  ],
});

describeOperation({
  operation: object.objectIpv6GrpSet,
  classification: "write",
  valid: [[{ index: 2, flag: "a", values: [1, 2] }, 'object ipv6 grp 2 -a "1 2"']],
});

describeOperation({
  operation: object.objectCountrySet,
  classification: "write",
  valid: [[{ index: 1, flag: "a", values: [222] }, "object country set 1 -a 222"]],
});

describeOperation({
  operation: object.objectServiceObjSet,
  classification: "write",
  valid: [
    [{ index: 9, flag: "n", values: ["bruce"] }, "object service obj 9 -n bruce"],
    [{ index: 8, flag: "p", values: [6] }, "object service obj 8 -p 6"],
    [{ index: 3, flag: "s", values: [0, 100, 200] }, "object service obj 3 -s 0 100 200"],
    [{ index: 3, flag: "d", values: [1, 100, 200] }, "object service obj 3 -d 1 100 200"],
  ],
  invalid: [[{ index: 3, flag: "d", values: [4, 100, 200] }, /values\[0] must be between 0 and 3/]],
});

describeOperation({
  operation: object.objectServiceGrpSet,
  classification: "write",
  valid: [[{ index: 3, flag: "a", values: [1, 2, 3, 4, 5] }, "object service grp 3 -a 1 2 3 4 5"]],
});

describeOperation({
  operation: object.objectKwSet,
  classification: "write",
  valid: [
    [{ index: 40, flag: "a", values: ["test"] }, "object kw obj 40 -a test"],
    [{ index: 40, flag: "c" }, "object kw obj 40 -c"],
  ],
});

describeOperation({
  operation: object.objectFeSet,
  classification: "write",
  valid: [
    [{ index: 1, flag: "e", values: ["Image"] }, "object fe obj 1 -e Image"],
    [{ index: 1, flag: "d", values: [".bmp"] }, "object fe obj 1 -d .bmp"],
  ],
});

describeOperation({
  operation: object.objectSmsSet,
  classification: "write",
  valid: [
    [{ index: 1, flag: "s", values: [5] }, "object sms obj 1 -s 5"],
    [{ index: 1, flag: "u", values: ["alice"] }, "object sms obj 1 -u alice"],
    [{ index: 1, flag: "p", values: ["s3cret"] }, "object sms obj 1 -p s3cret"],
    [{ index: 1, flag: "q", values: [100] }, "object sms obj 1 -q 100"],
    [{ index: 1, flag: "i", values: [3] }, "object sms obj 1 -i 3"],
    [
      { index: 9, flag: "l", values: ["http://sms.example/api"] },
      "object sms obj 9 -l http://sms.example/api",
    ],
  ],
});

describeOperation({
  operation: object.objectMailSet,
  classification: "write",
  valid: [
    [{ index: 1, flag: "s", values: ["192.168.1.98"] }, "object mail obj 1 -s 192.168.1.98"],
    [{ index: 1, flag: "l", values: [1] }, "object mail obj 1 -l 1"],
    [{ index: 1, flag: "m", values: [465] }, "object mail obj 1 -m 465"],
    [{ index: 1, flag: "a", values: ["ops@example.com"] }, "object mail obj 1 -a ops@example.com"],
    [{ index: 1, flag: "t", values: [0] }, "object mail obj 1 -t 0"],
    [{ index: 1, flag: "u", values: ["mailer"] }, "object mail obj 1 -u mailer"],
    [{ index: 1, flag: "p", values: ["pw"] }, "object mail obj 1 -p pw"],
    [{ index: 1, flag: "i", values: [60] }, "object mail obj 1 -i 60"],
    [{ index: 1, flag: "w", values: ["WAN1"] }, "object mail obj 1 -w WAN1"],
    [{ index: 1, flag: "x", values: [10] }, "object mail obj 1 -x 10"],
  ],
  invalid: [
    [{ index: 1, flag: "u", values: ["u".repeat(32)] }, /at most 31 characters/],
    [{ index: 1, flag: "x", values: [11] }, /between 1 and 10/],
  ],
});

describeOperation({
  operation: object.objectNotiSet,
  classification: "write",
  valid: [
    [{ index: 1, flag: "e", values: [1, 1] }, "object noti obj 1 -e 1 1"],
    [{ index: 1, flag: "d", values: [9, 6] }, "object noti obj 1 -d 9 6"],
  ],
  invalid: [[{ index: 1, flag: "e", values: [7, 1] }, /values\[0] must be one of/]],
});

describeOperation({
  operation: object.objectScheduleSet,
  classification: "write",
  valid: [
    [{ index: 1, flag: "e", values: [1] }, "object schedule set 1 -e 1"],
    [{ index: 1, flag: "c", values: ["Working"] }, "object schedule set 1 -c Working"],
    [{ index: 1, flag: "D", values: [2016, 11, 8] }, 'object schedule set 1 -D "2016 11 8"'],
    [{ index: 1, flag: "T", values: [8, 1] }, 'object schedule set 1 -T "8 1"'],
    [{ index: 1, flag: "d", values: [2, 30] }, 'object schedule set 1 -d "2 30"'],
    [{ index: 1, flag: "a", values: [0] }, "object schedule set 1 -a 0"],
    [{ index: 1, flag: "I", values: [30] }, "object schedule set 1 -I 30"],
    [{ index: 1, flag: "h", values: [1, "Mon", "Wed"] }, 'object schedule set 1 -h "1 Mon Wed"'],
  ],
  invalid: [[{ index: 1, flag: "h", values: [1, "Funday"] }, /values\[1] must be one of/]],
});
