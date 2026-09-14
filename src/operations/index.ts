/**
 * GENERATED FILE — do not hand-edit.
 * Produced by tools/generate-capability-manifest.ts.
 */

import * as apm from "../domains/apm.js";
import * as appqos from "../domains/appqos.js";
import * as csm from "../domains/csm.js";
import * as ddns from "../domains/ddns.js";
import * as dos from "../domains/dos.js";
import * as dpdk from "../domains/dpdk.js";
import * as fs from "../domains/fs.js";
import * as ha from "../domains/ha.js";
import * as hsportal from "../domains/hsportal.js";
import * as internet from "../domains/internet.js";
import * as ip from "../domains/ip.js";
import * as ip6 from "../domains/ip6.js";
import * as ipf from "../domains/ipf.js";
import * as ldap from "../domains/ldap.js";
import * as linux from "../domains/linux.js";
import * as local_8021x from "../domains/local_8021x.js";
import * as log from "../domains/log.js";
import * as mngt from "../domains/mngt.js";
import * as msubnet from "../domains/msubnet.js";
import * as nand from "../domains/nand.js";
import * as object from "../domains/object.js";
import * as port from "../domains/port.js";
import * as portmaptime from "../domains/portmaptime.js";
import * as qos from "../domains/qos.js";
import * as radius from "../domains/radius.js";
import * as service from "../domains/service.js";
import * as show from "../domains/show.js";
import * as srv from "../domains/srv.js";
import * as switchDomain from "../domains/switch.js";
import * as swm from "../domains/swm.js";
import * as sys from "../domains/sys.js";
import * as tacacsplus from "../domains/tacacsplus.js";
import * as testmail from "../domains/testmail.js";
import * as upnp from "../domains/upnp.js";
import * as usb from "../domains/usb.js";
import * as user from "../domains/user.js";
import * as vigbrg from "../domains/vigbrg.js";
import * as vlan from "../domains/vlan.js";
import * as vpn from "../domains/vpn.js";
import * as vrrp from "../domains/vrrp.js";
import * as wan from "../domains/wan.js";
import * as wol from "../domains/wol.js";

export const operations = {
  apm,
  appqos,
  csm,
  ddns,
  dos,
  dpdk,
  fs,
  ha,
  hsportal,
  internet,
  ip,
  ip6,
  ipf,
  ldap,
  linux,
  local_8021x,
  log,
  mngt,
  msubnet,
  nand,
  object,
  port,
  portmaptime,
  qos,
  radius,
  service,
  show,
  srv,
  switch: switchDomain,
  swm,
  sys,
  tacacsplus,
  testmail,
  upnp,
  usb,
  user,
  vigbrg,
  vlan,
  vpn,
  vrrp,
  wan,
  wol,
} as const;

export type { TypedOperation, OperationClassification } from "../internal/registry/operation.js";
export type { CommandExchange } from "../internal/execution/transport.js";
export type { CommandFrame } from "../internal/execution/framing.js";
export type { ExecutionLimits } from "../internal/execution/limits.js";
