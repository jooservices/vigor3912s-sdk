/**
 * Hand-maintained classification tables (never inferred from the command
 * string). Pure data.
 */

// ---------------------------------------------------------------------------
// Classification: hand-maintained lookup table only, never inferred from the
// command string. Cross-references `command-map.md`'s two literally-named
// categorized table families:
//   - "Status & diagnostics (read-only, safe)"  -> classification: "read"
//   - the four "... (write — require confirm[+commit])" tables -> "write"
// Commands from every *other* command-map.md section (Objects & firewall,
// VPN, QoS/services/misc, Linux application, etc.) are intentionally left
// out of this table and stay "unknown"/"unclassified" — those sections are
// not literally one of the two table families this task scopes in.
// ---------------------------------------------------------------------------

/** Exact family-key matches from command-map.md's "Status & diagnostics (read-only, safe)" table. */
export const READ_ONLY_FAMILIES: ReadonlySet<string> = new Set([
  "show status",
  "show lan",
  "show dmz",
  "show dns",
  "show openport",
  "show nat",
  "show portmap",
  "show pmtime",
  "show session",
  "show traffic",
  "show clienttraffic",
  "show statistic",
  "sys version",
  "sys cmdlog",
  "sys cc",
  "sys qrybuf",
  "sys health",
  "wan status",
  "ip ping",
  "ip tracert",
  "ip6 ping",
  "ip6 tracert",
]);

/**
 * Exact family-key matches from command-map.md's four "write — require
 * confirm[+commit]" tables (System / Management-access / WAN /
 * LAN-DHCP-NAT). Deliberately excludes `sys cfg status`, `sys cfg default`,
 * `mngt rmtcfg status`, `mngt rmtcfg enable`, `mngt rmtcfg disable` — those
 * commands live under the single `sys cfg` / `mngt rmtcfg` CLI headings that
 * the danger-list overlay (below) already claims in full; see this file's
 * "Danger list" comment for why the whole heading is excluded rather than
 * split at the subcommand level. `wan status` is intentionally omitted here
 * even though command-map.md's WAN table also lists it — the "Status &
 * diagnostics" table already classifies it "read", which takes precedence.
 * Also deliberately excludes `wan detect`, `ip arp`, `ip route`, `ip
 * session` (S2, `IMPLEMENTATION.md`) — those four headings moved to
 * `SPLIT_FAMILIES`, which now claims their entire heading (read sub-form +
 * new write sub-forms), same reasoning as the `sys cfg` / `mngt rmtcfg`
 * exclusion above.
 */
export const WRITE_FAMILIES: ReadonlySet<string> = new Set([
  // System (write — require confirm + commit)
  "sys passwd",
  "sys autoreboot",
  "sys commit",
  "sys name",
  "sys domainname",
  "sys tftpd",
  "sys syslog",
  "sys mailalert",
  "sys webhook",
  "sys tr069",
  "sys license",
  "sys alg",
  // Management / access (write — require confirm)
  "mngt sshport",
  "mngt telnetport",
  "mngt httpport",
  "mngt httpsport",
  "mngt ftpport",
  "mngt sslvpnport",
  "mngt accesslist",
  "mngt wanlogin",
  "mngt bfp",
  "mngt snmp",
  "mngt noping",
  "mngt echoicmp",
  "mngt defenseworm",
  "mngt telnettimeout",
  "mngt sshtimeout",
  // WAN (write — require confirm)
  "wan enable",
  "wan disable",
  "wan mtu",
  "wan ppp_mru",
  "wan dns",
  "wan detect_mtu",
  "wan detect_mtu6",
  "wan lb",
  "wan failover",
  "wan forward",
  "wan vlan",
  "wan mvlan",
  "wan budget",
  // LAN / DHCP / NAT (write — require confirm)
  "srv dhcp on",
  "srv dhcp off",
  "srv dhcp dns1",
  "srv dhcp dns2",
  "srv dhcp gateway",
  "srv dhcp startip",
  "srv dhcp leasetime",
  "srv dhcp status",
  "srv dhcp relay",
  "srv nat dmz",
  "srv nat openport",
  "srv nat portmap",
  "srv nat trigger",
  "ip addr",
  "ip nmask",
  "ip pubaddr",
  "ip lanalias",
  "ip dhcpc",
  "ip bindmac",
  "ip bandwidth",
  "vlan group",
  "vlan on",
  "vlan off",
  "vlan status",
  "vlan vid",
  "vlan subnet",
  "vlan tagged",
  "vlan sysvid",
]);

