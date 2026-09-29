/**
 * Firmware 4.4.7_RC2 command-tree entries (`references/live-inventory-fw-
 * 4.4.7_RC2.json`) with no SDK operation, each with the reason. The live
 * inventory census (`tests/features/live-inventory.test.ts`) fails on any
 * other unmatched entry and on a listed entry that has since been matched.
 * Keys are `<family>` or `<family> <subcommand>` exactly as listed.
 */
export const LIVE_INVENTORY_EXCLUSIONS: Readonly<Record<string, string>> = {
  cert: "`cert ?` prints no usage on fw 4.4.7_RC2; syntax unknown (not in any manual).",
  "csm quic": "`csm ?` lists `quic: Quic parser setting` without syntax; not in any manual.",
  "dpdk accpkt": "`dpdk ?` lists the name only; syntax not documented or printed.",
  "dpdk antidos": "`dpdk ?` lists the name only; syntax not documented or printed.",
  "dpdk fastrt": "`dpdk ?` lists the name only; syntax not documented or printed.",
  "dpdk loopd": "`dpdk ?` lists the name only; syntax not documented or printed.",
  "dpdk proto": "`dpdk ?` lists the name only; syntax not documented or printed.",
  "dpdk pcap": "`dpdk ?` lists the name only; syntax not documented or printed.",
  "dpdk pktlog": "`dpdk ?` lists the name only; syntax not documented or printed.",
  "dpdk say": "`dpdk ?` lists the name only; syntax not documented or printed.",
  "ip dnssec": "`ip dnssec ?` prints no usage on fw 4.4.7_RC2; syntax unknown.",
  "ip6 debug": "`ip6 debug ?` lists `type` / `level` without value syntax; debug-only.",
  "mngt acme": "Listed by `mngt ?` but `mngt acme ?` answers `invalid command !!` on fw 4.4.7_RC2.",
  "swm tr069":
    "Listed by `swm ?`; absent from every manual and `swm tr069 ?` has not been captured, so no verified syntax.",
  "sys cancel": "`sys cancel ?` prints no usage on fw 4.4.7_RC2; syntax unknown.",
  "sys halt":
    "Halts the router; its help was deliberately not queried on the production unit, so no verified syntax.",
};
