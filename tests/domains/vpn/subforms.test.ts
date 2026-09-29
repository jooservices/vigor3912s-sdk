import {
  vpnDinset,
  vpnL2lDrop,
  vpnL2lSet,
  vpnListProfile,
  vpnOption,
  vpnOvpn,
  vpnRemoteSet,
  vpnSameSubnet,
} from "../../../src/domains/vpn.js";
import { describeOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: vpnListProfile,
  classification: "read",
  valid: (["all", "com", "out", "in", "net"] as const).map(
    (section) => [{ index: 1, section }, `vpn list 1 ${section}`] as const,
  ),
  invalid: [
    [{ index: 501, section: "all" }, /index must be between 1 and 500/],
    [{ index: 1, section: "dial" }, /section/],
  ],
});

describeOperation({
  operation: vpnRemoteSet,
  classification: "write",
  valid: [
    [{ service: "PPTP", enabled: true }, "vpn remote PPTP on"],
    [{ service: "WireGuard", enabled: false }, "vpn remote WireGuard off"],
    [{ service: "IPsec", wanInterface: "wan2", enabled: true }, "vpn remote IPsec wan2 on"],
  ],
  invalid: [
    [{ service: "GRE", enabled: true }, /service/],
    [{ service: "L2TP", wanInterface: "wan13", enabled: true }, /wanInterface/],
  ],
});

// Operations that take the documented trailing sub-command as one `param`:
// every documented form is exercised below.

describeOperation({
  operation: vpnL2lSet,
  classification: "write",
  valid: [
    "peerid peer.example",
    "localid local.example",
    "main auto",
    "aggressive aesg14",
    "pfs on",
    "phase1 28800",
    "phase2 3600",
    "x509localid 1",
    "compress 2",
  ].map((param) => [{ index: 1, param }, `vpn l2lset 1 ${param}`] as const),
  invalid: [[{ index: 1, param: "pfs on; reboot" }, /shell metacharacters/]],
});

describeOperation({
  operation: vpnL2lDrop,
  classification: "write",
  valid: [
    [{}, "vpn l2lDrop"],
    ...["l2lname branch", "l2lidx 3", "h2lname roadwarrior", "h2lidx 2", "3"].map(
      (param) => [{ param }, `vpn l2lDrop ${param}`] as const,
    ),
  ],
});

describeOperation({
  operation: vpnDinset,
  classification: "write",
  valid: [
    [{ index: 1 }, "vpn dinset 1"],
    ...[
      "username alice",
      "password s3cret",
      "motp on",
      "pin_secret 1234 abcdef",
      "timeout 300",
      "dintype PPTP on",
      "subnet 1",
      "assignip on",
      "srnode off",
      "remoteip 203.0.113.9",
      "peer peer-id",
      "naming pass",
      "multicastvpn block",
      "prekey on",
      "assignkey presharedkey",
      "digsig off",
      "ipsec AES on",
      "localid local-id",
    ].map((param) => [{ index: 1, param }, `vpn dinset 1 ${param}`] as const),
  ],
});

describeOperation({
  operation: vpnOption,
  classification: "write",
  valid: [
    [{ index: 1, param: "idle=250" }, "vpn option 1 idle=250"],
    [{ index: 2, param: "pname=carrietest idle=100" }, "vpn option 2 pname=carrietest idle=100"],
  ],
});

describeOperation({
  operation: vpnOvpn,
  classification: "write",
  valid: [
    "show",
    "udp_mode 1",
    "tcp_mode 0",
    "udp_port 1194",
    "tcp_port 443",
    "cert 1",
    "replay 1",
    "certmode 2",
    "hmacmode 1",
    "ca 3",
    "tlsauth_del 2",
  ].map((param) => [{ param }, `vpn ovpn ${param}`] as const),
});

describeOperation({
  operation: vpnSameSubnet,
  classification: "write",
  valid: [
    "-i 1 -e 192.168.1.0 -I 10.10.10.0 -o add",
    "-i 1",
    "-i 1 -E 1",
    "-i 1 -e 192.168.1.0",
    "-I 10.10.10.0",
    "-o add",
    "-v",
    "-m 1",
  ].map((param) => [{ param }, `vpn sameSubnet ${param}`] as const),
});
