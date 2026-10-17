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

  it("joins wrapped values with the documented punctuation and spacing rules", () => {
    const raw = [
      doubled("Telnet Command: wan route"),
      "SSyynnttaaxx",
      "wan route <address>/",
      "24",
      doubled("Telnet Command: wan route"),
      "SSyynnttaaxx",
      "wan route <open",
      ">",
      doubled("Telnet Command: wan route"),
      "SSyynnttaaxx",
      "wan route [bracketed",
      "]",
      doubled("Telnet Command: wan route"),
      "SSyynnttaaxx",
      "wan route <1/8",
      "3/84>",
      doubled("Telnet Command: wan route"),
      "SSyynnttaaxx",
      "wan route",
      "<next>",
    ].join("\n");

    expect(extractSyntaxForms(raw).map(({ form }) => form)).toEqual([
      "wan route <address>/24",
      "wan route <open>",
      "wan route [bracketed]",
      "wan route <1/83/84>",
      "wan route <next>",
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

  it("ignores repeated whitespace and keeps malformed angle groups as one value", () => {
    expect(tokenizeForm("  sys   status  ")).toEqual([
      { kind: "literal", text: "sys" },
      { kind: "literal", text: "status" },
    ]);
    expect(tokenizeForm("show <<")).toEqual([{ kind: "literal", text: "show" }, { kind: "rest" }]);
  });

  it("recognizes compound values, placeholder words, and dashed choices", () => {
    expect(tokenizeForm("ip route <address>/<mask>")).toEqual([
      { kind: "literal", text: "ip" },
      { kind: "literal", text: "route" },
      { kind: "value" },
    ]);
    expect(tokenizeForm("set -s Service Provider")).toEqual([
      { kind: "literal", text: "set" },
      { kind: "literal", text: "-s" },
      { kind: "value" },
    ]);
    expect(tokenizeForm("set -h/l")).toEqual([
      { kind: "literal", text: "set" },
      { kind: "choice", options: ["-h", "-l"] },
    ]);
    expect(tokenizeForm("wan set <value>Mb")).toEqual([
      { kind: "literal", text: "wan" },
      { kind: "literal", text: "set" },
      { kind: "value" },
    ]);
  });

  it("matches alternatives and lets a trailing placeholder consume multiple words", () => {
    expect(formMatchesCommand("ip set enable/disable", "ip set disable")).toBe(true);
    expect(formMatchesCommand("ip set enable/disable", "ip set restart")).toBe(false);
    expect(formMatchesCommand("ip set port", "ip set 80 tcp")).toBe(true);
  });
});
