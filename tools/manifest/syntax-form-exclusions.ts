/**
 * Documented Part VIII syntax forms that no unit-tested command instantiates
 * literally, each with the reason (manual misprint, bare-word placeholder,
 * pointer to another heading, usage help, interactive session). The
 * sub-form census fails on any other uncovered form and on a listed form
 * that has since become covered, so this list can only shrink.
 */

export const SYNTAX_FORM_EXCLUSIONS: Readonly<Record<string, string>> = {
  "csm ucf obj INDEX uac":
    "Pointer to the separate `csm ucf obj INDEX uac` heading (cli.csm.ucf.obj.index.uac), not a standalone command.",
  "csm ucf obj INDEX wf":
    "Pointer to the separate `csm ucf obj INDEX wf` heading (cli.csm.ucf.obj.index.wf), not a standalone command.",
  "ddns set option <value>":
    "Placeholder written as the bare word `option`; every documented flag is modelled by cli.ddns.set / cli.ddns.set.update.",
  "dos -P <add4/remove4><type><value> |<add6/remove6><type><value> | <show>| remove4":
    "Typeset alternation of `dos -P add4|remove4|add6|remove6 <value>` / `dos -P show`; covered by cli.dos tests.",
  "ip telnet [IP address][Port]":
    "Opens an interactive nested telnet session to another host; cannot fit the bounded single-exchange model (manifest cli.ip.telnet is blocked-by-documentation).",
  "ip maxnatuser user no":
    "Placeholder written as the bare words `user no` (a number); covered by cli.ip.maxnatuser (`ip maxnatuser <count>`).",
  "ip6 route -D":
    "Per the parameter table `-D` is a modifier of `ip6 route -s` (treat the route as default), not a standalone command; covered by cli.ip6.route set with asDefault.",
  "ip6 ntp –h": "Usage help only (prints the syntax); no configuration or state.",
  "ip6 bandwidth del <IP1> /all":
    "Manual typesetting of `ip6 bandwidth del <IP1|all>`; covered by cli.ip6.bandwidth delete / deleteAll.",
  "tacacspluse set <Options><Value>":
    "Manual misprint of `tacacsplus set`; covered by cli.tacacsplus.set.",
  "tacacspluse view": "Manual misprint of `tacacsplus view`; covered by cli.tacacsplus.view.",
  "mngt ip6-IIDs -e <val>>":
    "Manual misprint of `mngt ip6_IIDs -e <val>` (hyphen, stray `>`); covered by cli.mngt.ip6iids setMode.",
  "msubnet secWINS % msubnet secWINS <2/3/4/5/6/7/8/9/10/11/12/13/14/15/16/17/18/19/20/21/22/23/24/25/26/27/28/29/30/31/32/33/34/35/36/37/38/39/40/41/42/43/44/45/46/47/48/49/50/51/52/53/54/55/56/57/58/59/60/61/62/63/64/65/66/67/68/69/70/71/72/73/74/75/76/77/78/79/80/81/82/83/84/85/86/87/88/89/90/91/92/93/94/95/96/97/98/99/100> <WINS IP>":
    "Manual misprint (heading text repeated as `% msubnet secWINS`); covered by cli.msubnet.secwins.",
  "object mail obj INDEX –e Category Status":
    "Manual misprint: listed under `object noti`; modelled as `object noti obj INDEX -e CATEGORY STATUS` (cli.object.noti.set).",
  "object mail obj INDEX –d Category Status":
    "Manual misprint: listed under `object noti`; modelled as `object noti obj INDEX -d CATEGORY STATUS` (cli.object.noti.set).",
  "srv dhcp option -h": "Usage help only (prints the syntax); no configuration or state.",
  "vlan group id <add/add_ex/set/set_ex/show> < p2/p4/p9/p10/p11/p12>":
    "Placeholder written as the bare word `id` (group id); covered by cli.vlan.group (add/add_ex/set/set_ex/show).",
  "vpn openvpn hmacmode <0/1/2>":
    "Manual misprint of `vpn ovpn hmacmode <0/1/2>` (listed under `vpn ovpn`); covered by cli.vpn.ovpn with param `hmacmode 1`.",
  "linux clean - a / -b / -d / -o /-w":
    "Typeset form of `linux clean -a|-b|-d|-o|-w`; covered by cli.linux.clean.a/.b/.d/.o/.w.",
};
