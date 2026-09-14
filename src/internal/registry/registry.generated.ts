/**
 * GENERATED FILE — do not hand-edit.
 *
 * Produced by `tools/generate-capability-manifest.ts` by `readdir`-ing
 * `src/domains/*.ts` and assembling every discovered module's `operations`
 * export via `assembleOperationRegistry` (see `self-assembly.ts` for the
 * required domain export convention).
 *
 * Regenerate with `npm run manifest:generate`; drift is caught by
 * `npm run manifest:check` (folded into `npm run verify`).
 */

import { operations as apmOperations } from "../../domains/apm.js";
import { operations as appqosOperations } from "../../domains/appqos.js";
import { operations as csmOperations } from "../../domains/csm.js";
import { operations as ddnsOperations } from "../../domains/ddns.js";
import { operations as dosOperations } from "../../domains/dos.js";
import { operations as dpdkOperations } from "../../domains/dpdk.js";
import { operations as fsOperations } from "../../domains/fs.js";
import { operations as haOperations } from "../../domains/ha.js";
import { operations as hsportalOperations } from "../../domains/hsportal.js";
import { operations as internetOperations } from "../../domains/internet.js";
import { operations as ipOperations } from "../../domains/ip.js";
import { operations as ip6Operations } from "../../domains/ip6.js";
import { operations as ipfOperations } from "../../domains/ipf.js";
import { operations as ldapOperations } from "../../domains/ldap.js";
import { operations as linuxOperations } from "../../domains/linux.js";
import { operations as local8021xOperations } from "../../domains/local_8021x.js";
import { operations as logOperations } from "../../domains/log.js";
import { operations as mngtOperations } from "../../domains/mngt.js";
import { operations as msubnetOperations } from "../../domains/msubnet.js";
import { operations as nandOperations } from "../../domains/nand.js";
import { operations as objectOperations } from "../../domains/object.js";
import { operations as portOperations } from "../../domains/port.js";
import { operations as portmaptimeOperations } from "../../domains/portmaptime.js";
import { operations as qosOperations } from "../../domains/qos.js";
import { operations as radiusOperations } from "../../domains/radius.js";
import { operations as serviceOperations } from "../../domains/service.js";
import { operations as showOperations } from "../../domains/show.js";
import { operations as srvOperations } from "../../domains/srv.js";
import { operations as switchOperations } from "../../domains/switch.js";
import { operations as swmOperations } from "../../domains/swm.js";
import { operations as sysOperations } from "../../domains/sys.js";
import { operations as tacacsplusOperations } from "../../domains/tacacsplus.js";
import { operations as testmailOperations } from "../../domains/testmail.js";
import { operations as upnpOperations } from "../../domains/upnp.js";
import { operations as usbOperations } from "../../domains/usb.js";
import { operations as userOperations } from "../../domains/user.js";
import { operations as vigbrgOperations } from "../../domains/vigbrg.js";
import { operations as vlanOperations } from "../../domains/vlan.js";
import { operations as vpnOperations } from "../../domains/vpn.js";
import { operations as vrrpOperations } from "../../domains/vrrp.js";
import { operations as wanOperations } from "../../domains/wan.js";
import { operations as wolOperations } from "../../domains/wol.js";

import { assembleOperationRegistry } from "./registry.js";
import type { OperationRegistry } from "./operation.js";

export const operationRegistry: OperationRegistry = assembleOperationRegistry([
  ...apmOperations,
  ...appqosOperations,
  ...csmOperations,
  ...ddnsOperations,
  ...dosOperations,
  ...dpdkOperations,
  ...fsOperations,
  ...haOperations,
  ...hsportalOperations,
  ...internetOperations,
  ...ipOperations,
  ...ip6Operations,
  ...ipfOperations,
  ...ldapOperations,
  ...linuxOperations,
  ...local8021xOperations,
  ...logOperations,
  ...mngtOperations,
  ...msubnetOperations,
  ...nandOperations,
  ...objectOperations,
  ...portOperations,
  ...portmaptimeOperations,
  ...qosOperations,
  ...radiusOperations,
  ...serviceOperations,
  ...showOperations,
  ...srvOperations,
  ...switchOperations,
  ...swmOperations,
  ...sysOperations,
  ...tacacsplusOperations,
  ...testmailOperations,
  ...upnpOperations,
  ...usbOperations,
  ...userOperations,
  ...vigbrgOperations,
  ...vlanOperations,
  ...vpnOperations,
  ...vrrpOperations,
  ...wanOperations,
  ...wolOperations,
]);