/**
 * command-map.md documents these two families with an explicit "..."
 * ellipsis (`mngt lanaccess ...`, `msubnet ...`) meaning "the whole family",
 * rather than enumerating variants — so a prefix match is the literal
 * source, not an inference.
 */
export const WRITE_FAMILY_PREFIXES: readonly string[] = ["mngt lanaccess", "msubnet"];

/**
 * Sibling live-verified classification overlay (root audit, 2026-09-13,
 * `ARCHITECTURE.md`'s "Amendment 2026-09-13 (root audit, `sibling-live-verified`
 * classification basis added)"). Cross-references the sibling
 * `projects/vigor3912s-mcp` project's `src/commands/registry/families/*.ts` (217
 * commands / 42 families, **live-verified against the real router, fw
 * 4.4.7_RC2**), which is a stronger, per-command, device-verified evidence
 * source than `command-map.md`'s coarse per-family summary tables (the
 * source of `READ_ONLY_FAMILIES`/`WRITE_FAMILIES`/`WRITE_FAMILY_PREFIXES`
 * above). Every entry below is one of two kinds, produced by the audit:
 *
 *   - previously `"unknown"`/`"unclassified"` manifest entries that
 *     `vigor3912s-mcp` classifies consistently as one kind (`read` or
 *     `write`) — resolved here for the first time;
 *   - entries whose existing `command-map-family` classification actively
 *     *disagreed* with the live-verified kind (all corrected `write` ->
 *     `read`) — a correction, not an addition.
 *
 * Keyed by this SDK's own manifest `id` (not the sibling project's
 * `snake_case` tool ids — consulted for evidence only, never imported or
 * depended on at runtime; see the citation comment on each row). Takes
 * priority over `command-map-family`/danger-list/streaming-derived
 * classification for any id it covers (`buildCliEntriesForHeading` below
 * applies it as a final overlay onto `classifyCliCommand`'s result), since it
 * is device-verified rather than inferred from a documentation summary
 * table. It only ever overrides the `classification`/`classificationBasis`
 * fields — never `status`/`blockedReason` (e.g. `cli.log` stays
 * `status: "blocked-by-documentation"` for its documented streaming/tail
 * sub-form even though its overall family is now known to be read-shaped;
 * `classification` and `status` are independent axes per the existing
 * "destructive is classification, not exclusion" precedent).
 */
