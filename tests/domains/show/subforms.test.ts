import {
  showClientTrafficDevice,
  showStatisticReset,
  showTrafficIp,
  showTrafficIpStats,
  showTrafficSession,
  showTrafficWan,
} from "../../../src/domains/show.js";
import {
  serviceClear,
  serviceLogin,
  serviceRefresh,
  serviceTransfer,
  serviceTransferOwner,
} from "../../../src/domains/service.js";
import { describeOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: showTrafficWan,
  classification: "read",
  valid: [
    [{ wan: "wan1", direction: "tx" }, "show traffic wan1 tx"],
    [{ wan: "wan7", direction: "rx", weekly: true }, "show traffic wan7 rx weekly"],
  ],
  invalid: [
    [{ wan: "wan8", direction: "tx" }, /wan must be/],
    [{ wan: "wan1", direction: "up" }, /direction/],
  ],
});

describeOperation({
  operation: showTrafficIp,
  classification: "read",
  valid: [[{ ipv4Address: "192.168.1.10", direction: "rx" }, "show traffic 192.168.1.10 rx"]],
  invalid: [[{ ipv4Address: "host", direction: "rx" }, /ipv4Address/]],
});

describeOperation({
  operation: showTrafficSession,
  classification: "read",
  valid: [
    [{}, "show traffic session"],
    [{ weekly: true }, "show traffic session weekly"],
  ],
});

describeOperation({
  operation: showTrafficIpStats,
  classification: "write",
  valid: [
    [{}, "show traffic ip"],
    [{ enabled: true }, "show traffic ip 1"],
    [{ enabled: false }, "show traffic ip 0"],
  ],
});

describeOperation({
  operation: showClientTrafficDevice,
  classification: "read",
  valid: [
    [{ deviceIndex: 1, interfaceLabel: "WAN1", direction: "tx" }, "show clienttraffic 01 WAN1 tx"],
    [
      { deviceIndex: 30, interfaceLabel: "LANB", direction: "rx", weekly: true },
      "show clienttraffic 30 LANB rx weekly",
    ],
  ],
  invalid: [
    [{ deviceIndex: 31, interfaceLabel: "WAN1", direction: "tx" }, /deviceIndex/],
    [{ deviceIndex: 1, interfaceLabel: "WAN3", direction: "tx" }, /interfaceLabel/],
  ],
});

describeOperation({
  operation: showStatisticReset,
  classification: "write",
  valid: [[{ interfaceLabel: "WAN5" }, "show statistic reset WAN5"]],
  invalid: [[{ interfaceLabel: "LAN1" }, /interfaceLabel/]],
});

describeOperation({
  operation: serviceRefresh,
  classification: "read",
  valid: [[undefined, "service -r"]],
});

describeOperation({
  operation: serviceLogin,
  classification: "write",
  valid: [[{ account: "carrieni", password: "s3cret" }, "service -l carrieni s3cret"]],
  invalid: [[{ account: "two words", password: "x" }, /account/]],
});

describeOperation({
  operation: serviceTransferOwner,
  classification: "write",
  valid: [
    [{ newOwner: "bob", newOwnerEmail: "bob@example.com" }, "service -i bob bob@example.com"],
  ],
});

describeOperation({
  operation: serviceTransfer,
  classification: "destructive",
  valid: [
    [{ confirm: true }, "service -t yes"],
    [{ confirm: false }, "service -t no"],
  ],
});

describeOperation({
  operation: serviceClear,
  classification: "destructive",
  valid: [[undefined, "service -c"]],
});
