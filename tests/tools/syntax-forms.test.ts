import { describe, expect, it } from "vitest";

import {
  extractSyntaxForms,
  formMatchesCommand,
  tokenizeForm,
} from "../../tools/manifest/syntax-forms.ts";

function doubled(text: string): string {
  return text.replace(/./g, "$&$&");
}

describe("extractSyntaxForms", () => {
  it("reads every Syntax line, across page breaks, until the description", () => {
    const raw = [
      doubled("Telnet Command: wan detect"),
      "This command allows you to Ping.",
      "SSyynnttaaxx    ",
      "wan detect <wan1/wan2/...> <on/off>",
      "===PAGE 795===",
      " ",
      "Vigor3912 Series User's Guide 785",
      "wan detect status ",
      "SSyynnttaaxx  DDeessccrriippttiioonn  ",
      "wan detect should not be read",
      doubled("Telnet Command: ip arp"),
      "SSyynnttaaxx    ",
      "ip arp flush",
      "In which, arp flush clears the cache.",
      "ip arp not a form",
    ].join("\n");

    expect(extractSyntaxForms(raw)).toEqual([
      { heading: "wan detect", rawLine: 4, form: "wan detect <wan1/wan2/...> <on/off>" },
      { heading: "wan detect", rawLine: 8, form: "wan detect status" },
      { heading: "ip arp", rawLine: 13, form: "ip arp flush" },
    ]);
  });
});

describe("formMatchesCommand", () => {
  it.each([
    [
      "ip arp add <IP address> <MAC address> <LAN or WAN>",
      "ip arp add 1.1.1.1 AA:BB:CC:DD:EE:FF LAN",
      true,
    ],
    ["ip arp add <IP address> <MAC address> <LAN or WAN>", "ip arp add 1.1.1.1", false],
    ["ip arp flush", "ip arp flush now", false],
    ["IP ARP FLUSH", "ip arp flush", true],
    ["csm wcf obj INDEX -a P|B", "csm wcf obj 3 -a P", true],
    ["ha show –c", "ha show -c", true],
    ["vpn list<index> out", "vpn list 2 out", true],
    ["show traffic ip [1/0]", "show traffic ip", true],
    ["linux setlinuxip <-i IP> <-c CIDR>", "linux setlinuxip -i 1.1.1.1 -c 24", true],
    ["linux setlinuxip <-i IP> <-c CIDR>", "linux status", false],
    ["dos <-a | e <ATTACK_F>>", "dos -a", true],
    ["wan detect ?", "wan detect wan1 on", true],
  ] as const)("%j vs %j -> %s", (form, command, expected) => {
    expect(formMatchesCommand(form, command)).toBe(expected);
  });

  it("tokenizes literals, values and trailing rest", () => {
    expect(tokenizeForm("sys time zone <index> [more]")).toEqual([
      { kind: "literal", text: "sys" },
      { kind: "literal", text: "time" },
      { kind: "literal", text: "zone" },
      { kind: "value" },
      { kind: "rest" },
    ]);
  });
});