export const SIBLING_LIVE_VERIFIED_CLASSIFICATION: Readonly<Record<string, "read" | "write">> = {
  "cli.csm.appe.set": "write", // vigor3912s-mcp: csm_appe_set, live-verified fw 4.4.7_RC2
  "cli.csm.appe.show": "read", // vigor3912s-mcp: csm_appe_show, live-verified fw 4.4.7_RC2
  "cli.csm.ucf": "write", // vigor3912s-mcp: csm_ucf, live-verified fw 4.4.7_RC2
  "cli.csm.ucf.obj.index.uac": "write", // vigor3912s-mcp: csm_ucf, live-verified fw 4.4.7_RC2
  "cli.csm.ucf.obj.index.eac": "write", // vigor3912s-mcp: csm_ucf, live-verified fw 4.4.7_RC2
  "cli.csm.ucf.obj.index.wf": "write", // vigor3912s-mcp: csm_ucf, live-verified fw 4.4.7_RC2
  "cli.csm.wcf": "write", // vigor3912s-mcp: csm_wcf, live-verified fw 4.4.7_RC2
  "cli.csm.dnsf": "write", // vigor3912s-mcp: csm_dnsf, live-verified fw 4.4.7_RC2
  "cli.ddns.enable": "write", // vigor3912s-mcp: ddns_enable, live-verified fw 4.4.7_RC2
  "cli.ddns.log": "read", // vigor3912s-mcp: ddns_log, live-verified fw 4.4.7_RC2
  "cli.ddns.forceupdate": "write", // vigor3912s-mcp: ddns_forceupdate, live-verified fw 4.4.7_RC2
  "cli.ddns.show": "read", // vigor3912s-mcp: ddns_show, live-verified fw 4.4.7_RC2
  "cli.ip.landnsres": "read", // vigor3912s-mcp: ip_lanDNSRes, live-verified fw 4.4.7_RC2
  "cli.ip.dnsforward": "read", // vigor3912s-mcp: ip_dnsforward, live-verified fw 4.4.7_RC2
  "cli.ip6.addr": "write", // vigor3912s-mcp: ip6_addr, live-verified fw 4.4.7_RC2
  "cli.ip6.mngt": "write", // vigor3912s-mcp: ip6_mngt, live-verified fw 4.4.7_RC2
  "cli.ipf.view": "read", // vigor3912s-mcp: ipf_view, live-verified fw 4.4.7_RC2
  "cli.ipf.set": "write", // vigor3912s-mcp: ipf_set, live-verified fw 4.4.7_RC2
  "cli.ipf.rule": "write", // vigor3912s-mcp: ipf_rule, live-verified fw 4.4.7_RC2
  "cli.ldap.user": "write", // vigor3912s-mcp: ldap_user, live-verified fw 4.4.7_RC2
  "cli.ldap.set": "write", // vigor3912s-mcp: ldap_set, live-verified fw 4.4.7_RC2
  "cli.ldap.view": "read", // vigor3912s-mcp: ldap_view, live-verified fw 4.4.7_RC2
  "cli.tacacsplus.set": "write", // vigor3912s-mcp: tacacsplus_set, live-verified fw 4.4.7_RC2
  "cli.tacacsplus.view": "read", // vigor3912s-mcp: tacacsplus_view, live-verified fw 4.4.7_RC2
  "cli.object.ip.obj": "read", // vigor3912s-mcp: object_ip_view, live-verified fw 4.4.7_RC2
  "cli.object.service.obj": "read", // vigor3912s-mcp: object_service_view, live-verified fw 4.4.7_RC2
  "cli.qos.setup": "write", // vigor3912s-mcp: qos_setup, live-verified fw 4.4.7_RC2
  "cli.qos.class": "write", // vigor3912s-mcp: qos_class, live-verified fw 4.4.7_RC2
  "cli.switch.status": "read", // vigor3912s-mcp: switch_status, live-verified fw 4.4.7_RC2
  "cli.switch.on": "write", // vigor3912s-mcp: switch_on, live-verified fw 4.4.7_RC2
  "cli.switch.off": "write", // vigor3912s-mcp: switch_off, live-verified fw 4.4.7_RC2
  "cli.switch.list": "read", // vigor3912s-mcp: switch_list, live-verified fw 4.4.7_RC2
  "cli.switch.query": "read", // vigor3912s-mcp: switch_query, live-verified fw 4.4.7_RC2
  // The next 6 entries reconcile a genuine tension flagged by review: the
  // vendor PDF (v4.3.5.1) only documents a SET syntax for `sys pollbuf
  // on|off`, `sys max_session <300K/500K/1000K>`, and (for `sys time`) a
  // set-time form -- no bare/no-arg query form is spelled out in the PDF text
  // for any of the 6 below. `vigor3912s-mcp`'s registry classifies all 6 as
  // `R()` (read) using the exact bare command with zero arguments, and its
  // README states its 108 `R()` entries were "all verified against the real
  // router" (fw 4.4.7_RC2) -- i.e. this is a live-observed behavior, not a
  // guess. This is a well-known DrayOS CLI convention also visible elsewhere
  // in this same manifest (e.g. many `sys`/`show` commands: bare invocation
  // displays current state, an argument changes it) -- the PDF documents only
  // the "how to configure" form and omits the inspection form as too obvious
  // to state. Accepted as `sibling-live-verified` read evidence. All 6 are
  // now implemented as `TypedOperation`s in `src/domains/sys.ts` (Wave 4
  // completion push, 2026-09-13); only `cli.sys.admin` remains genuinely
  // deferred (see `src/domains/sys.ts`'s `deferredUnknownSysIds`).
  "cli.sys.pollbuf": "read", // vigor3912s-mcp: sys_pollbuf, live-verified fw 4.4.7_RC2 (bare-invocation query; PDF only documents on|off set form)
  "cli.sys.frlog": "read", // vigor3912s-mcp: sys_fr_log, live-verified fw 4.4.7_RC2
  "cli.sys.dnscachetbl": "read", // vigor3912s-mcp: sys_dnsCacheTbl, live-verified fw 4.4.7_RC2
  "cli.sys.time": "read", // vigor3912s-mcp: sys_time, live-verified fw 4.4.7_RC2 (bare-invocation query; PDF only documents a set-time form)
  "cli.sys.dashboard": "read", // vigor3912s-mcp: sys_dashboard, live-verified fw 4.4.7_RC2
  "cli.sys.maxsession": "read", // vigor3912s-mcp: sys_max_session, live-verified fw 4.4.7_RC2 (bare-invocation query; PDF only documents the <300K/500K/1000K> set form)
  "cli.testmail": "write", // vigor3912s-mcp: testmail_send, live-verified fw 4.4.7_RC2
  "cli.upnp.off": "write", // vigor3912s-mcp: upnp_off, live-verified fw 4.4.7_RC2
  "cli.upnp.on": "write", // vigor3912s-mcp: upnp_on, live-verified fw 4.4.7_RC2
  "cli.upnp.nat": "read", // vigor3912s-mcp: upnp_nat, live-verified fw 4.4.7_RC2
  "cli.usb.devstat": "read", // vigor3912s-mcp: usb_devstat, live-verified fw 4.4.7_RC2
  "cli.usb.temp": "read", // vigor3912s-mcp: usb_temp, live-verified fw 4.4.7_RC2
  "cli.vigbrg.set": "write", // vigor3912s-mcp: vigbrg_set, live-verified fw 4.4.7_RC2
  "cli.vigbrg.status": "read", // vigor3912s-mcp: vigbrg_status, live-verified fw 4.4.7_RC2
  "cli.vigbrg.wanstatus": "read", // vigor3912s-mcp: vigbrg_wanstatus, live-verified fw 4.4.7_RC2
  "cli.vigbrg.wlanstatus": "read", // vigor3912s-mcp: vigbrg_wlanstatus, live-verified fw 4.4.7_RC2
  "cli.vpn.setup": "write", // vigor3912s-mcp: vpn_setup, live-verified fw 4.4.7_RC2
  "cli.vpn.list": "read", // vigor3912s-mcp: vpn_list, live-verified fw 4.4.7_RC2
  "cli.vpn.remote": "read", // vigor3912s-mcp: vpn_remote, live-verified fw 4.4.7_RC2
  "cli.vpn.ovpn": "write", // vigor3912s-mcp: vpn_ovpn, live-verified fw 4.4.7_RC2
  "cli.vpn.dialout": "write", // vigor3912s-mcp: vpn_dial_out, live-verified fw 4.4.7_RC2
  "cli.hsportal.setup": "write", // vigor3912s-mcp: hsportal_setup, live-verified fw 4.4.7_RC2
  "cli.hsportal.info": "read", // vigor3912s-mcp: hsportal_info, live-verified fw 4.4.7_RC2
  "cli.hsportal.level": "read", // vigor3912s-mcp: hsportal_level, live-verified fw 4.4.7_RC2
  "cli.local8021x": "read", // vigor3912s-mcp: local8021x_show, local8021x_show_local_cer, live-verified fw 4.4.7_RC2
  "cli.wol": "write", // vigor3912s-mcp: wol_send, live-verified fw 4.4.7_RC2
  "cli.user": "write", // vigor3912s-mcp: user_account, user_edit, user_set, user_setdefault, live-verified fw 4.4.7_RC2
  "cli.nand.bad.nand.usage": "read", // vigor3912s-mcp: nand_bad, live-verified fw 4.4.7_RC2
  "cli.apm.stanum": "read", // vigor3912s-mcp: apm_stanum, live-verified fw 4.4.7_RC2
  "cli.ha.set": "write", // vigor3912s-mcp: ha_set, live-verified fw 4.4.7_RC2
  "cli.ha.show": "read", // vigor3912s-mcp: ha_show, live-verified fw 4.4.7_RC2
  "cli.ha.status": "read", // vigor3912s-mcp: ha_status, live-verified fw 4.4.7_RC2
  "cli.swm.show": "read", // vigor3912s-mcp: swm_show, live-verified fw 4.4.7_RC2
  "cli.swm.get": "read", // vigor3912s-mcp: swm_get, live-verified fw 4.4.7_RC2
  "cli.swm.post": "write", // vigor3912s-mcp: swm_post, live-verified fw 4.4.7_RC2
  "cli.swm.enable.disable": "write", // vigor3912s-mcp: swm_enable, live-verified fw 4.4.7_RC2
  "cli.swm.group": "write", // vigor3912s-mcp: swm_group, live-verified fw 4.4.7_RC2
  "cli.swm.profile": "write", // vigor3912s-mcp: swm_profile, live-verified fw 4.4.7_RC2
  "cli.swm.detail": "write", // vigor3912s-mcp: swm_detail, live-verified fw 4.4.7_RC2
  "cli.swm.maintain": "write", // vigor3912s-mcp: swm_maintain, live-verified fw 4.4.7_RC2
  "cli.swm.search": "write", // vigor3912s-mcp: swm_search, live-verified fw 4.4.7_RC2
  "cli.swm.db": "write", // vigor3912s-mcp: swm_db, live-verified fw 4.4.7_RC2
  "cli.swm.alert": "write", // vigor3912s-mcp: swm_alert, live-verified fw 4.4.7_RC2
  "cli.swm.log": "write", // vigor3912s-mcp: swm_log, live-verified fw 4.4.7_RC2
  "cli.swm.snmp": "write", // vigor3912s-mcp: swm_snmp, live-verified fw 4.4.7_RC2
  "cli.service": "read", // vigor3912s-mcp: service_show, service_get, live-verified fw 4.4.7_RC2
  // `cli.ip.arp` / `cli.ip.route` / `cli.ip.session` / `cli.wan.detect` moved
  // to `SPLIT_FAMILIES` below (S2, `IMPLEMENTATION.md`): their read
  // sub-command entry carries this same `"sibling-live-verified"` basis
  // directly there now, alongside their new write sub-form siblings.
  "cli.msubnet.status": "read", // vigor3912s-mcp: msubnet_status, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.srv.dhcp.status": "read", // vigor3912s-mcp: dhcp_status, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.vlan.status": "read", // vigor3912s-mcp: vlan_status, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.wan.detectmtu": "read", // vigor3912s-mcp: wan_detect_mtu, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
  "cli.wan.detectmtu6": "read", // vigor3912s-mcp: wan_detect_mtu6, live-verified fw 4.4.7_RC2 (corrects sdk classification "write")
};

