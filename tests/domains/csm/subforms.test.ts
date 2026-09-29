import {
  csmAppeConfig,
  csmDnsf,
  csmDnsfLocalBwClear,
  csmDnsfLocalBwSet,
  csmDnsfLocalBwShow,
  csmUcfObjEac,
  csmUcfObjUac,
  csmUcfObjWf,
  csmWcf,
} from "../../../src/domains/csm.js";
import { describeOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: csmAppeConfig,
  classification: "read",
  valid: [
    [{ index: 1, group: "im" }, "csm appe config -v 1 -i"],
    [{ index: 1, group: "p2p" }, "csm appe config -v 1 -p"],
    [{ index: 1, group: "protocol" }, "csm appe config -v 1 -t"],
    [{ index: 1, group: "others" }, "csm appe config -v 1 -m"],
    [{ index: 32, group: "route" }, "csm appe config -v 32 -r"],
  ],
});

describeOperation({
  operation: csmUcfObjUac,
  classification: "write",
  valid: [
    [{ index: 1, action: "setObject", objectIndex: 3 }, "csm ucf obj 1 uac -o 3"],
    [{ index: 1, action: "setGroup", groupIndex: 2 }, "csm ucf obj 1 uac -g 2"],
  ],
});

describeOperation({
  operation: csmUcfObjEac,
  classification: "write",
  valid: [
    [{ index: 1, action: "setObject", objectIndex: 3 }, "csm ucf obj 1 eac -o 3"],
    [{ index: 1, action: "setGroup", groupIndex: 2 }, "csm ucf obj 1 eac -g 2"],
  ],
});

describeOperation({
  operation: csmUcfObjWf,
  classification: "write",
  valid: [
    [{ index: 1, action: "setFileExtension", fileExtensionIndex: 8 }, "csm ucf obj 1 wf -f 8"],
  ],
  invalid: [[{ index: 1, action: "setFileExtension", fileExtensionIndex: 9 }, /between 1 and 8/]],
});

describeOperation({
  operation: csmWcf,
  classification: "write",
  valid: [
    [{ action: "server", server: "wcf.example" }, "csm wcf server wcf.example"],
    [{ action: "message", message: "blocked" }, "csm wcf msg blocked"],
    [{ action: "objKeywordObject", index: 1, objectIndex: 4 }, "csm wcf obj 1 -o 4"],
    [{ action: "objKeywordGroup", index: 1, groupIndex: 2 }, "csm wcf obj 1 -g 2"],
    [{ action: "objListAction", index: 1, value: "E" }, "csm wcf obj 1 -w E"],
    [{ action: "objSelect", index: 1, item: "Security" }, "csm wcf obj 1 -s Security"],
    [{ action: "objDiscard", index: 1, item: "Bot Nets" }, 'csm wcf obj 1 -u "Bot Nets"'],
  ],
  invalid: [
    [{ action: "objListAction", index: 1, value: "X" }, /value/],
    [{ action: "objSelect", index: 1, item: 'Bot "Nets"' }, /double quote/],
    [{ action: "objSelect", index: 1, item: " " }, /must not be empty/],
  ],
});

describeOperation({
  operation: csmDnsf,
  classification: "write",
  valid: [
    [{ action: "profileEditWcf", index: 1, wcfProfile: 2 }, "csm dnsf profile_edit 1 -w 2"],
    [{ action: "profileEditUcf", index: 1, ucfProfile: 3 }, "csm dnsf profile_edit 1 -u 3"],
    [{ action: "profileEditCache", index: 1, hours: 24 }, "csm dnsf profile_edit 1 -c 24"],
  ],
  invalid: [
    [{ action: "profileEditWcf", index: 1, wcfProfile: 9 }, /wcfProfile/],
    [{ action: "profileEditCache", index: 1, hours: 25 }, /hours/],
  ],
});

describeOperation({
  operation: csmDnsfLocalBwShow,
  classification: "read",
  valid: [[undefined, "csm dnsf local_bw s"]],
});

describeOperation({
  operation: csmDnsfLocalBwClear,
  classification: "destructive",
  valid: [[undefined, "csm dnsf local_bw c"]],
});

describeOperation({
  operation: csmDnsfLocalBwSet,
  classification: "write",
  valid: [
    [{ action: "enable" }, "csm dnsf local_bw e"],
    [{ action: "disable" }, "csm dnsf local_bw d"],
    [{ action: "pass" }, "csm dnsf local_bw p"],
    [{ action: "block" }, "csm dnsf local_bw b"],
    [
      { action: "addressType", type: 1, values: ["192.168.1.11"] },
      "csm dnsf local_bw a 1 192.168.1.11",
    ],
    [{ action: "addressType", type: 2 }, "csm dnsf local_bw a 2"],
    [{ action: "group", item: 1, groupIndex: 192 }, "csm dnsf local_bw g 1 192"],
    [{ action: "object", item: 2, objectIndex: 32 }, "csm dnsf local_bw o 2 32"],
  ],
  invalid: [
    [{ action: "addressType", type: 5 }, /type/],
    [{ action: "group", item: 3, groupIndex: 1 }, /item/],
    [{ action: "object", item: 1, objectIndex: 33 }, /objectIndex/],
    [{ action: "reset" }, /action/],
  ],
});