/**
 * `operations.md` "Danger list (never run)": `sys cfg default`, `sys
 * reboot`, `mngt rmtcfg enable`, `linux clean -w`/`-o`.
 *
 * Amended 2026-09-13 (`ARCHITECTURE.md` amendment note + updated Item 1):
 * the SDK does not exclude anything from the manifest — `"destructive"` is
 * accurate classification metadata only, same status shape
 * (`status: "documented"`) as any other command. Of the four danger-list
 * commands, only `sys reboot` has a CLI heading dedicated to exactly that
 * command, so it is classified in place via this set. The other three share
 * a heading with non-dangerous siblings (`sys cfg` also documents `sys cfg
 * status`; `mngt rmtcfg` also documents `status`/`disable`/per-protocol
 * variants; `linux` also documents `status`/`service ssh
 * .../setlinuxip`/etc.) — those three headings are handled by
 * `SPLIT_FAMILIES` below instead, which emits one entry per real documented
 * command (each citing the same shared heading) so the destructive
 * subcommand gets its own accurate classification without over- or
 * under-classifying its siblings.
 */
export const DANGER_LIST_FAMILIES: ReadonlySet<string> = new Set(["sys reboot"]);

/**
 * Reserved for headings that are *only* continuous watch/tail with no
 * bounded single-exchange form in Part VIII. The `log` heading was previously
 * blocked wholesale citing `log -wt`, but Part VIII only documents bounded
 * flags (`log [-cfhiptwx?] [-F ...]`) — those are split in `SPLIT_FAMILIES`
 * instead. Keep this set for future true streaming-only headings.
 */
export const STREAMING_FAMILIES: ReadonlySet<string> = new Set([]);

/**
 * Session-logout meta-commands (`ARCHITECTURE.md` amendment: exit/quit are not
 * SDK device operations). Same blocked-status pattern as streaming blocks,
 * with an explicit session-meta reason.
 */
export const SESSION_META_FAMILIES: ReadonlyMap<string, string> = new Map([
  [
    "exit",
    "Session-logout meta-command (leaves the telnet/SSH CLI session); not an SDK device operation.",
  ],
  [
    "quit",
    "Session-logout meta-command (exits the telnet command screen); not an SDK device operation.",
  ],
]);

/**
 * Headings whose Part VIII text cannot support a safe, implementable
 * classification: no Parameter/Syntax Description, RD-only/test-mode prose,
 * or explicitly "for future use". Prefer `blocked-by-documentation` over
 * leaving `unknown` when the heading is not implementable from the corpus.
 */
export const DOCUMENTATION_BLOCKED_FAMILIES: ReadonlyMap<string, string> = new Map([
  [
    "hsportal pin_gen",
    'Part VIII documents only "This command is for future use" with no Syntax/Parameter Description.',
  ],
  [
    "ipf flowtest",
    "Part VIII names an RD firewall-diagnose debug command with no Syntax/Parameter Description.",
  ],
  [
    "sys admin",
    "Part VIII documents RD engineer test-mode access with no Syntax/Parameter Description.",
  ],
  [
    "ip telnet",
    "Opens a nested interactive telnet session to another device; does not fit the bounded single-exchange execution model (ARCHITECTURE.md Item 3).",
  ],
]);

/**
 * Per-manifest-id classification from Part VIII Syntax / Parameter Description
 * (basis `documented-syntax`). Applied as an overlay like
 * `SIBLING_LIVE_VERIFIED_CLASSIFICATION` for headings that stay one entry
 * (not split). Never inferred from the command name alone — each id was
 * checked against `cli-reference-raw.txt` at its citation `rawLine`.
 */
export const DOCUMENTATION_SYNTAX_CLASSIFICATION: Readonly<Record<string, "read" | "write">> = {
  // read — Parameter Description / intro documents display/view/status only
  "cli.csm.appe.config": "read", // display IM/P2P/Protocol configuration status
  "cli.ip6.tspc": "read", // display TSPC status
  "cli.ip6.online": "read", // check IPv6 LAN/WAN online status
  "cli.srv.nat.status": "read", // view NAT Port Redirection Running Table
  "cli.srv.nat.showall": "read", // view NAT redirection/openport/DMZ summary
  "cli.sys.iface": "read", // display interface UP/DOWN + addressing
  "cli.upnp.service": "read", // display UPnP service table
  "cli.upnp.subscribe": "read", // show UPnP subscriptions
  "cli.upnp.tmpvs": "read", // display temp Virtual Server status
  "cli.vpn.ike": "read", // display IKE memory status and leakage list
  "cli.apm.syslog": "read", // display central AP management syslog
  "cli.apm.apsyslog": "read", // display AP syslog data from VigorAP
  // `traffic on/off` turns the statistic function on or off (rawLine 7703-7707).
  "cli.switch.i": "write",
  // write — Parameter Description documents configure/set/enable/disable/mutate
  "cli.csm.appe.prof": "write",
  "cli.ddns.set": "write",
  "cli.ddns.time": "write",
  "cli.ddns.setdefault": "write",
  "cli.ip.pubsubnet": "write",
  "cli.ip.pubmask": "write",
  "cli.ip.rip": "write",
  "cli.ip.wanrip": "write",
  "cli.ip.maxnatuser": "write",
  "cli.ip.policyrt": "write",
  "cli.ip.spoofdef": "write",
  "cli.ip6.dhcp.reqopt": "write",
  "cli.ip6.dhcp.client": "write",
  "cli.ip6.dhcp.server": "write",
  "cli.ip6.dhcp.optionc": "write",
  "cli.ip6.dhcp.options": "write",
  "cli.ip6.internet": "write",
  "cli.ip6.pneigh": "write",
  "cli.ip6.route": "write",
  "cli.ip6.radvd": "write",
  "cli.ip6.aiccu": "write",
  "cli.ip6.lan": "write",
  "cli.ip6.session": "write",
  "cli.ip6.bandwidth": "write",
  "cli.mngt.certimport": "write",
  "cli.mngt.ip6iids": "write",
  "cli.object.ip.grp": "write",
  "cli.object.ipv6.obj": "write",
  "cli.object.ipv6.grp": "write",
  "cli.object.country": "write",
  "cli.object.service.grp": "write",
  "cli.object.kw": "write",
  "cli.object.fe": "write",
  "cli.object.sms": "write",
  "cli.object.mail": "write",
  "cli.object.noti": "write",
  "cli.object.schedule": "write",
  "cli.qos.type": "write",
  "cli.qos.voip": "write",
  "cli.srv.dhcp.dhcp2": "write",
  "cli.srv.dhcp.frcdnsmanl": "write",
  "cli.srv.dhcp.ipcnt": "write",
  "cli.srv.dhcp.nodetype": "write",
  "cli.srv.dhcp.primwins": "write",
  "cli.srv.dhcp.secwins": "write",
  "cli.srv.dhcp.expiredrecycleip": "write",
  "cli.srv.dhcp.tftp": "write",
  "cli.srv.dhcp.tftpdel": "write",
  "cli.srv.dhcp.option": "write",
  "cli.srv.nat.ipsecpass": "write",
  "cli.srv.nat.pseudoctl": "write",
  "cli.srv.nat.rsttimeout": "write",
  "cli.switch.notrespond": "write",
  "cli.switch.clear": "write",
  "cli.switch.syslog": "write",
  "cli.sys.adminuser": "write",
  "cli.sys.board": "write",
  "cli.sys.bonjour": "write",
  "cli.sys.ftpd": "write",
  "cli.sys.sipalg": "write",
  "cli.sys.rtspalg": "write",
  "cli.sys.arpautoreq": "write",
  "cli.sys.daylightsave": "write",
  "cli.sys.eaptls": "write",
  "cli.upnp.wan": "write",
  "cli.vigbrg.closeall": "write",
  "cli.vigbrg.cfgip": "write",
  "cli.vlan.pri": "write",
  "cli.vlan.restart": "write",
  "cli.vpn.l2lset": "write",
  "cli.vpn.l2ldrop": "write",
  "cli.vpn.l2ldialout": "write",
  "cli.vpn.dinset": "write",
  "cli.vpn.subnet": "write",
  "cli.vpn.option": "write",
  "cli.vpn.trunk": "write",
  "cli.vpn.netbios": "write",
  "cli.vpn.multicast": "write",
  "cli.vpn.pass2nd": "write",
  "cli.vpn.pass2nat": "write",
  "cli.vpn.samesubnet": "write",
  "cli.vpn.mirror": "write",
  "cli.vpn.isolate": "write",
  "cli.vpn.mfa": "write",
  "cli.wan.dfcheck": "write",
};
