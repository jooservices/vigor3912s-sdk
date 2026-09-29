/**
 * GENERATED FILE — do not hand-edit.
 *
 * Produced by `tools/generate-capability-manifest.ts` (via
 * `tools/generate-input-schemas.ts`) from every `src/domains/*.ts`
 * `TypedOperation<TInput, TOutput>` export's `TInput` type, resolved through
 * the TypeScript compiler API. Keyed by `manifestId`; `null` means the
 * operation takes no input (`TInput` is `void`).
 *
 * Regenerate with `npm run manifest:generate`; drift is caught by
 * `npm run manifest:check` (folded into `npm run verify`).
 */

import type { JsonSchema } from "./json-schema-types.js";

export const inputSchemas: Readonly<Record<string, JsonSchema | null>> = {
  "cli.apm.apsyslog": {
    type: "object",
    properties: {
      apIndex: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["apIndex"],
    additionalProperties: false,
  },
  "cli.apm.cache.clear": null,
  "cli.apm.cache.show": null,
  "cli.apm.clear": null,
  "cli.apm.disable": null,
  "cli.apm.discover": null,
  "cli.apm.enable": null,
  "cli.apm.lbcfg.set": {
    type: "object",
    properties: {
      enableLoadBalance: {
        type: "number",
        enum: [0, 1],
      },
      enableStationLimit: {
        type: "number",
        enum: [0, 1],
      },
      enableTrafficLimit: {
        type: "number",
        enum: [0, 1],
      },
      stationLimit: {
        type: "integer",
        minimum: 3,
        maximum: 64,
        description: "Documented station-limit count range: 3..64.",
      },
      enableUploadLimit: {
        type: "number",
        enum: [0, 1],
      },
      enableDownloadLimit: {
        type: "number",
        enum: [0, 1],
      },
      enableIdleDisassociation: {
        type: "number",
        enum: [0, 1],
      },
      enableSignalDisassociation: {
        type: "number",
        enum: [0, 1],
      },
      uploadUnit: {
        type: "number",
        enum: [0, 1],
        description: "0 = kbps, 1 = Mbps.",
      },
      downloadUnit: {
        type: "number",
        enum: [0, 1],
        description: "0 = kbps, 1 = Mbps.",
      },
      rssiThreshold: {
        type: "integer",
        minimum: -200,
        maximum: -50,
        description: "Documented RSSI threshold range: -200..-50.",
      },
    },
    required: [
      "enableLoadBalance",
      "enableStationLimit",
      "enableTrafficLimit",
      "stationLimit",
      "enableUploadLimit",
      "enableDownloadLimit",
      "enableIdleDisassociation",
      "enableSignalDisassociation",
      "uploadUnit",
      "downloadUnit",
      "rssiThreshold",
    ],
    additionalProperties: false,
  },
  "cli.apm.lbcfg.show": null,
  "cli.apm.profile.apply": {
    type: "object",
    properties: {
      profileIndex: {
        type: "integer",
        minimum: 1,
      },
      clientIndexes: {
        type: "array",
        items: {
          type: "number",
        },
        minItems: 5,
        maxItems: 5,
      },
    },
    required: ["profileIndex", "clientIndexes"],
    additionalProperties: false,
  },
  "cli.apm.profile.clone": {
    type: "object",
    properties: {
      fromIndex: {
        type: "integer",
        minimum: 1,
      },
      toIndex: {
        type: "integer",
        minimum: 1,
      },
      newName: {
        type: "string",
      },
    },
    required: ["fromIndex", "toIndex", "newName"],
    additionalProperties: false,
  },
  "cli.apm.profile.del": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.apm.profile.reset": null,
  "cli.apm.profile.show": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.apm.profile.summary": null,
  "cli.apm.query": null,
  "cli.apm.show": null,
  "cli.apm.stanum": {
    type: "object",
    properties: {
      apIndex: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["apIndex"],
    additionalProperties: false,
  },
  "cli.apm.syslog": null,
  "cli.appqos.enable": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.appqos.traceable.d": {
    type: "object",
    properties: {
      appIndex: {
        type: "number",
        enum: [64, 50, 60, 52, 51, 53, 54, 58, 62, 63, 65, 66, 68],
      },
    },
    required: ["appIndex"],
    additionalProperties: false,
  },
  "cli.appqos.traceable.e": {
    type: "object",
    properties: {
      appIndex: {
        type: "number",
        enum: [64, 50, 60, 52, 51, 53, 54, 58, 62, 63, 65, 66, 68],
      },
      qosClass: {
        type: "number",
        enum: [3, 1, 2, 4],
      },
    },
    required: ["appIndex", "qosClass"],
    additionalProperties: false,
  },
  "cli.appqos.traceable.v": null,
  "cli.appqos.untraceable.d": {
    type: "object",
    properties: {
      appIndex: {
        type: "integer",
        minimum: 0,
        maximum: 123,
      },
    },
    required: ["appIndex"],
    additionalProperties: false,
  },
  "cli.appqos.untraceable.e": {
    type: "object",
    properties: {
      appIndex: {
        type: "integer",
        minimum: 0,
        maximum: 123,
      },
      qosClass: {
        type: "number",
        enum: [3, 1, 2, 4],
      },
    },
    required: ["appIndex", "qosClass"],
    additionalProperties: false,
  },
  "cli.appqos.untraceable.v": null,
  "cli.appqos.view": null,
  "cli.csm.appe.config": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        maximum: 32,
      },
      group: {
        type: "string",
        enum: ["protocol", "im", "p2p", "others", "route"],
      },
    },
    required: ["index", "group"],
    additionalProperties: false,
  },
  "cli.csm.appe.prof": {
    oneOf: [
      {
        type: "object",
        properties: {
          index: {
            type: "integer",
            minimum: 1,
            maximum: 32,
          },
          action: {
            const: "setName",
          },
          name: {
            type: "string",
          },
        },
        required: ["index", "action", "name"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "view",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "setdefault",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.csm.appe.set": {
    oneOf: [
      {
        type: "object",
        properties: {
          index: {
            type: "integer",
            minimum: 1,
            maximum: 32,
          },
          action: {
            const: "view",
          },
          group: {
            type: "string",
            enum: ["IM", "P2P", "Protocol", "Others"],
          },
        },
        required: ["index", "action", "group"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "enable",
          },
          appIndex: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["index", "action", "appIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "disable",
          },
          appIndex: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["index", "action", "appIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "enableRoute",
          },
          appIndex: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["index", "action", "appIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "disableRoute",
          },
          appIndex: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["index", "action", "appIndex"],
        additionalProperties: false,
      },
    ],
  },
  "cli.csm.appe.show": {
    type: "object",
    properties: {
      group: {
        type: "string",
        enum: ["all", "protocol", "im", "p2p", "others"],
      },
    },
    additionalProperties: false,
  },
  "cli.csm.dnsf": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "enable",
          },
          state: {
            type: "string",
            enum: ["ON", "OFF"],
          },
        },
        required: ["action", "state"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "syslog",
          },
          value: {
            type: "string",
            enum: ["P", "B", "A", "N"],
          },
        },
        required: ["action", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "wcf",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "ucf",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "cachetime",
          },
          hours: {
            type: "integer",
            minimum: 1,
            maximum: 24,
          },
        },
        required: ["action", "hours"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "blockpage",
          },
          value: {
            type: "string",
            enum: ["show", "on", "off"],
          },
        },
        required: ["action", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "profileShow",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "profileEditName",
          },
          index: {
            type: "integer",
            minimum: 1,
          },
          name: {
            type: "string",
          },
        },
        required: ["action", "index", "name"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "profileEditLog",
          },
          index: {
            type: "integer",
            minimum: 1,
          },
          logType: {
            type: "string",
            enum: ["P", "B", "A"],
          },
        },
        required: ["action", "index", "logType"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "profileSetdefault",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "profileEditWcf",
          },
          index: {
            type: "integer",
            minimum: 1,
          },
          wcfProfile: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
        },
        required: ["action", "index", "wcfProfile"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "profileEditUcf",
          },
          index: {
            type: "integer",
            minimum: 1,
          },
          ucfProfile: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
        },
        required: ["action", "index", "ucfProfile"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "profileEditCache",
          },
          index: {
            type: "integer",
            minimum: 1,
          },
          hours: {
            type: "integer",
            minimum: 1,
            maximum: 24,
          },
        },
        required: ["action", "index", "hours"],
        additionalProperties: false,
      },
    ],
  },
  "cli.csm.dnsf.localbw.clear": null,
  "cli.csm.dnsf.localbw.set": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["enable", "disable", "pass", "block"],
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "addressType",
          },
          type: {
            type: "integer",
            minimum: 0,
            maximum: 4,
            description: "0 mask, 1 single, 2 any, 3 range, 4 group and objects.",
          },
          values: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Address value(s) for the type, e.g. an IP for single.",
          },
        },
        required: ["action", "type"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "group",
          },
          item: {
            type: "number",
            enum: [1, 2],
          },
          groupIndex: {
            type: "integer",
            minimum: 1,
            maximum: 192,
            description: "Group index 1..192.",
          },
        },
        required: ["action", "item", "groupIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "object",
          },
          item: {
            type: "number",
            enum: [1, 2],
          },
          objectIndex: {
            type: "integer",
            minimum: 1,
            maximum: 32,
            description: "Object index 1..32.",
          },
        },
        required: ["action", "item", "objectIndex"],
        additionalProperties: false,
      },
    ],
  },
  "cli.csm.dnsf.localbw.show": null,
  "cli.csm.ucf": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setdefault",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "message",
          },
          message: {
            type: "string",
          },
        },
        required: ["action", "message"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "objName",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          name: {
            type: "string",
          },
        },
        required: ["action", "index", "name"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "objPriority",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          value: {
            type: "integer",
            enum: [0, 3, 1, 2],
            minimum: 0,
            maximum: 3,
          },
        },
        required: ["action", "index", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "objLog",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          logType: {
            type: "string",
            enum: ["P", "B", "A"],
          },
        },
        required: ["action", "index", "logType"],
        additionalProperties: false,
      },
    ],
  },
  "cli.csm.ucf.obj.index.eac": {
    oneOf: [
      {
        type: "object",
        properties: {
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          action: {
            const: "view",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "enable",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "disable",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "setObject",
          },
          objectIndex: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["index", "action", "objectIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "setGroup",
          },
          groupIndex: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["index", "action", "groupIndex"],
        additionalProperties: false,
      },
    ],
  },
  "cli.csm.ucf.obj.index.uac": {
    oneOf: [
      {
        type: "object",
        properties: {
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          action: {
            const: "view",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "enable",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "disable",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "setAction",
          },
          value: {
            type: "string",
            enum: ["P", "B"],
          },
        },
        required: ["index", "action", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "setIpBlock",
          },
          value: {
            type: "string",
            enum: ["E", "D"],
          },
        },
        required: ["index", "action", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "setObject",
          },
          objectIndex: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["index", "action", "objectIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "setGroup",
          },
          groupIndex: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["index", "action", "groupIndex"],
        additionalProperties: false,
      },
    ],
  },
  "cli.csm.ucf.obj.index.wf": {
    oneOf: [
      {
        type: "object",
        properties: {
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          action: {
            const: "view",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "enable",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "disable",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "setAction",
          },
          value: {
            type: "string",
            enum: ["P", "B"],
          },
        },
        required: ["index", "action", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "enableFeature",
          },
          feature: {
            type: "string",
            enum: ["p", "c", "u"],
          },
        },
        required: ["index", "action", "feature"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "cancelFeature",
          },
          feature: {
            type: "string",
            enum: ["p", "c", "u"],
          },
        },
        required: ["index", "action", "feature"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "setFileExtension",
          },
          fileExtensionIndex: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
        },
        required: ["index", "action", "fileExtensionIndex"],
        additionalProperties: false,
      },
    ],
  },
  "cli.csm.wcf": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "look",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "cache",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "server",
          },
          server: {
            type: "string",
          },
        },
        required: ["action", "server"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "message",
          },
          message: {
            type: "string",
          },
        },
        required: ["action", "message"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setdefault",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "objView",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "objAction",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          value: {
            type: "string",
            enum: ["P", "B"],
          },
        },
        required: ["action", "index", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "objName",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          name: {
            type: "string",
          },
        },
        required: ["action", "index", "name"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "objLog",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          logType: {
            type: "string",
            enum: ["P", "B", "A"],
          },
        },
        required: ["action", "index", "logType"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "objKeywordObject",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          objectIndex: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "index", "objectIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "objKeywordGroup",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          groupIndex: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "index", "groupIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "objListAction",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          value: {
            type: "string",
            enum: ["P", "E", "B", "D"],
            description: "Black/white list: E enable, D disable, P pass, B block.",
          },
        },
        required: ["action", "index", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["objSelect", "objDiscard"],
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          item: {
            type: "string",
            description: 'A CATEGORY (e.g. "Bot Nets") or WEB_GROUP (e.g. "Security") name.',
          },
        },
        required: ["action", "index", "item"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ddns.enable": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.ddns.forceupdate": null,
  "cli.ddns.log": null,
  "cli.ddns.set": {
    type: "object",
    properties: {
      accountIndex: {
        type: "integer",
        minimum: 1,
        maximum: 6,
      },
      serviceProvider: {
        type: "integer",
        minimum: 1,
        maximum: 19,
      },
      serviceType: {
        type: "integer",
        minimum: 1,
        maximum: 3,
      },
      domainName: {
        type: "string",
      },
      loginName: {
        type: "string",
      },
      password: {
        type: "string",
      },
    },
    required: [
      "accountIndex",
      "serviceProvider",
      "serviceType",
      "domainName",
      "loginName",
      "password",
    ],
    additionalProperties: false,
  },
  "cli.ddns.set.update": {
    type: "object",
    properties: {
      accountIndex: {
        type: "integer",
        minimum: 1,
        maximum: 6,
        description: "Account 1..6.",
      },
      serviceProvider: {
        type: "number",
        description: "`-S` provider 1..19 (1 = User-Defined).",
      },
      serviceType: {
        type: "number",
        description: "`-T` 1 Dynamic, 2 Custom, 3 Static.",
      },
      domain: {
        type: "object",
        properties: {
          hostName: {
            type: "string",
          },
          subDomain: {
            type: "string",
          },
        },
        required: ["hostName", "subDomain"],
        additionalProperties: false,
        description: '`-D "<host> <sub domain>"`.',
      },
      loginName: {
        type: "string",
        description: "`-L` login name (max 64).",
      },
      password: {
        type: "string",
        description: "`-P` password (max 24).",
      },
      enabled: {
        type: "boolean",
        description: "`-E` enable/disable the account.",
      },
      wanInterface: {
        type: "number",
        description: "`-W` 1..14: WAN1 First, WAN1 Only, WAN2 First, ... (odd First, even Only).",
      },
      wildcards: {
        type: "boolean",
        description: "`-C` wildcards.",
      },
      backupMx: {
        type: "boolean",
        description: "`-B` backup MX.",
      },
      mailExtender: {
        type: "string",
        description: "`-M` mail extender (max 60).",
      },
      realWanIp: {
        type: "number",
        description: "`-R` 0 WAN IP, 1 Internet IP.",
      },
      providerHost: {
        type: "string",
        description: "`-H` user-defined provider host (max 64).",
      },
      serviceApi: {
        type: "string",
        description: "`-A` user-defined service API (max 256).",
      },
      authType: {
        type: "number",
        description: "`-a` user-defined auth type: 0 basic, 1 URL.",
      },
      connectionType: {
        type: "number",
        description: "`-N` user-defined connection type: 0 HTTP, 1 HTTPS.",
      },
      serverResponse: {
        type: "string",
        description: "`-O` user-defined server response (max 32).",
      },
    },
    required: ["accountIndex"],
    additionalProperties: false,
  },
  "cli.ddns.setdefault": null,
  "cli.ddns.show": {
    type: "object",
    properties: {
      accountIndex: {
        type: "integer",
        minimum: 1,
        maximum: 6,
      },
    },
    required: ["accountIndex"],
    additionalProperties: false,
  },
  "cli.ddns.show.all": null,
  "cli.ddns.time": {
    type: "object",
    properties: {
      minutes: {
        type: "integer",
        minimum: 1,
        maximum: 14400,
      },
    },
    required: ["minutes"],
    additionalProperties: false,
  },
  "cli.dos": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.dos.a": null,
  "cli.dos.b.show": null,
  "cli.dos.d": null,
  "cli.dos.p.show": null,
  "cli.dos.v": null,
  "cli.dpdk.cmdlog": null,
  "cli.dpdk.statistic": null,
  "cli.fs.cat": {
    type: "object",
    properties: {
      path: {
        type: "string",
      },
    },
    required: ["path"],
    additionalProperties: false,
  },
  "cli.fs.cd": {
    type: "object",
    properties: {
      path: {
        type: "string",
      },
    },
    required: ["path"],
    additionalProperties: false,
  },
  "cli.fs.cp": {
    type: "object",
    properties: {
      source: {
        type: "string",
      },
      target: {
        type: "string",
      },
    },
    required: ["source", "target"],
    additionalProperties: false,
  },
  "cli.fs.format": null,
  "cli.fs.info": null,
  "cli.fs.ls": null,
  "cli.fs.mkdir": {
    type: "object",
    properties: {
      path: {
        type: "string",
      },
    },
    required: ["path"],
    additionalProperties: false,
  },
  "cli.fs.mkfile": {
    type: "object",
    properties: {
      path: {
        type: "string",
      },
    },
    required: ["path"],
    additionalProperties: false,
  },
  "cli.fs.pwd": null,
  "cli.fs.ren": {
    type: "object",
    properties: {
      source: {
        type: "string",
      },
      target: {
        type: "string",
      },
    },
    required: ["source", "target"],
    additionalProperties: false,
  },
  "cli.fs.rm": {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "File or directory to delete.",
      },
      directory: {
        type: "string",
        description: 'Directory the path is relative to; the help example passes `"/"`.',
      },
    },
    required: ["path"],
    additionalProperties: false,
  },
  "cli.fs.test": {
    type: "object",
    properties: {
      path: {
        type: "string",
      },
    },
    required: ["path"],
    additionalProperties: false,
  },
  "cli.ha.set": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.ha.show": {
    type: "object",
    properties: {
      section: {
        type: "string",
        enum: ["configSync", "generalSetup"],
      },
    },
    required: ["section"],
    additionalProperties: false,
  },
  "cli.ha.status": {
    type: "object",
    properties: {
      scope: {
        type: "string",
        enum: ["allRouters", "localRouter"],
      },
      detailLevel: {
        type: "number",
        enum: [0, 1, 2],
      },
    },
    required: ["scope", "detailLevel"],
    additionalProperties: false,
  },
  "cli.hsportal.info": null,
  "cli.hsportal.info.clear": null,
  "cli.hsportal.info.set": {
    oneOf: [
      {
        type: "object",
        properties: {
          option: {
            type: "string",
            enum: ["database", "notification", "autoBackup"],
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["option", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          option: {
            type: "string",
            enum: ["mailObject", "smsObject"],
          },
          objectIndex: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        required: ["option", "objectIndex"],
        additionalProperties: false,
      },
    ],
  },
  "cli.hsportal.level": null,
  "cli.hsportal.level.delete": {
    type: "object",
    properties: {
      profile: {
        type: "integer",
        minimum: 1,
        maximum: 20,
      },
    },
    required: ["profile"],
    additionalProperties: false,
  },
  "cli.hsportal.level.set": {
    type: "object",
    properties: {
      profile: {
        type: "integer",
        minimum: 1,
        maximum: 20,
      },
      settings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            flag: {
              type: "string",
              enum: ["e", "d", "b", "t", "i", "o", "ru", "tu", "s", "n", "U", "D", "r", "f"],
              description:
                "e enable, t expiry (min), i/o idle timeout on + minutes, d max devices\n(0 unlimited), b bandwidth limit, ru/tu download/upload unit (0 kbps,\n1 mbps), U/D upload/download limit, s/n session limit + max sessions,\nr/f reconnection restriction + block minutes.",
            },
            value: {
              type: "number",
            },
          },
          required: ["flag", "value"],
          additionalProperties: false,
        },
      },
      reconnectAt: {
        type: "string",
        description: "`-g HH:MM`: daily time before which the same user may not reconnect.",
      },
    },
    required: ["profile", "settings"],
    additionalProperties: false,
  },
  "cli.hsportal.setup": {
    oneOf: [
      {
        type: "object",
        properties: {
          profile: {
            type: "number",
          },
          action: {
            const: "reset",
          },
        },
        required: ["profile", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          profile: {
            type: "number",
          },
          action: {
            const: "enable",
          },
        },
        required: ["profile", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          profile: {
            type: "number",
          },
          action: {
            const: "disable",
          },
        },
        required: ["profile", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          profile: {
            type: "number",
          },
          action: {
            const: "landingPageMode",
          },
          mode: {
            type: "number",
            enum: [0, 1, 2],
          },
        },
        required: ["profile", "action", "mode"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          profile: {
            type: "number",
          },
          action: {
            const: "google",
          },
          enabled: {
            type: "boolean",
          },
          appKey: {
            type: "string",
          },
        },
        required: ["profile", "action", "enabled", "appKey"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          profile: {
            type: "number",
          },
          action: {
            const: "facebook",
          },
          enabled: {
            type: "boolean",
          },
          appId: {
            type: "string",
          },
        },
        required: ["profile", "action", "enabled", "appId"],
        additionalProperties: false,
      },
    ],
  },
  "cli.internet": {
    type: "object",
    properties: {
      wanInterface: {
        type: "integer",
        minimum: 1,
        maximum: 12,
        description: "`-W n`: WAN interface. Default WAN1 when omitted.",
      },
      mode: {
        type: "number",
        enum: [0, 3, 1, 2, 4, 6, 5, 7],
        description: "`-M n`: Internet Access Mode (0-7). Mandatory.",
      },
      ispName: {
        type: "string",
        description: "`-S <isp name>`: ISP name (max 23 characters).",
      },
      pppoeService: {
        type: "string",
        enum: ["on", "off"],
        description: "`-P <on/off>`: Enable PPPoE Service.",
      },
      username: {
        type: "string",
        description: "`-u <username>`: username (max 49 characters).",
      },
      password: {
        type: "string",
        description: "`-p <password>`: password (max 49 characters).",
      },
      pppAuthType: {
        type: "number",
        enum: [0, 1],
        description: "`-a n`: PPP Authentication Type (0 PAP/CHAP, 1 PAP Only).",
      },
      idleTimeout: {
        oneOf: [
          {
            const: -1,
          },
          {
            type: "integer",
            minimum: 1,
            maximum: 999,
          },
        ],
        description: "`-t n`: connection duration (-1 Always-on, 1-999 idle seconds).",
      },
      pppoeClientIp: {
        type: "string",
        description: "`-i <ip address>`: PPPoE-assigned CPE IP (0.0.0.0 = dynamic).",
      },
      wanIp: {
        type: "string",
        description: "`-w <ip address>`: WAN IP address.",
      },
      wanNetmask: {
        type: "string",
        description: "`-n <netmask>`: WAN netmask.",
      },
      gateway: {
        type: "string",
        description: "`-g <gateway>`: gateway IP.",
      },
      serverIp: {
        type: "string",
        description: "`-s <server ip>`: PPTP/L2TP server IP.",
      },
      alwaysOnBackupWan: {
        type: "integer",
        minimum: 1,
        maximum: 12,
        description: "`-A <idx>`: Always On mode backup WAN#.",
      },
      backupMode: {
        type: "number",
        enum: [0, 1],
        description: "`-B <mode>`: Backup mode (0 any WAN disconnect, 1 all WAN disconnect).",
      },
    },
    required: ["mode"],
    additionalProperties: false,
  },
  "cli.internet.v": null,
  "cli.ip.addr": {
    type: "object",
    properties: {
      ipv4Address: {
        type: "string",
      },
    },
    required: ["ipv4Address"],
    additionalProperties: false,
  },
  "cli.ip.arp": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "status",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "acceptStatus",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip.arp.accept": {
    type: "object",
    properties: {
      mode: {
        type: "integer",
        minimum: 0,
        maximum: 7,
      },
    },
    required: ["mode"],
    additionalProperties: false,
  },
  "cli.ip.arp.add": {
    type: "object",
    properties: {
      ipv4Address: {
        type: "string",
      },
      mac: {
        type: "string",
      },
      direction: {
        type: "string",
        enum: ["LAN", "WAN"],
      },
    },
    required: ["ipv4Address", "mac", "direction"],
    additionalProperties: false,
  },
  "cli.ip.arp.del": {
    type: "object",
    properties: {
      ipv4Address: {
        type: "string",
      },
      direction: {
        type: "string",
        enum: ["LAN", "WAN"],
      },
    },
    required: ["ipv4Address", "direction"],
    additionalProperties: false,
  },
  "cli.ip.arp.flush": null,
  "cli.ip.arp.setcachelife": {
    type: "object",
    properties: {
      seconds: {
        type: "integer",
        minimum: 10,
        maximum: 2550,
      },
    },
    required: ["seconds"],
    additionalProperties: false,
  },
  "cli.ip.bandwidth": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "state",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "default",
          },
          txRateKbps: {
            type: "number",
          },
          rxRateKbps: {
            type: "number",
          },
        },
        required: ["action", "txRateKbps", "rxRateKbps"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "status",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "routing",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "schedule",
          },
          profiles: {
            type: "array",
            items: {
              type: "number",
            },
            minItems: 4,
            maxItems: 4,
          },
        },
        required: ["action", "profiles"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "addRange",
          },
          ipStart: {
            type: "string",
          },
          ipEnd: {
            type: "string",
          },
          txRateKbps: {
            type: "number",
          },
          rxRateKbps: {
            type: "number",
          },
          shared: {
            type: "boolean",
          },
        },
        required: ["action", "ipStart", "ipEnd", "txRateKbps", "rxRateKbps", "shared"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delRange",
          },
          ipStart: {
            type: "string",
          },
          ipEnd: {
            type: "string",
          },
          txRateKbps: {
            type: "number",
          },
          rxRateKbps: {
            type: "number",
          },
          shared: {
            type: "boolean",
          },
        },
        required: ["action", "ipStart", "ipEnd", "txRateKbps", "rxRateKbps", "shared"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip.bgp": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "mode",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "as",
          },
          asNumber: {
            type: "integer",
            minimum: 0,
            maximum: 4294967295,
          },
        },
        required: ["action", "asNumber"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "hold",
          },
          seconds: {
            type: "integer",
            minimum: 10,
            maximum: 65535,
          },
        },
        required: ["action", "seconds"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "retry",
          },
          seconds: {
            type: "integer",
            minimum: 3,
            maximum: 255,
          },
        },
        required: ["action", "seconds"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "id",
          },
          ipv4Address: {
            type: "string",
          },
        },
        required: ["action", "ipv4Address"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "neighborMode",
          },
          idx: {
            type: "number",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "idx", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "neighborName",
          },
          idx: {
            type: "number",
          },
          name: {
            type: "string",
          },
        },
        required: ["action", "idx", "name"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "neighborIp",
          },
          idx: {
            type: "number",
          },
          ipv4Address: {
            type: "string",
          },
        },
        required: ["action", "idx", "ipv4Address"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "neighborAs",
          },
          idx: {
            type: "number",
          },
          asNumber: {
            type: "integer",
            minimum: 1,
            maximum: 4294967295,
          },
        },
        required: ["action", "idx", "asNumber"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "neighborWeight",
          },
          idx: {
            type: "number",
          },
          weight: {
            type: "integer",
            minimum: 0,
            maximum: 7,
          },
        },
        required: ["action", "idx", "weight"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "neighborPrepend",
          },
          idx: {
            type: "number",
          },
          prepend: {
            type: "integer",
            minimum: 0,
            maximum: 7,
          },
        },
        required: ["action", "idx", "prepend"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "neighborMd5",
          },
          idx: {
            type: "number",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "idx", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "neighborKey",
          },
          idx: {
            type: "number",
          },
          key: {
            type: "string",
          },
        },
        required: ["action", "idx", "key"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "staticSet",
          },
          sidx: {
            type: "integer",
            minimum: 1,
            maximum: 16,
          },
          ipv4Address: {
            type: "string",
          },
          netmask: {
            type: "string",
          },
        },
        required: ["action", "sidx", "ipv4Address", "netmask"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "staticDelete",
          },
          sidx: {
            type: "integer",
            minimum: 1,
            maximum: 16,
          },
        },
        required: ["action", "sidx"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip.bgp.neighbor.show": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "all",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "index",
          },
          idx: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
        },
        required: ["action", "idx"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip.bgp.show": null,
  "cli.ip.bgp.static.show": null,
  "cli.ip.bindmac": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "mode",
          },
          mode: {
            type: "string",
            enum: ["on", "off", "strict_on", "strict_off"],
          },
        },
        required: ["action", "mode"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "add",
          },
          ipv4Address: {
            type: "string",
          },
          mac: {
            type: "string",
          },
          comment: {
            type: "string",
          },
        },
        required: ["action", "ipv4Address", "mac", "comment"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "del",
          },
          target: {
            type: "string",
          },
        },
        required: ["action", "target"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "subnetAll",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "subnetSet",
          },
          lanIndex: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
        },
        required: ["action", "lanIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "subnetUnset",
          },
          lanIndex: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
        },
        required: ["action", "lanIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "subnetClear",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "subnetShow",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip.dataflowmonitor.off": null,
  "cli.ip.dataflowmonitor.on": null,
  "cli.ip.dataflowmonitor.status": null,
  "cli.ip.dhcpc": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "status",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "release",
          },
          wanNumber: {
            type: "integer",
            minimum: 1,
            maximum: 12,
          },
        },
        required: ["action", "wanNumber"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "renew",
          },
          wanNumber: {
            type: "integer",
            minimum: 1,
            maximum: 12,
          },
        },
        required: ["action", "wanNumber"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setOption",
          },
          enabled: {
            type: "boolean",
          },
          wanNumber: {
            type: "integer",
            minimum: 1,
            maximum: 12,
          },
          optionNumber: {
            type: "integer",
            minimum: 0,
            maximum: 255,
          },
          value: {
            type: "string",
          },
          valueType: {
            type: "string",
            enum: ["string", "hex", "address"],
            description:
              "How `value` is encoded: string (`-v`, default), raw hex (`-x`), address list (`-a`).",
          },
        },
        required: ["action", "enabled", "wanNumber", "optionNumber", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["option", "optionHelp", "optionList", "optionRemoveAll"],
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["optionDelete", "optionUpdate"],
          },
          index: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip.dnsforward": null,
  "cli.ip.igmpfl": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.ip.igmpfl.status": null,
  "cli.ip.igmpproxy.ppp": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.ip.igmpproxy.query": {
    type: "object",
    properties: {
      intervalMs: {
        type: "integer",
      },
    },
    required: ["intervalMs"],
    additionalProperties: false,
  },
  "cli.ip.igmpproxy.reset": null,
  "cli.ip.igmpproxy.set": null,
  "cli.ip.igmpproxy.status": null,
  "cli.ip.igmpproxy.syslog": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
        description: "Omitted: bare `ip igmp_proxy syslog` (current setting).",
      },
    },
    additionalProperties: false,
  },
  "cli.ip.igmpproxy.version": {
    type: "object",
    properties: {
      version: {
        type: "string",
        enum: ["show", "v2", "v3", "auto"],
        description: "Omitted: bare `ip igmp_proxy version` (current setting).",
      },
    },
    additionalProperties: false,
  },
  "cli.ip.igmpproxy.wan": null,
  "cli.ip.igmpsnoop.acceptlist": {
    type: "object",
    properties: {
      type: {
        type: "number",
        enum: [0, 1, 2],
      },
      index: {
        type: "integer",
      },
    },
    required: ["type", "index"],
    additionalProperties: false,
  },
  "cli.ip.igmpsnoop.chkleave": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.ip.igmpsnoop.disable": null,
  "cli.ip.igmpsnoop.enable": null,
  "cli.ip.igmpsnoop.mode": {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: ["hw", "sw"],
      },
    },
    required: ["mode"],
    additionalProperties: false,
  },
  "cli.ip.igmpsnoop.portchk": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.ip.igmpsnoop.separate": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.ip.igmpsnoop.status": null,
  "cli.ip.igmpsnoop.table": null,
  "cli.ip.igmpsnoop.txquery": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
      version: {
        type: "string",
        enum: ["v2", "v3"],
      },
    },
    required: ["enabled", "version"],
    additionalProperties: false,
  },
  "cli.ip.lanalias": {
    oneOf: [
      {
        type: "object",
        properties: {
          idx: {
            type: "integer",
            minimum: 1,
            maximum: 5,
          },
          action: {
            const: "enable",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["idx", "action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          idx: {
            type: "number",
          },
          action: {
            const: "setAux",
          },
          ipv4Address: {
            type: "string",
          },
        },
        required: ["idx", "action", "ipv4Address"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          idx: {
            type: "number",
          },
          action: {
            const: "assignWan",
          },
          wanNumber: {
            type: "integer",
            minimum: 0,
            maximum: 5,
          },
        },
        required: ["idx", "action", "wanNumber"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          idx: {
            type: "number",
          },
          action: {
            const: "removeWan",
          },
        },
        required: ["idx", "action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip.landnsres": null,
  "cli.ip.maxnatuser": {
    type: "object",
    properties: {
      userCount: {
        type: "integer",
      },
    },
    required: ["userCount"],
    additionalProperties: false,
  },
  "cli.ip.nmask": {
    type: "object",
    properties: {
      netmask: {
        type: "string",
      },
    },
    required: ["netmask"],
    additionalProperties: false,
  },
  "cli.ip.ospf.cfg.set": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "state",
          },
          idx: {
            type: "number",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "idx", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "area",
          },
          idx: {
            type: "number",
          },
          areaId: {
            type: "integer",
            minimum: 1,
            maximum: 2147483647,
          },
        },
        required: ["action", "idx", "areaId"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "lan",
          },
          idx: {
            type: "number",
          },
          lanNumber: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
        },
        required: ["action", "idx", "lanNumber"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "wan",
          },
          idx: {
            type: "number",
          },
          wanNumber: {
            type: "integer",
            minimum: 1,
            maximum: 2,
          },
        },
        required: ["action", "idx", "wanNumber"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip.ospf.cfg.show": null,
  "cli.ip.ospf.dis": null,
  "cli.ip.ospf.en": null,
  "cli.ip.ospf.nbr": null,
  "cli.ip.ospf.status": null,
  "cli.ip.ping": {
    type: "object",
    properties: {
      targetIp: {
        type: "string",
      },
      wanInterface: {
        type: "string",
        enum: ["WAN1", "WAN2", "AUTO"],
      },
      sourceIp: {
        type: "string",
        description: "Source IP for the ping; requires `wanInterface`.",
      },
    },
    required: ["targetIp"],
    additionalProperties: false,
  },
  "cli.ip.policyrt": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.ip.pubaddr": {
    type: "object",
    properties: {
      ipv4Address: {
        type: "string",
      },
    },
    required: ["ipv4Address"],
    additionalProperties: false,
  },
  "cli.ip.pubmask": {
    type: "object",
    properties: {
      netmask: {
        type: "string",
      },
    },
    required: ["netmask"],
    additionalProperties: false,
  },
  "cli.ip.pubsubnet": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.ip.rip": {
    type: "object",
    properties: {
      mode: {
        type: "number",
        enum: [0, 1, 2],
      },
    },
    required: ["mode"],
    additionalProperties: false,
  },
  "cli.ip.route": null,
  "cli.ip.route.add": {
    type: "object",
    properties: {
      dst: {
        type: "string",
      },
      netmask: {
        type: "string",
      },
      gateway: {
        type: "string",
      },
      ifno: {
        type: "integer",
        minimum: 3,
        maximum: 12,
      },
      rtype: {
        type: "string",
        enum: ["default", "static"],
      },
    },
    required: ["dst", "netmask", "gateway", "ifno", "rtype"],
    additionalProperties: false,
  },
  "cli.ip.route.clean": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.ip.route.cnc": null,
  "cli.ip.route.default": {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: ["off", "add", "del"],
      },
    },
    required: ["mode"],
    additionalProperties: false,
  },
  "cli.ip.route.del": {
    type: "object",
    properties: {
      dst: {
        type: "string",
      },
      netmask: {
        type: "string",
      },
      rtype: {
        type: "string",
        enum: ["default", "static"],
      },
    },
    required: ["dst", "netmask", "rtype"],
    additionalProperties: false,
  },
  "cli.ip.route.tel": null,
  "cli.ip.session": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "status",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip.session.add": {
    type: "object",
    properties: {
      ip1: {
        type: "string",
      },
      ip2: {
        type: "string",
      },
      num: {
        type: "integer",
        minimum: 0,
      },
      p2pNum: {
        type: "integer",
        minimum: 0,
      },
    },
    required: ["ip1", "ip2", "num", "p2pNum"],
    additionalProperties: false,
  },
  "cli.ip.session.block": {
    type: "object",
    properties: {
      ipv4Address: {
        type: "string",
      },
    },
    required: ["ipv4Address"],
    additionalProperties: false,
  },
  "cli.ip.session.default": {
    type: "object",
    properties: {
      value: {
        type: "integer",
        minimum: 0,
      },
    },
    required: ["value"],
    additionalProperties: false,
  },
  "cli.ip.session.defaultp2p": {
    type: "object",
    properties: {
      value: {
        type: "integer",
        minimum: 0,
      },
    },
    required: ["value"],
    additionalProperties: false,
  },
  "cli.ip.session.del": {
    type: "object",
    properties: {
      ip1: {
        type: "string",
      },
      ip2: {
        type: "string",
      },
      num: {
        type: "integer",
        minimum: 0,
      },
      p2pNum: {
        type: "integer",
        minimum: 0,
      },
    },
    required: ["ip1", "ip2", "num", "p2pNum"],
    additionalProperties: false,
  },
  "cli.ip.session.list": null,
  "cli.ip.session.off": null,
  "cli.ip.session.on": null,
  "cli.ip.session.timer": {
    type: "object",
    properties: {
      value: {
        type: "integer",
        minimum: 0,
      },
    },
    required: ["value"],
    additionalProperties: false,
  },
  "cli.ip.session.unblock": {
    type: "object",
    properties: {
      ipv4Address: {
        type: "string",
      },
    },
    required: ["ipv4Address"],
    additionalProperties: false,
  },
  "cli.ip.spoofdef": {
    type: "object",
    properties: {
      side: {
        type: "string",
        enum: ["LAN", "WAN"],
      },
      enabled: {
        type: "boolean",
      },
    },
    required: ["side", "enabled"],
    additionalProperties: false,
  },
  "cli.ip.tracert": {
    type: "object",
    properties: {
      targetIp: {
        type: "string",
      },
      wanInterface: {
        type: "string",
        enum: [
          "WAN1",
          "WAN2",
          "WAN3",
          "WAN4",
          "WAN5",
          "WAN6",
          "WAN7",
          "WAN8",
          "WAN9",
          "WAN10",
          "WAN11",
          "WAN12",
        ],
      },
      protocol: {
        type: "string",
        enum: ["Udp", "Icmp"],
      },
    },
    required: ["targetIp"],
    additionalProperties: false,
  },
  "cli.ip.wanrip": {
    type: "object",
    properties: {
      interfaceNumber: {
        type: "integer",
        minimum: 1,
        maximum: 52,
      },
      enabled: {
        type: "boolean",
      },
    },
    required: ["interfaceNumber", "enabled"],
    additionalProperties: false,
  },
  "cli.ip6.addr": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "set",
          },
          prefix: {
            type: "string",
          },
          prefixLength: {
            type: "integer",
            minimum: 0,
            maximum: 128,
          },
          interfaceLabel: {
            type: "string",
          },
        },
        required: ["action", "prefix", "prefixLength", "interfaceLabel"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          prefix: {
            type: "string",
          },
          prefixLength: {
            type: "integer",
            minimum: 0,
            maximum: 128,
          },
          interfaceLabel: {
            type: "string",
          },
        },
        required: ["action", "prefix", "prefixLength", "interfaceLabel"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
          interfaceLabel: {
            type: "string",
          },
          unicastOnly: {
            type: "boolean",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "showPrefix",
          },
          interfaceLabel: {
            type: "string",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "updateStatic",
            description: "`-t`: update the WAN static IPv6 address table.",
          },
          oldPrefix: {
            type: "string",
          },
          oldPrefixLength: {
            type: "number",
          },
          newPrefix: {
            type: "string",
          },
          newPrefixLength: {
            type: "number",
          },
          interfaceLabel: {
            type: "string",
          },
        },
        required: [
          "action",
          "oldPrefix",
          "oldPrefixLength",
          "newPrefix",
          "newPrefixLength",
          "interfaceLabel",
        ],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "oldPrefix",
            description:
              "`-o 1` show the old prefix list; `-o 2` send the old prefix option by RA.",
          },
          mode: {
            type: "number",
            enum: [1, 2],
          },
        },
        required: ["action", "mode"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setOldPrefix",
            description: "`-o 3`: set an old prefix on a WAN.",
          },
          prefix: {
            type: "string",
          },
          prefixLength: {
            type: "number",
          },
          wan: {
            type: "string",
          },
        },
        required: ["action", "prefix", "prefixLength", "wan"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "addUla",
            description: "`-l`: add a ULA on a LAN.",
          },
          prefix: {
            type: "string",
          },
          prefixLength: {
            type: "number",
          },
          lan: {
            type: "string",
          },
        },
        required: ["action", "prefix", "prefixLength", "lan"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["prefixListAdd", "prefixListDelete"],
            description: "`-p` add / `-b` delete a prefix in a WAN's prefix list.",
          },
          prefix: {
            type: "string",
          },
          prefixLength: {
            type: "number",
          },
          wan: {
            type: "string",
          },
        },
        required: ["action", "prefix", "prefixLength", "wan"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["autoUla", "deleteUla"],
            description: "`-x` generate a ULA automatically / `-c` delete a ULA.",
          },
          lan: {
            type: "string",
          },
        },
        required: ["action", "lan"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "ulaType",
            description: "`-e`: ULA type 0 disable, 1 static, 2 auto.",
          },
          type: {
            type: "integer",
            minimum: 0,
            maximum: 2,
          },
          lan: {
            type: "string",
          },
        },
        required: ["action", "type", "lan"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.aiccu": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "status",
          },
          wan: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        required: ["action", "wan"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "remove",
          },
          wan: {
            type: "number",
          },
        },
        required: ["action", "wan"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.bandwidth": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "on",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "off",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "default",
          },
          txRate: {
            type: "string",
          },
          rxRate: {
            type: "string",
          },
        },
        required: ["action", "txRate", "rxRate"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "status",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "add",
          },
          ipStart: {
            type: "string",
          },
          ipEnd: {
            type: "string",
          },
          txRate: {
            type: "string",
          },
          rxRate: {
            type: "string",
          },
          shared: {
            const: true,
            description:
              "Only the documented `shared` token is modelled (YAGNI for undocumented alternatives).",
          },
        },
        required: ["action", "ipStart", "ipEnd", "txRate", "rxRate", "shared"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          ipStart: {
            type: "string",
          },
        },
        required: ["action", "ipStart"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "deleteAll",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.dhcp.client": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
          wan: {
            type: "string",
          },
        },
        required: ["action", "wan"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "enable",
          },
          wan: {
            type: "string",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "wan", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "release",
          },
          wan: {
            type: "string",
          },
        },
        required: ["action", "wan"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "requestPd",
          },
          wan: {
            type: "string",
          },
          iaid: {
            type: "string",
          },
        },
        required: ["action", "wan", "iaid"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "displayDuid",
          },
          wan: {
            type: "string",
          },
        },
        required: ["action", "wan"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.dhcp.optionc": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "list",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 35,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setAscii",
          },
          enabled: {
            type: "boolean",
          },
          wan: {
            type: "string",
          },
          optionNumber: {
            type: "integer",
            minimum: 0,
            maximum: 65535,
          },
          value: {
            type: "string",
          },
        },
        required: ["action", "enabled", "wan", "optionNumber", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setHex",
          },
          enabled: {
            type: "boolean",
          },
          wan: {
            type: "string",
          },
          optionNumber: {
            type: "integer",
            minimum: 0,
            maximum: 65535,
          },
          value: {
            type: "string",
          },
        },
        required: ["action", "enabled", "wan", "optionNumber", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setIp",
          },
          enabled: {
            type: "boolean",
          },
          wan: {
            type: "string",
          },
          optionNumber: {
            type: "integer",
            minimum: 0,
            maximum: 65535,
          },
          value: {
            type: "string",
          },
        },
        required: ["action", "enabled", "wan", "optionNumber", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "update",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 35,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "removeAll",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.dhcp.options": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "list",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 40,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setHex",
          },
          enabled: {
            type: "boolean",
          },
          lan: {
            type: "string",
          },
          optionNumber: {
            type: "integer",
            minimum: 0,
            maximum: 65535,
          },
          value: {
            type: "string",
          },
        },
        required: ["action", "enabled", "lan", "optionNumber", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setAscii",
          },
          enabled: {
            type: "boolean",
          },
          lan: {
            type: "string",
          },
          optionNumber: {
            type: "integer",
            minimum: 0,
            maximum: 65535,
          },
          value: {
            type: "string",
          },
        },
        required: ["action", "enabled", "lan", "optionNumber", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setIp",
          },
          enabled: {
            type: "boolean",
          },
          lan: {
            type: "string",
          },
          optionNumber: {
            type: "integer",
            minimum: 0,
            maximum: 65535,
          },
          value: {
            type: "string",
          },
        },
        required: ["action", "enabled", "lan", "optionNumber", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "update",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 40,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "removeAll",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.dhcp.reqopt": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
          interfaceLabel: {
            type: "string",
          },
        },
        required: ["action", "interfaceLabel"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "set",
          },
          interfaceLabel: {
            type: "string",
          },
          flag: {
            type: "string",
            enum: ["d", "p", "b", "S", "P", "B", "i", "s", "n", "D", "r", "I"],
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "interfaceLabel", "flag", "enabled"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.dhcp.server": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "showAssignment",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "enable",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setPoolMin",
          },
          address: {
            type: "string",
          },
        },
        required: ["action", "address"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setPoolMax",
          },
          address: {
            type: "string",
          },
        },
        required: ["action", "address"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setDns1",
          },
          address: {
            type: "string",
          },
        },
        required: ["action", "address"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setDns2",
          },
          address: {
            type: "string",
          },
        },
        required: ["action", "address"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.internet": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "set",
          },
          wan: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          mode: {
            type: "number",
            enum: [0, 3, 1, 2, 4, 6, 5, 7],
          },
          username: {
            type: "string",
          },
          password: {
            type: "string",
          },
          server: {
            type: "string",
          },
        },
        required: ["action", "wan", "mode"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "view",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "dial",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "drop",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.lan": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "set",
          },
          lan: {
            type: "integer",
            minimum: 1,
            maximum: 100,
          },
          primaryWan: {
            type: "integer",
            minimum: 0,
            maximum: 10,
          },
          dns1: {
            type: "string",
          },
          otherOption: {
            type: "boolean",
          },
          disableIpv6: {
            type: "boolean",
          },
          showLan: {
            type: "integer",
            minimum: 0,
            maximum: 17,
          },
          dns2: {
            type: "string",
            description: "`-D` 2nd DNS server (IPv6).",
          },
          management: {
            type: "integer",
            minimum: 0,
            maximum: 2,
            description: "`-m` LAN management: 0 OFF, 1 SLAAC, 2 DHCPv6.",
          },
          addExtensionWan: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "`-e` add an extension WAN (1..10).",
          },
          deleteExtensionWan: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "`-E` delete an extension WAN (1..10).",
          },
          extensionWanBitmap: {
            type: "integer",
            minimum: 0,
            maximum: 1023,
            description: "`-b` extension-WAN bit map (decimal).",
          },
          ripng: {
            type: "boolean",
            description: "`-R` RIPng on/off.",
          },
        },
        required: ["action", "lan"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
          lan: {
            type: "integer",
            minimum: 0,
            maximum: 17,
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.mngt": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "list",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "listAdd",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          objectIndex: {
            type: "integer",
            minimum: 1,
            maximum: 64,
          },
        },
        required: ["action", "index", "objectIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "listRemove",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "listFlush",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "status",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "service",
          },
          service: {
            type: "string",
            enum: ["internet", "http", "telnet", "ping", "https", "ssh", "enforce_https"],
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "service", "enabled"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.neigh.a": {
    type: "object",
    properties: {
      address: {
        type: "string",
      },
      interfaceLabel: {
        type: "string",
      },
    },
    additionalProperties: false,
  },
  "cli.ip6.neigh.d": {
    type: "object",
    properties: {
      address: {
        type: "string",
      },
      interfaceLabel: {
        type: "string",
      },
    },
    required: ["address", "interfaceLabel"],
    additionalProperties: false,
  },
  "cli.ip6.neigh.s": {
    type: "object",
    properties: {
      address: {
        type: "string",
      },
      mac: {
        type: "string",
      },
      interfaceLabel: {
        type: "string",
      },
    },
    required: ["address", "mac", "interfaceLabel"],
    additionalProperties: false,
  },
  "cli.ip6.ntp.p": {
    type: "object",
    properties: {
      priority: {
        type: "number",
        enum: [0, 1],
        description: "0 = Auto, 1 = First query IPv6 NTP server.",
      },
    },
    required: ["priority"],
    additionalProperties: false,
  },
  "cli.ip6.ntp.v": null,
  "cli.ip6.online": {
    type: "object",
    properties: {
      wan: {
        type: "string",
      },
    },
    required: ["wan"],
    additionalProperties: false,
  },
  "cli.ip6.ping": {
    type: "object",
    properties: {
      target: {
        type: "string",
      },
      interfaceLabel: {
        type: "string",
        description: "Optional `LAN1`..`LAN100` / `WAN1`..`WAN10` interface label.",
      },
      sendCount: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        description:
          "Optional packet count; requires `interfaceLabel` and `dataSize` (documented as an adjacent argument triple).",
      },
      dataSize: {
        type: "integer",
        minimum: 1,
        maximum: 1452,
        description:
          "Optional per-packet data size, 1 to 1452 bytes (documented range); requires `interfaceLabel` and `sendCount`.",
      },
    },
    required: ["target"],
    additionalProperties: false,
  },
  "cli.ip6.pneigh": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "set",
          },
          address: {
            type: "string",
          },
          interfaceLabel: {
            type: "string",
          },
        },
        required: ["action", "address", "interfaceLabel"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          address: {
            type: "string",
          },
          interfaceLabel: {
            type: "string",
          },
        },
        required: ["action", "address", "interfaceLabel"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
          address: {
            type: "string",
          },
          interfaceLabel: {
            type: "string",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.radvd": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "enable",
          },
          interfaceLabel: {
            type: "string",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "interfaceLabel", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setDefaultLifetime",
          },
          interfaceLabel: {
            type: "string",
          },
          seconds: {
            type: "integer",
            minimum: 0,
            maximum: 9000000,
          },
        },
        required: ["action", "interfaceLabel", "seconds"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "view",
          },
          interfaceLabel: {
            type: "string",
          },
        },
        required: ["action", "interfaceLabel"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "viewRa",
          },
          interfaceLabel: {
            type: "string",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.route": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "set",
          },
          prefix: {
            type: "string",
          },
          prefixLength: {
            type: "integer",
            minimum: 0,
            maximum: 128,
          },
          gateway: {
            type: "string",
          },
          interfaceLabel: {
            type: "string",
          },
          asDefault: {
            type: "boolean",
          },
        },
        required: ["action", "prefix", "prefixLength", "gateway", "interfaceLabel"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          prefix: {
            type: "string",
          },
          prefixLength: {
            type: "integer",
            minimum: 0,
            maximum: 128,
          },
        },
        required: ["action", "prefix", "prefixLength"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
          interfaceLabel: {
            type: "string",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "clear",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.session": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "on",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "off",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "default",
          },
          limit: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "limit"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "status",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "add",
          },
          ipStart: {
            type: "string",
          },
          ipEnd: {
            type: "string",
          },
          limit: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "ipStart", "ipEnd", "limit"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          ipStart: {
            type: "string",
          },
        },
        required: ["action", "ipStart"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "deleteAll",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ip6.tracert": {
    type: "object",
    properties: {
      target: {
        type: "string",
      },
      interfaceLabel: {
        type: "string",
        description: "Optional `LAN1`..`LAN100` / `WAN1`..`WAN10` interface label.",
      },
    },
    required: ["target"],
    additionalProperties: false,
  },
  "cli.ip6.tspc": {
    type: "object",
    properties: {
      wan: {
        type: "integer",
        minimum: 1,
        maximum: 10,
        description: "WAN interface number: 1 = WAN1, 2 = WAN2, ...",
      },
    },
    required: ["wan"],
    additionalProperties: false,
  },
  "cli.ipf.default": null,
  "cli.ipf.flowtrack.set": {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["enable", "refresh"],
      },
    },
    required: ["action"],
    additionalProperties: false,
  },
  "cli.ipf.flowtrack.view": {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: ["all", "sessions"],
      },
    },
    required: ["mode"],
    additionalProperties: false,
  },
  "cli.ipf.hashanalysis": {
    oneOf: [
      {
        type: "object",
        properties: {
          view: {
            type: "string",
            enum: ["summary", "total"],
          },
        },
        required: ["view"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          view: {
            const: "threshold",
          },
          hashCounts: {
            type: "integer",
            minimum: 1,
            maximum: 1000000,
          },
        },
        required: ["view", "hashCounts"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          view: {
            type: "string",
            enum: ["interval", "detail"],
            description: "Hash index range 0..8191.",
          },
          begin: {
            type: "integer",
            minimum: 0,
            maximum: 8191,
          },
          end: {
            type: "integer",
            maximum: 8191,
          },
        },
        required: ["view", "begin", "end"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ipf.rule": {
    oneOf: [
      {
        type: "object",
        properties: {
          setNo: {
            type: "integer",
            minimum: 1,
            maximum: 50,
          },
          ruleNo: {
            type: "integer",
            minimum: 1,
            maximum: 30,
          },
          action: {
            const: "view",
          },
        },
        required: ["setNo", "ruleNo", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          setNo: {
            type: "number",
          },
          ruleNo: {
            type: "number",
          },
          action: {
            const: "enable",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["setNo", "ruleNo", "action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          setNo: {
            type: "number",
          },
          ruleNo: {
            type: "number",
          },
          action: {
            const: "direction",
          },
          direction: {
            type: "number",
            enum: [0, 3, 1, 2],
          },
        },
        required: ["setNo", "ruleNo", "action", "direction"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          setNo: {
            type: "number",
          },
          ruleNo: {
            type: "number",
          },
          action: {
            const: "configure",
          },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                flag: {
                  type: "string",
                  enum: [
                    "e",
                    "d",
                    "b",
                    "S",
                    "L",
                    "C",
                    "M",
                    "A",
                    "a",
                    "N",
                    "O",
                    "t",
                    "s",
                    "n",
                    "U",
                    "D",
                    "f",
                    "c",
                    "u",
                    "I",
                    "v",
                    "F",
                    "m",
                    "Y",
                    "y",
                    "q",
                    "l",
                    "w",
                  ],
                  description:
                    "e enable, D direction, I/O in/out interface (`e LAN1`), s/d source/\ndestination (`o 1 2`, `u 0 <ip> <mask>`), S service (`o 1`, `u 6 ...`),\nf fragment, F filter action, m MAC bind/syslog, Y/y user management,\nL session limit, q QoS class, A packet capture, l load balance, a/u/w/n\nAPPE/UCF/WCF/DNS filter profile, N next set, c code page, C window size,\nb banner, t schedule (`i ...` / `c ...`), M comment, U move (`up`/`down`).",
                },
                values: {
                  type: "array",
                  items: {
                    oneOf: [
                      {
                        type: "string",
                      },
                      {
                        type: "number",
                      },
                    ],
                  },
                  description: "Arguments in documented order; none for argument-less options.",
                },
              },
              required: ["flag"],
              additionalProperties: false,
            },
          },
        },
        required: ["setNo", "ruleNo", "action", "options"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ipf.set": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "callFilterSet",
          },
          setNo: {
            type: "integer",
            minimum: 0,
            maximum: 12,
          },
        },
        required: ["action", "setNo"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "dataFilterSet",
          },
          setNo: {
            type: "integer",
            minimum: 0,
            maximum: 12,
          },
        },
        required: ["action", "setNo"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "defaultAction",
          },
          pass: {
            type: "boolean",
          },
          logToSyslog: {
            type: "boolean",
          },
        },
        required: ["action", "pass", "logToSyslog"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "acceptRoutingFromWan",
          },
          family: {
            type: "string",
            enum: ["v4", "v6"],
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "family", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "strictSecurityFirewall",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "codePage",
          },
          page: {
            type: "integer",
            minimum: 0,
            maximum: 20,
          },
        },
        required: ["action", "page"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "view",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "filterSetView",
          },
          setNo: {
            type: "integer",
            minimum: 1,
            maximum: 50,
          },
        },
        required: ["action", "setNo"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "filterSetComment",
          },
          setNo: {
            type: "integer",
            minimum: 1,
            maximum: 50,
          },
          comment: {
            type: "string",
          },
        },
        required: ["action", "setNo", "comment"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "filterSetNext",
          },
          setNo: {
            type: "integer",
            minimum: 1,
            maximum: 50,
          },
          nextSetNo: {
            type: "integer",
            minimum: 0,
            maximum: 50,
          },
        },
        required: ["action", "setNo", "nextSetNo"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ipf.set.rule": {
    type: "object",
    properties: {
      setNo: {
        type: "integer",
        minimum: 1,
        maximum: 50,
      },
      ruleNo: {
        type: "integer",
        minimum: 1,
        maximum: 30,
      },
      options: {
        type: "array",
        items: {
          type: "object",
          properties: {
            flag: {
              type: "string",
              enum: [
                "e",
                "d",
                "b",
                "S",
                "L",
                "C",
                "M",
                "A",
                "a",
                "N",
                "O",
                "t",
                "s",
                "n",
                "U",
                "D",
                "f",
                "c",
                "u",
                "I",
                "v",
                "F",
                "m",
                "Y",
                "y",
                "q",
                "l",
                "w",
              ],
              description:
                "e enable, D direction, I/O in/out interface (`e LAN1`), s/d source/\ndestination (`o 1 2`, `u 0 <ip> <mask>`), S service (`o 1`, `u 6 ...`),\nf fragment, F filter action, m MAC bind/syslog, Y/y user management,\nL session limit, q QoS class, A packet capture, l load balance, a/u/w/n\nAPPE/UCF/WCF/DNS filter profile, N next set, c code page, C window size,\nb banner, t schedule (`i ...` / `c ...`), M comment, U move (`up`/`down`).",
            },
            values: {
              type: "array",
              items: {
                oneOf: [
                  {
                    type: "string",
                  },
                  {
                    type: "number",
                  },
                ],
              },
              description: "Arguments in documented order; none for argument-less options.",
            },
          },
          required: ["flag"],
          additionalProperties: false,
        },
      },
    },
    required: ["setNo", "ruleNo", "options"],
    additionalProperties: false,
  },
  "cli.ipf.view": {
    type: "object",
    properties: {
      flags: {
        type: "array",
        items: {
          type: "string",
          enum: ["d", "t", "r", "c", "V", "h", "z", "Z"],
        },
      },
    },
    additionalProperties: false,
  },
  "cli.ldap.set": {
    oneOf: [
      {
        type: "object",
        properties: {
          option: {
            const: "enable",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["option", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          option: {
            const: "type",
          },
          bindType: {
            type: "number",
            enum: [0, 1, 2],
          },
        },
        required: ["option", "bindType"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          option: {
            const: "ssl",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["option", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          option: {
            const: "ip",
          },
          ipAddress: {
            type: "string",
          },
        },
        required: ["option", "ipAddress"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          option: {
            const: "port",
          },
          port: {
            type: "integer",
            minimum: 1,
            maximum: 65535,
          },
        },
        required: ["option", "port"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          option: {
            const: "dn",
          },
          value: {
            type: "string",
          },
        },
        required: ["option", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          option: {
            const: "password",
          },
          value: {
            type: "string",
          },
        },
        required: ["option", "value"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ldap.user": {
    oneOf: [
      {
        type: "object",
        properties: {
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          action: {
            const: "name",
          },
          value: {
            type: "string",
          },
        },
        required: ["index", "action", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "baseDn",
          },
          value: {
            type: "string",
          },
        },
        required: ["index", "action", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "filter",
          },
          value: {
            type: "string",
          },
        },
        required: ["index", "action", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "groupDn",
          },
          value: {
            type: "string",
          },
        },
        required: ["index", "action", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "commonName",
          },
          value: {
            type: "string",
          },
        },
        required: ["index", "action", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "view",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.ldap.view": null,
  "cli.linux.clean.a": null,
  "cli.linux.clean.b": null,
  "cli.linux.clean.d": null,
  "cli.linux.clean.o": null,
  "cli.linux.clean.w": null,
  "cli.linux.ring.clean": null,
  "cli.linux.ring.debug": null,
  "cli.linux.ring.send": null,
  "cli.linux.ring.set": null,
  "cli.linux.ring.test": null,
  "cli.linux.service.ssh.disable": null,
  "cli.linux.service.ssh.enable": null,
  "cli.linux.service.ssh.setport": {
    type: "object",
    properties: {
      port: {
        type: "integer",
        minimum: 1,
        maximum: 65535,
      },
    },
    required: ["port"],
    additionalProperties: false,
  },
  "cli.linux.service.ssh.status": null,
  "cli.linux.service.telnet.disable": null,
  "cli.linux.service.telnet.enable": null,
  "cli.linux.service.telnet.setport": {
    type: "object",
    properties: {
      port: {
        type: "integer",
        minimum: 1,
        maximum: 65535,
      },
    },
    required: ["port"],
    additionalProperties: false,
  },
  "cli.linux.service.telnet.status": null,
  "cli.linux.setlinuxip": {
    type: "object",
    properties: {
      ip: {
        type: "string",
      },
      cidr: {
        type: "integer",
        minimum: 1,
        maximum: 32,
      },
      gateway: {
        type: "string",
      },
      vlan: {
        type: "integer",
        minimum: 0,
        maximum: 99,
      },
      password: {
        type: "string",
      },
    },
    required: ["ip"],
    additionalProperties: false,
  },
  "cli.linux.status": null,
  "cli.linux.syslog.disable": null,
  "cli.linux.syslog.enable": null,
  "cli.linux.syslog.status": null,
  "cli.local8021x": null,
  "cli.local8021x.cerset": {
    type: "object",
    properties: {
      uid: {
        type: "string",
        description: "Local certificate UID (see `local_8021x show_local_cer`).",
      },
    },
    required: ["uid"],
    additionalProperties: false,
  },
  "cli.local8021x.enable": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.local8021x.method": {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["set", "delete"],
      },
      method: {
        type: "integer",
        minimum: 1,
        maximum: 4,
        description: "1 EAP_PEAP/MSCHAPv2, 2 EAP_TTLS/PAP, 3 EAP_TTLS/MSCHAP, 4 EAP_TTLS/MSCHAPv2.",
      },
    },
    required: ["action", "method"],
    additionalProperties: false,
  },
  "cli.local8021x.showlocalcer": null,
  "cli.log.F": {
    type: "object",
    properties: {
      target: {
        type: "string",
        enum: ["a", "f", "c", "w"],
        description: "`-F a|c|f|w`: which log buffer(s) to flush.",
      },
    },
    required: ["target"],
    additionalProperties: false,
  },
  "cli.log.c": null,
  "cli.log.f": null,
  "cli.log.h": null,
  "cli.log.p": null,
  "cli.log.t": null,
  "cli.log.w": null,
  "cli.log.x": null,
  "cli.mngt.accesslist": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.mngt.bfp": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.mngt.certimport": {
    oneOf: [
      {
        type: "object",
        properties: {
          kind: {
            const: "local_cert",
          },
          url: {
            type: "string",
          },
          password: {
            type: "string",
          },
        },
        required: ["kind", "url", "password"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          kind: {
            const: "trusted_ca",
          },
          url: {
            type: "string",
          },
        },
        required: ["kind", "url"],
        additionalProperties: false,
      },
    ],
  },
  "cli.mngt.defenseworm": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["on", "off", "viewlog", "clearlog"],
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["add", "del"],
          },
          port: {
            type: "number",
          },
        },
        required: ["action", "port"],
        additionalProperties: false,
      },
    ],
  },
  "cli.mngt.echoicmp": {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["enable", "disable"],
      },
    },
    required: ["action"],
    additionalProperties: false,
  },
  "cli.mngt.ftpport": {
    type: "object",
    properties: {
      port: {
        type: "number",
      },
    },
    required: ["port"],
    additionalProperties: false,
  },
  "cli.mngt.httpport": {
    type: "object",
    properties: {
      port: {
        type: "number",
      },
    },
    required: ["port"],
    additionalProperties: false,
  },
  "cli.mngt.httpsport": {
    type: "object",
    properties: {
      port: {
        type: "number",
      },
    },
    required: ["port"],
    additionalProperties: false,
  },
  "cli.mngt.ip6iids": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "setMode",
          },
          mode: {
            type: "number",
            enum: [0, 1],
          },
        },
        required: ["action", "mode"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "regenerate",
          },
          iface: {
            type: "string",
          },
        },
        required: ["action", "iface"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.mngt.lanaccess": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.mngt.lbinterface": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["on", "off"],
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "lan",
          },
          lan: {
            type: "integer",
            minimum: 1,
            maximum: 100,
          },
        },
        required: ["action", "lan"],
        additionalProperties: false,
      },
    ],
  },
  "cli.mngt.lbinterface.status": null,
  "cli.mngt.noping": {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["on", "off", "viewlog", "clearlog"],
      },
    },
    required: ["action"],
    additionalProperties: false,
  },
  "cli.mngt.nosecurel2tpmngt": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.mngt.rmtcfg.disable": null,
  "cli.mngt.rmtcfg.enable": null,
  "cli.mngt.rmtcfg.protocol": {
    type: "object",
    properties: {
      protocol: {
        type: "string",
        enum: ["http", "telnet", "https", "ssh", "enforce_https", "ftp", "tr069", "snmp"],
      },
      onOff: {
        type: "string",
        enum: ["on", "off"],
      },
    },
    required: ["protocol", "onOff"],
    additionalProperties: false,
  },
  "cli.mngt.rmtcfg.status": null,
  "cli.mngt.snmp": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.mngt.ssholdkex": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.mngt.sshport": {
    type: "object",
    properties: {
      port: {
        type: "number",
      },
    },
    required: ["port"],
    additionalProperties: false,
  },
  "cli.mngt.sshtimeout": {
    type: "object",
    properties: {
      seconds: {
        type: "number",
      },
    },
    required: ["seconds"],
    additionalProperties: false,
  },
  "cli.mngt.sslvpnport": {
    type: "object",
    properties: {
      port: {
        type: "number",
      },
    },
    required: ["port"],
    additionalProperties: false,
  },
  "cli.mngt.telnetport": {
    type: "object",
    properties: {
      port: {
        type: "number",
      },
    },
    required: ["port"],
    additionalProperties: false,
  },
  "cli.mngt.telnettimeout": {
    type: "object",
    properties: {
      seconds: {
        type: "number",
      },
    },
    required: ["seconds"],
    additionalProperties: false,
  },
  "cli.mngt.validationcode": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.mngt.wanlogin": {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["enable", "disable"],
      },
    },
    required: ["action"],
    additionalProperties: false,
  },
  "cli.msubnet.addr": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      ipAddress: {
        type: "string",
      },
    },
    required: ["lanIndex", "ipAddress"],
    additionalProperties: false,
  },
  "cli.msubnet.dhcps": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      enabled: {
        type: "boolean",
      },
    },
    required: ["lanIndex", "enabled"],
    additionalProperties: false,
  },
  "cli.msubnet.gateway": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      gatewayIp: {
        type: "string",
      },
    },
    required: ["lanIndex", "gatewayIp"],
    additionalProperties: false,
  },
  "cli.msubnet.ipcnt": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      ipCount: {
        type: "integer",
        minimum: 0,
        maximum: 220,
      },
    },
    required: ["lanIndex", "ipCount"],
    additionalProperties: false,
  },
  "cli.msubnet.leasetime": {
    type: "object",
    properties: {
      lanIndex: {
        type: "integer",
        minimum: 1,
        maximum: 100,
      },
      leaseTimeSec: {
        type: "integer",
        minimum: 1,
        maximum: 259200,
      },
    },
    required: ["lanIndex"],
    additionalProperties: false,
  },
  "cli.msubnet.mtu": {
    type: "object",
    properties: {
      interfaceName: {
        type: "string",
      },
      mtuValue: {
        type: "integer",
        minimum: 1000,
        maximum: 1508,
      },
    },
    required: ["interfaceName", "mtuValue"],
    additionalProperties: false,
  },
  "cli.msubnet.nat": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      natEnabled: {
        type: "boolean",
      },
    },
    required: ["lanIndex", "natEnabled"],
    additionalProperties: false,
  },
  "cli.msubnet.nmask": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      netmask: {
        type: "string",
      },
    },
    required: ["lanIndex", "netmask"],
    additionalProperties: false,
  },
  "cli.msubnet.nodetype": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      nodeType: {
        type: "number",
        enum: [0, 1, 8, 2, 4],
      },
    },
    required: ["lanIndex", "nodeType"],
    additionalProperties: false,
  },
  "cli.msubnet.pppip": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      startIp: {
        type: "string",
      },
    },
    required: ["lanIndex", "startIp"],
    additionalProperties: false,
  },
  "cli.msubnet.primwins": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      winsIp: {
        type: "string",
      },
    },
    required: ["lanIndex", "winsIp"],
    additionalProperties: false,
  },
  "cli.msubnet.secwins": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      winsIp: {
        type: "string",
      },
    },
    required: ["lanIndex", "winsIp"],
    additionalProperties: false,
  },
  "cli.msubnet.startip": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      startIp: {
        type: "string",
      },
    },
    required: ["lanIndex", "startIp"],
    additionalProperties: false,
  },
  "cli.msubnet.status": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
    },
    required: ["lanIndex"],
    additionalProperties: false,
  },
  "cli.msubnet.switch": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      enabled: {
        type: "boolean",
      },
    },
    required: ["lanIndex", "enabled"],
    additionalProperties: false,
  },
  "cli.msubnet.talk": {
    type: "object",
    properties: {
      firstLanIndex: {
        type: "integer",
        minimum: 1,
        maximum: 100,
      },
      secondLanIndex: {
        type: "integer",
        minimum: 1,
        maximum: 100,
      },
      enabled: {
        type: "boolean",
      },
    },
    required: ["firstLanIndex", "secondLanIndex", "enabled"],
    additionalProperties: false,
  },
  "cli.msubnet.tftp": {
    type: "object",
    properties: {
      lanIndex: {
        type: "number",
      },
      serverName: {
        type: "string",
      },
    },
    required: ["lanIndex", "serverName"],
    additionalProperties: false,
  },
  "cli.nand.bad.nand.usage": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "bad",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "usage",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.object.country": {
    type: "object",
    properties: {
      index: {
        type: "integer",
      },
      name: {
        type: "string",
      },
    },
    required: ["index", "name"],
    additionalProperties: false,
  },
  "cli.object.country.activate": null,
  "cli.object.country.list": null,
  "cli.object.country.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.country.setdefault": null,
  "cli.object.country.view": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.object.fe": {
    type: "object",
    properties: {
      index: {
        type: "integer",
      },
      name: {
        type: "string",
      },
    },
    required: ["index", "name"],
    additionalProperties: false,
  },
  "cli.object.fe.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.fe.setdefault": null,
  "cli.object.fe.show": null,
  "cli.object.fe.view": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.object.ip.grp": {
    type: "object",
    properties: {
      index: {
        type: "integer",
      },
      name: {
        type: "string",
      },
    },
    required: ["index", "name"],
    additionalProperties: false,
  },
  "cli.object.ip.grp.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.ip.grp.setdefault": null,
  "cli.object.ip.grp.view": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.object.ip.obj": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        maximum: 255,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.object.ip.obj.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.ip.obj.setdefault": null,
  "cli.object.ipv6.grp": {
    type: "object",
    properties: {
      index: {
        type: "integer",
      },
      name: {
        type: "string",
      },
    },
    required: ["index", "name"],
    additionalProperties: false,
  },
  "cli.object.ipv6.grp.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.ipv6.grp.setdefault": null,
  "cli.object.ipv6.grp.view": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.object.ipv6.obj": {
    type: "object",
    properties: {
      index: {
        type: "integer",
      },
      name: {
        type: "string",
      },
    },
    required: ["index", "name"],
    additionalProperties: false,
  },
  "cli.object.ipv6.obj.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.ipv6.obj.setdefault": null,
  "cli.object.ipv6.obj.view": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.object.kw": {
    type: "object",
    properties: {
      index: {
        type: "integer",
      },
      name: {
        type: "string",
      },
    },
    required: ["index", "name"],
    additionalProperties: false,
  },
  "cli.object.kw.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.kw.setdefault": null,
  "cli.object.kw.show": {
    type: "object",
    properties: {
      page: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["page"],
    additionalProperties: false,
  },
  "cli.object.kw.view": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.object.mail": {
    type: "object",
    properties: {
      index: {
        type: "integer",
      },
      name: {
        type: "string",
      },
    },
    required: ["index", "name"],
    additionalProperties: false,
  },
  "cli.object.mail.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.mail.setdefault": null,
  "cli.object.mail.show": null,
  "cli.object.mail.view": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.object.noti": {
    type: "object",
    properties: {
      index: {
        type: "integer",
      },
      name: {
        type: "string",
      },
    },
    required: ["index", "name"],
    additionalProperties: false,
  },
  "cli.object.noti.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.noti.setdefault": null,
  "cli.object.noti.show": null,
  "cli.object.noti.view": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.object.schedule": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        maximum: 15,
      },
      enabled: {
        type: "boolean",
      },
    },
    required: ["index", "enabled"],
    additionalProperties: false,
  },
  "cli.object.schedule.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.schedule.setdefault": null,
  "cli.object.schedule.view": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        maximum: 15,
        description: "Profile 1..15; omitted shows every profile.",
      },
    },
    additionalProperties: false,
  },
  "cli.object.service.grp": {
    type: "object",
    properties: {
      index: {
        type: "integer",
      },
      name: {
        type: "string",
      },
    },
    required: ["index", "name"],
    additionalProperties: false,
  },
  "cli.object.service.grp.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.service.grp.setdefault": null,
  "cli.object.service.grp.view": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.object.service.obj": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        maximum: 255,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.object.service.obj.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.service.obj.setdefault": null,
  "cli.object.sms": {
    type: "object",
    properties: {
      index: {
        type: "integer",
      },
      name: {
        type: "string",
      },
    },
    required: ["index", "name"],
    additionalProperties: false,
  },
  "cli.object.sms.set": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description: "Profile index.",
      },
      flag: {
        type: "string",
        description:
          "Documented flag letter, without the leading `-` (see the operation's heading).",
      },
      values: {
        type: "array",
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "number",
            },
          ],
        },
        description: "Flag arguments in documented order (none for argument-less flags).",
      },
    },
    required: ["index", "flag"],
    additionalProperties: false,
  },
  "cli.object.sms.setdefault": null,
  "cli.object.sms.show": null,
  "cli.object.sms.view": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.port": {
    oneOf: [
      {
        type: "object",
        properties: {
          kind: {
            const: "lan",
          },
          port: {
            type: "string",
            enum: ["1", "2", "3", "all", "5", "9", "10", "4", "6", "7", "8", "11", "12"],
          },
          speed: {
            type: "string",
            enum: ["AN", "100F", "100H", "10F", "10H"],
          },
        },
        required: ["kind", "port", "speed"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          kind: {
            const: "wan",
          },
          port: {
            type: "string",
            enum: ["wan1", "wan2", "wan3", "wan4"],
          },
          speed: {
            type: "string",
            enum: ["AN", "100F", "100H", "10F", "10H", "1000F"],
          },
        },
        required: ["kind", "port", "speed"],
        additionalProperties: false,
      },
    ],
  },
  "cli.port.8021x.addport": {
    type: "object",
    properties: {
      portNumber: {
        type: "integer",
        minimum: 1,
        maximum: 5,
      },
    },
    required: ["portNumber"],
    additionalProperties: false,
  },
  "cli.port.8021x.delport": {
    type: "object",
    properties: {
      portNumber: {
        type: "integer",
        minimum: 1,
        maximum: 5,
      },
    },
    required: ["portNumber"],
    additionalProperties: false,
  },
  "cli.port.8021x.disable": null,
  "cli.port.8021x.enable": null,
  "cli.port.8021x.status": null,
  "cli.port.sniff": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "on",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "off",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "restart",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "port",
          },
          lanPort: {
            type: "string",
            enum: ["p1", "p2", "p3", "p4"],
          },
        },
        required: ["action", "lanPort"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "txrx",
          },
          rate: {
            type: "integer",
            minimum: 1,
          },
          lanPort: {
            type: "string",
            enum: ["p1", "p2", "p3", "p4"],
          },
        },
        required: ["action", "rate", "lanPort"],
        additionalProperties: false,
      },
    ],
  },
  "cli.port.sniff.status": null,
  "cli.port.status": null,
  "cli.portmaptime": {
    type: "object",
    properties: {
      tcpTimeoutSeconds: {
        type: "integer",
        minimum: 1,
        description: "`-t <sec>`: TCP session timeout.",
      },
      udpTimeoutSeconds: {
        type: "integer",
        minimum: 1,
        description: "`-u <sec>`: UDP session timeout.",
      },
      igmpTimeoutSeconds: {
        type: "integer",
        minimum: 1,
        description: "`-i <sec>`: IGMP session timeout.",
      },
      tcpWwwTimeoutSeconds: {
        type: "integer",
        minimum: 1,
        description: "`-w <sec>`: TCP WWW session timeout.",
      },
      tcpSynTimeoutSeconds: {
        type: "integer",
        minimum: 1,
        description: "`-s <sec>`: TCP SYN session timeout.",
      },
    },
    additionalProperties: false,
  },
  "cli.portmaptime.f": null,
  "cli.portmaptime.l": null,
  "cli.qos.class": {
    oneOf: [
      {
        type: "object",
        properties: {
          classIndex: {
            type: "integer",
            minimum: 1,
            maximum: 3,
          },
          action: {
            const: "add",
          },
          name: {
            type: "string",
          },
          ruleEnabled: {
            type: "boolean",
          },
          localAddress: {
            type: "string",
          },
        },
        required: ["classIndex", "action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          classIndex: {
            type: "number",
          },
          action: {
            const: "edit",
          },
          ruleIndex: {
            type: "integer",
            minimum: 1,
          },
          name: {
            type: "string",
          },
          ruleEnabled: {
            type: "boolean",
          },
          localAddress: {
            type: "string",
          },
        },
        required: ["classIndex", "action", "ruleIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          classIndex: {
            type: "number",
          },
          action: {
            const: "delete",
          },
          ruleIndex: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["classIndex", "action", "ruleIndex"],
        additionalProperties: false,
      },
    ],
  },
  "cli.qos.setdefault": null,
  "cli.qos.setup": {
    type: "object",
    properties: {
      wanInterface: {
        type: "integer",
        minimum: 1,
        maximum: 12,
        description: "`-W <1~12>`: WAN interface to apply the settings to. Default WAN1.",
      },
      mode: {
        type: "number",
        enum: [0, 3, 1, 2],
        description: "`-m <mode>`: 0 disable, 1 in, 2 out, 3 both.",
      },
      inboundBandwidthKbps: {
        type: "integer",
        minimum: 1,
        maximum: 100000,
        description: "`-i <bandwidth>`: inbound bandwidth in kbps, 1-100000 (Ethernet WAN only).",
      },
      outboundBandwidthKbps: {
        type: "integer",
        minimum: 1,
        maximum: 100000,
        description: "`-o <bandwidth>`: outbound bandwidth in kbps, 1-100000 (Ethernet WAN only).",
      },
      classRatio: {
        type: "object",
        properties: {
          classIndex: {
            type: "integer",
            minimum: 1,
            maximum: 3,
          },
          ratioPercent: {
            type: "integer",
            minimum: 0,
            maximum: 100,
          },
        },
        required: ["classIndex", "ratioPercent"],
        additionalProperties: false,
        description: "`-r <index:ratio>`: ratio (%) for the given class index (1-3).",
      },
      udpBandwidthControlEnabled: {
        type: "boolean",
        description: "`-u <mode>`: 0 disable, 1 enable UDP bandwidth control.",
      },
      udpBandwidthLimitRatioPercent: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description: "`-p <ratio>`: UDP bandwidth limit ratio, in %.",
      },
      outboundTcpAckPrioritizeEnabled: {
        type: "boolean",
        description: "`-t <mode>`: 0 disable, 1 enable Outbound TCP ACK Prioritize.",
      },
      showAll: {
        type: "boolean",
        description: "`-V`: show all the settings.",
      },
      minNonVoipInboundBandwidthKbps: {
        type: "integer",
        minimum: 1,
        description:
          "`-I <bandwidth>`: minimum non-VoIP inbound bandwidth (Kbps) when VoIP detected.",
      },
      minNonVoipOutboundBandwidthKbps: {
        type: "integer",
        minimum: 1,
        description:
          "`-O <bandwidth>`: minimum non-VoIP outbound bandwidth (Kbps) when VoIP detected.",
      },
      voipBandwidthAdjustMode: {
        type: "number",
        enum: [0, 1],
        description:
          "`-v <0/1>`: 0 auto bandwidth adjustment, 1 adjust to minimum when VoIP detected.",
      },
    },
    additionalProperties: false,
  },
  "cli.qos.type": {
    type: "object",
    properties: {
      action: {
        const: "add",
      },
      name: {
        type: "string",
      },
      protocolType: {
        type: "integer",
        minimum: 1,
        maximum: 254,
      },
      portRange: {
        type: "string",
      },
    },
    required: ["action", "name", "protocolType", "portRange"],
    additionalProperties: false,
  },
  "cli.qos.voip": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.radius.authport": {
    type: "object",
    properties: {
      port: {
        type: "integer",
        minimum: 0,
        maximum: 65535,
      },
    },
    required: ["port"],
    additionalProperties: false,
  },
  "cli.radius.client.add": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
      ipv4Address: {
        type: "string",
      },
      ipv4Mask: {
        type: "string",
      },
      ipv6Prefix: {
        type: "string",
      },
      ipv6PrefixLength: {
        type: "integer",
        minimum: 0,
        maximum: 128,
      },
      secret: {
        type: "string",
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.radius.client.del": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.radius.enable": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.radius.enabledot1x": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.radius.external": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.radius.external.log": {
    type: "object",
    properties: {
      profileIndex: {
        type: "number",
      },
    },
    required: ["profileIndex"],
    additionalProperties: false,
  },
  "cli.radius.external.view": null,
  "cli.radius.external.viewprofile": {
    type: "object",
    properties: {
      profileIndex: {
        type: "number",
      },
    },
    required: ["profileIndex"],
    additionalProperties: false,
  },
  "cli.radius.setauthmethod": {
    type: "object",
    properties: {
      methodIndex: {
        type: "number",
        enum: [0, 1],
      },
    },
    required: ["methodIndex"],
    additionalProperties: false,
  },
  "cli.radius.setdot1xmethod": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "enable",
          },
          methodIndex: {
            type: "number",
            enum: [3, 1, 2, 4],
          },
        },
        required: ["action", "methodIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "disable",
          },
          methodIndex: {
            type: "number",
            enum: [3, 1, 2, 4],
          },
        },
        required: ["action", "methodIndex"],
        additionalProperties: false,
      },
    ],
  },
  "cli.radius.show": null,
  "cli.radius.showlocalcer": null,
  "cli.service": null,
  "cli.service.clear": null,
  "cli.service.login": {
    type: "object",
    properties: {
      account: {
        type: "string",
        description: "MyVigor account name.",
      },
      password: {
        type: "string",
        description: "MyVigor password (secret).",
      },
    },
    required: ["account", "password"],
    additionalProperties: false,
  },
  "cli.service.refresh": null,
  "cli.service.transfer": {
    type: "object",
    properties: {
      confirm: {
        type: "boolean",
        description:
          "`true` transfers this device to the new owner (`yes`); `false` cancels (`no`).",
      },
    },
    required: ["confirm"],
    additionalProperties: false,
  },
  "cli.service.transferowner": {
    type: "object",
    properties: {
      newOwner: {
        type: "string",
      },
      newOwnerEmail: {
        type: "string",
      },
    },
    required: ["newOwner", "newOwnerEmail"],
    additionalProperties: false,
  },
  "cli.show.clienttraffic": null,
  "cli.show.clienttraffic.device": {
    type: "object",
    properties: {
      deviceIndex: {
        type: "integer",
        minimum: 1,
        maximum: 30,
        description: "External device (VigorSwitch) index 1..30, sent as two digits.",
      },
      interfaceLabel: {
        type: "string",
        description: "`WAN1`, `WAN2`, `LANA` or `LANB`.",
      },
      direction: {
        type: "string",
        enum: ["tx", "rx"],
      },
      weekly: {
        type: "boolean",
      },
    },
    required: ["deviceIndex", "interfaceLabel", "direction"],
    additionalProperties: false,
  },
  "cli.show.cocpu": null,
  "cli.show.cpu": null,
  "cli.show.cputemp": null,
  "cli.show.dmz": null,
  "cli.show.dns": null,
  "cli.show.flow": null,
  "cli.show.lan": null,
  "cli.show.memory": null,
  "cli.show.nat": null,
  "cli.show.openport": null,
  "cli.show.ping": {
    type: "object",
    properties: {
      wan: {
        type: "string",
        description: "`wan1`..`wan12`; omitted shows every WAN.",
      },
      daily: {
        type: "boolean",
        description: "Daily graph.",
      },
    },
    additionalProperties: false,
  },
  "cli.show.pmtime": null,
  "cli.show.portmap": null,
  "cli.show.qryrdsl": null,
  "cli.show.session": null,
  "cli.show.statistic": null,
  "cli.show.statistic.reset": {
    type: "object",
    properties: {
      interfaceLabel: {
        type: "string",
        description: "`WAN1`..`WAN12`.",
      },
    },
    required: ["interfaceLabel"],
    additionalProperties: false,
  },
  "cli.show.status": null,
  "cli.show.traffic": null,
  "cli.show.traffic.ip": {
    type: "object",
    properties: {
      ipv4Address: {
        type: "string",
      },
      direction: {
        type: "string",
        enum: ["tx", "rx"],
      },
    },
    required: ["ipv4Address", "direction"],
    additionalProperties: false,
  },
  "cli.show.traffic.ipstats": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
        description: "Omitted: show the setting; 1/0 enable/disable per-IP traffic statistics.",
      },
    },
    additionalProperties: false,
  },
  "cli.show.traffic.session": {
    type: "object",
    properties: {
      weekly: {
        type: "boolean",
      },
    },
    additionalProperties: false,
  },
  "cli.show.traffic.wan": {
    type: "object",
    properties: {
      wan: {
        type: "string",
        description: "`wan1`..`wan7`.",
      },
      direction: {
        type: "string",
        enum: ["tx", "rx"],
      },
      weekly: {
        type: "boolean",
        description: "Weekly graph instead of the default.",
      },
    },
    required: ["wan", "direction"],
    additionalProperties: false,
  },
  "cli.show.voip": null,
  "cli.srv.dhcp.dhcp2": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "lanAssign",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "macAssign",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "enablePort",
          },
          portId: {
            type: "number",
            enum: [3, 4],
          },
        },
        required: ["action", "portId"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "disablePort",
          },
          portId: {
            type: "number",
            enum: [3, 4],
          },
        },
        required: ["action", "portId"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "view",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.srv.dhcp.dns1": {
    type: "object",
    properties: {
      lan: {
        type: "number",
      },
      dnsIp: {
        type: "string",
      },
    },
    required: ["lan", "dnsIp"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.dns2": {
    type: "object",
    properties: {
      lan: {
        type: "number",
      },
      dnsIp: {
        type: "string",
      },
    },
    required: ["lan", "dnsIp"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.expiredrecycleip": {
    type: "object",
    properties: {
      seconds: {
        type: "integer",
        minimum: 5,
        maximum: 300,
        description: "Documented range: 5..300 seconds.",
      },
    },
    required: ["seconds"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.frcdnsmanl": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.gateway": {
    type: "object",
    properties: {
      gatewayIp: {
        type: "string",
      },
    },
    required: ["gatewayIp"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.ipcnt": {
    type: "object",
    properties: {
      count: {
        type: "integer",
        minimum: 0,
        maximum: 256,
        description: "Documented range: 0..256.",
      },
    },
    required: ["count"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.leasetime": {
    type: "object",
    properties: {
      leaseTimeSeconds: {
        type: "integer",
        minimum: 1,
      },
    },
    required: ["leaseTimeSeconds"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.nodetype": {
    type: "object",
    properties: {
      nodeType: {
        type: "number",
        enum: [1, 8, 2, 4],
      },
    },
    required: ["nodeType"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.off": null,
  "cli.srv.dhcp.on": null,
  "cli.srv.dhcp.option": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "list",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          index: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setAscii",
          },
          enabled: {
            type: "boolean",
          },
          lan: {
            type: "string",
          },
          optionNumber: {
            type: "integer",
            minimum: 0,
            maximum: 255,
          },
          value: {
            type: "string",
          },
        },
        required: ["action", "enabled", "lan", "optionNumber", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setHex",
          },
          enabled: {
            type: "boolean",
          },
          lan: {
            type: "string",
          },
          optionNumber: {
            type: "integer",
            minimum: 0,
            maximum: 255,
          },
          value: {
            type: "string",
          },
        },
        required: ["action", "enabled", "lan", "optionNumber", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setIp",
          },
          enabled: {
            type: "boolean",
          },
          lan: {
            type: "string",
          },
          optionNumber: {
            type: "integer",
            minimum: 0,
            maximum: 255,
          },
          value: {
            type: "string",
          },
        },
        required: ["action", "enabled", "lan", "optionNumber", "value"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setNextServer",
          },
          enabled: {
            type: "boolean",
          },
          lan: {
            type: "string",
          },
          nextServerIp: {
            type: "string",
          },
        },
        required: ["action", "enabled", "lan", "nextServerIp"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "update",
          },
          index: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
    ],
  },
  "cli.srv.dhcp.primwins": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "set",
          },
          winsIp: {
            type: "string",
          },
        },
        required: ["action", "winsIp"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "clear",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.srv.dhcp.public.add": {
    type: "object",
    properties: {
      mac: {
        type: "string",
        description: "MAC address, `XX-XX-XX-XX-XX-XX`.",
      },
    },
    required: ["mac"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.public.cnt": {
    type: "object",
    properties: {
      count: {
        type: "integer",
        minimum: 1,
        maximum: 10,
        description: "Documented maximum pool size is 10.",
      },
    },
    required: ["count"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.public.del": {
    type: "object",
    properties: {
      mac: {
        type: "string",
        description: "MAC address `XX-XX-XX-XX-XX-XX`, or `all`.",
      },
    },
    required: ["mac"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.public.start": {
    type: "object",
    properties: {
      startIp: {
        type: "string",
      },
    },
    required: ["startIp"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.public.status": null,
  "cli.srv.dhcp.relay": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "servip",
          },
          serverIp: {
            type: "string",
          },
        },
        required: ["action", "serverIp"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "secondaryServip",
          },
          serverIp: {
            type: "string",
          },
        },
        required: ["action", "serverIp"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "subnet",
          },
          index: {
            type: "number",
            enum: [1, 2],
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
    ],
  },
  "cli.srv.dhcp.secwins": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "set",
          },
          winsIp: {
            type: "string",
          },
        },
        required: ["action", "winsIp"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "clear",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.srv.dhcp.startip": {
    type: "object",
    properties: {
      startIp: {
        type: "string",
      },
    },
    required: ["startIp"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.status": {
    type: "object",
    properties: {
      interfaceLabel: {
        type: "string",
      },
    },
    additionalProperties: false,
  },
  "cli.srv.dhcp.tftp": {
    type: "object",
    properties: {
      serverName: {
        type: "string",
      },
    },
    required: ["serverName"],
    additionalProperties: false,
  },
  "cli.srv.dhcp.tftpdel": null,
  "cli.srv.nat.dmz": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "setPrivateIp",
          },
          wan: {
            type: "number",
            enum: [1, 2],
          },
          index: {
            type: "number",
          },
          privateIp: {
            type: "string",
          },
        },
        required: ["action", "wan", "index", "privateIp"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "toggle",
          },
          wan: {
            type: "number",
            enum: [1, 2],
          },
          index: {
            type: "number",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "wan", "index", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "remove",
          },
          wan: {
            type: "number",
            enum: [1, 2],
          },
          index: {
            type: "number",
          },
        },
        required: ["action", "wan", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "view",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.srv.nat.ipsecpass": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "on",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "off",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "status",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.srv.nat.openport": {
    type: "object",
    properties: {
      ruleIndex: {
        type: "integer",
        minimum: 1,
        maximum: 260,
      },
      subItem: {
        type: "integer",
        minimum: 1,
        maximum: 10,
      },
      enabled: {
        type: "boolean",
      },
      comment: {
        type: "string",
      },
      localIp: {
        type: "string",
      },
      wanIndex: {
        type: "integer",
        minimum: 1,
      },
      wanAliasIndex: {
        type: "integer",
        minimum: 1,
        maximum: 32,
      },
      protocol: {
        type: "string",
        enum: ["TCP", "UDP", "ALL"],
      },
      startPort: {
        type: "integer",
        minimum: 0,
        maximum: 65535,
      },
      endPort: {
        type: "integer",
        minimum: 0,
        maximum: 65535,
      },
    },
    required: [
      "ruleIndex",
      "subItem",
      "enabled",
      "comment",
      "localIp",
      "wanIndex",
      "wanAliasIndex",
      "protocol",
      "startPort",
      "endPort",
    ],
    additionalProperties: false,
  },
  "cli.srv.nat.portmap": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "add",
          },
          index: {
            type: "number",
          },
          serviceName: {
            type: "string",
          },
          protocol: {
            type: "string",
            enum: ["TCP", "UDP"],
          },
          publicPort: {
            type: "integer",
            minimum: 0,
            maximum: 65535,
          },
          sourceIpType: {
            type: "number",
            enum: [0, 1],
          },
          sourceIpIndex: {
            type: "integer",
            minimum: 0,
            maximum: 192,
          },
          privateIp: {
            type: "string",
          },
          privatePort: {
            type: "integer",
            minimum: 1,
            maximum: 65535,
          },
          wanIndex: {
            type: "string",
          },
          aliasIpIndex: {
            type: "integer",
            minimum: 1,
            maximum: 32,
          },
        },
        required: [
          "action",
          "index",
          "serviceName",
          "protocol",
          "publicPort",
          "sourceIpType",
          "sourceIpIndex",
          "privateIp",
          "privatePort",
          "wanIndex",
          "aliasIpIndex",
        ],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          index: {
            type: "number",
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "disable",
          },
          index: {
            type: "number",
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "enable",
          },
          index: {
            type: "number",
          },
          protocol: {
            type: "string",
            enum: ["TCP", "UDP"],
          },
        },
        required: ["action", "index", "protocol"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "flush",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "table",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "view",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.srv.nat.pseudoctl": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "session",
          },
          threshold: {
            type: "integer",
            minimum: 0,
            maximum: 2147483647,
          },
        },
        required: ["action", "threshold"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "function",
          },
          mode: {
            type: "number",
            enum: [0, 3, 1, 2],
          },
        },
        required: ["action", "mode"],
        additionalProperties: false,
      },
    ],
  },
  "cli.srv.nat.rsttimeout": {
    type: "object",
    properties: {
      value: {
        type: "integer",
        minimum: 0,
        maximum: 10,
        description: "Documented range: 0..10 (unit = 10 msec).",
      },
    },
    required: ["value"],
    additionalProperties: false,
  },
  "cli.srv.nat.showall": null,
  "cli.srv.nat.status": null,
  "cli.srv.nat.trigger": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "setDefault",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "view",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "comment",
          },
          rule: {
            type: "integer",
            minimum: 1,
          },
          comment: {
            type: "string",
          },
        },
        required: ["action", "rule", "comment"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "enable",
          },
          rule: {
            type: "number",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "rule", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "sourceIpType",
          },
          rule: {
            type: "number",
          },
          ipType: {
            type: "number",
            enum: [0, 1],
          },
        },
        required: ["action", "rule", "ipType"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "protocol",
          },
          rule: {
            type: "number",
          },
          protocol: {
            type: "number",
            enum: [3, 1, 2],
          },
        },
        required: ["action", "rule", "protocol"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "triggerPort",
          },
          rule: {
            type: "number",
          },
          port: {
            type: "integer",
            minimum: 0,
            maximum: 65535,
          },
        },
        required: ["action", "rule", "port"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "incomingProtocol",
          },
          rule: {
            type: "number",
          },
          protocol: {
            type: "number",
            enum: [3, 1, 2],
          },
        },
        required: ["action", "rule", "protocol"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "incomingPort",
          },
          rule: {
            type: "number",
          },
          port: {
            type: "integer",
            minimum: 0,
            maximum: 65535,
          },
        },
        required: ["action", "rule", "port"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          rule: {
            type: "number",
          },
        },
        required: ["action", "rule"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "viewRule",
          },
          rule: {
            type: "number",
          },
        },
        required: ["action", "rule"],
        additionalProperties: false,
      },
    ],
  },
  "cli.srv.nat.view": null,
  "cli.switch.clear": {
    oneOf: [
      {
        type: "object",
        properties: {
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
        },
        required: ["index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          all: {
            const: true,
          },
        },
        required: ["all"],
        additionalProperties: false,
      },
    ],
  },
  "cli.switch.i": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        maximum: 8,
      },
      traffic: {
        type: "string",
        enum: ["on", "off", "status", "tx", "rx"],
      },
    },
    required: ["index", "traffic"],
    additionalProperties: false,
  },
  "cli.switch.list": null,
  "cli.switch.notrespond": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.switch.off": null,
  "cli.switch.on": null,
  "cli.switch.query": null,
  "cli.switch.status": null,
  "cli.switch.syslog": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.swm.alert": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "toggle",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "actionToggle",
          },
          idx: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "idx", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setLog",
          },
          idx: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "idx", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setName",
          },
          idx: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          name: {
            type: "string",
          },
        },
        required: ["action", "idx", "name"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setColor",
          },
          idx: {
            type: "integer",
            minimum: 2,
            maximum: 8,
          },
          color: {
            type: "string",
            enum: ["R", "N", "O"],
          },
        },
        required: ["action", "idx", "color"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setNotif",
          },
          idx: {
            type: "integer",
            minimum: 3,
            maximum: 8,
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "idx", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setObject",
          },
          idx: {
            type: "integer",
            minimum: 3,
            maximum: 8,
          },
          objectIndex: {
            type: "integer",
            minimum: 1,
            maximum: 4,
          },
          objectValue: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        required: ["action", "idx", "objectIndex", "objectValue"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "display",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "deviceToggle",
            description:
              "`swm alert en|dis <sw/port> <mac>`: per-switch or per-port alerting for one switch.",
          },
          scope: {
            type: "string",
            enum: ["port", "sw"],
          },
          mac: {
            type: "string",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "scope", "mac", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["portShow", "switchShow"],
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setSwitch",
          },
          mac: {
            type: "string",
          },
          incident: {
            type: "integer",
            minimum: 1,
          },
          level: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "mac", "incident", "level"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setPort",
          },
          mac: {
            type: "string",
          },
          port: {
            type: "integer",
            minimum: 1,
          },
          incident: {
            type: "integer",
            minimum: 1,
          },
          level: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "mac", "port", "incident", "level"],
        additionalProperties: false,
      },
    ],
  },
  "cli.swm.db": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "ctlToggle",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "ctlShow",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "alertNotify",
          },
          mode: {
            type: "string",
            enum: ["S", "N"],
          },
        },
        required: ["action", "mode"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "alertAction",
          },
          mode: {
            type: "string",
            enum: ["S", "B"],
          },
        },
        required: ["action", "mode"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "alertSms",
          },
          idx: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "idx"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "alertMail",
          },
          idx: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "idx"],
        additionalProperties: false,
      },
    ],
  },
  "cli.swm.detail": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "comment",
          },
          mac: {
            type: "string",
          },
          comment: {
            type: "string",
          },
        },
        required: ["action", "mac", "comment"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "name",
          },
          mac: {
            type: "string",
          },
          name: {
            type: "string",
          },
        },
        required: ["action", "mac", "name"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "passwd",
          },
          mac: {
            type: "string",
          },
          password: {
            type: "string",
          },
        },
        required: ["action", "mac", "password"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "config",
          },
          mac: {
            type: "string",
          },
          configIndex: {
            type: "integer",
            minimum: 0,
          },
        },
        required: ["action", "mac", "configIndex"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "portShow",
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "port",
          },
          mac: {
            type: "string",
          },
          port: {
            type: "integer",
            minimum: 1,
            maximum: 28,
          },
          flag: {
            type: "string",
          },
          schedule1: {
            type: "integer",
            minimum: 0,
          },
          schedule2: {
            type: "integer",
            minimum: 0,
          },
          description: {
            type: "string",
          },
        },
        required: ["action", "mac", "port", "flag", "schedule1", "schedule2", "description"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "rateToggle",
          },
          mac: {
            type: "string",
          },
          port: {
            type: "integer",
            minimum: 1,
            maximum: 28,
          },
          direction: {
            type: "string",
            enum: ["e", "i"],
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "mac", "port", "direction", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "rateLimit",
          },
          mac: {
            type: "string",
          },
          port: {
            type: "integer",
            minimum: 1,
            maximum: 28,
          },
          direction: {
            type: "string",
            enum: ["e", "i"],
          },
          limit: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["action", "mac", "port", "direction", "limit"],
        additionalProperties: false,
      },
    ],
  },
  "cli.swm.enable.disable": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "enable",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "disable",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.swm.get": {
    type: "object",
    properties: {
      mac: {
        type: "string",
      },
    },
    required: ["mac"],
    additionalProperties: false,
  },
  "cli.swm.group": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "setWithPassword",
          },
          idx: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          name: {
            type: "string",
          },
          password: {
            type: "string",
          },
        },
        required: ["action", "idx", "name", "password"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setNoPassword",
          },
          idx: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          name: {
            type: "string",
          },
        },
        required: ["action", "idx", "name"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "add",
          },
          idx: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "idx", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          idx: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "idx", "mac"],
        additionalProperties: false,
      },
    ],
  },
  "cli.swm.log": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "showFilter",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "showDay",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "showWeek",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setLevel",
          },
          idx: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "idx", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setType",
          },
          idx: {
            type: "integer",
            minimum: 1,
            maximum: 2,
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "idx", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setSwitch",
          },
          mac: {
            type: "string",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "mac", "enabled"],
        additionalProperties: false,
      },
    ],
  },
  "cli.swm.maintain": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "reboot",
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "reset",
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.swm.post": {
    type: "object",
    properties: {
      mac: {
        type: "string",
      },
    },
    required: ["mac"],
    additionalProperties: false,
  },
  "cli.swm.profile": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "add",
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "delete",
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "enableAll",
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "disableAll",
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
    ],
  },
  "cli.swm.search": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "mac",
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "ip",
          },
          ip: {
            type: "string",
          },
        },
        required: ["action", "ip"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "description",
          },
          query: {
            type: "string",
          },
        },
        required: ["action", "query"],
        additionalProperties: false,
      },
    ],
  },
  "cli.swm.show": {
    type: "object",
    properties: {
      lanPort: {
        type: "integer",
        minimum: 1,
        maximum: 12,
      },
    },
    required: ["lanPort"],
    additionalProperties: false,
  },
  "cli.swm.snmp": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "sys",
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "iftbl",
          },
          mac: {
            type: "string",
          },
          portNum: {
            type: "integer",
            minimum: 1,
            maximum: 28,
          },
        },
        required: ["action", "mac", "portNum"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "poe",
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "trpcomShow",
          },
          mac: {
            type: "string",
          },
        },
        required: ["action", "mac"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "trpcomSet",
          },
          mac: {
            type: "string",
          },
          name: {
            type: "string",
          },
        },
        required: ["action", "mac", "name"],
        additionalProperties: false,
      },
    ],
  },
  "cli.sys.adminuser": {
    oneOf: [
      {
        type: "object",
        properties: {
          target: {
            type: "string",
            enum: ["Local", "LDAP", "TACACS+", "fallback"],
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["target", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          target: {
            const: "edit",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
          username: {
            type: "string",
          },
          password: {
            type: "string",
          },
        },
        required: ["target", "index", "username", "password"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          target: {
            type: "string",
            enum: ["view", "delete"],
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 8,
          },
        },
        required: ["target", "index"],
        additionalProperties: false,
      },
    ],
  },
  "cli.sys.alg": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.sys.appbandwidth": null,
  "cli.sys.appstatistic": null,
  "cli.sys.arpautoreq": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.sys.autoreboot": {
    oneOf: [
      {
        const: "on",
      },
      {
        const: "off",
      },
      {
        type: "object",
        properties: {
          hours: {
            type: "number",
          },
        },
        required: ["hours"],
        additionalProperties: false,
      },
    ],
  },
  "cli.sys.board": {
    oneOf: [
      {
        type: "object",
        properties: {
          target: {
            type: "string",
            enum: ["buttonDef", "buttonWlan", "ledControl", "ledSleepMode"],
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["target", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          target: {
            const: "ledSleepModeTime",
          },
          minutes: {
            type: "integer",
            minimum: 1,
            maximum: 1440,
          },
        },
        required: ["target", "minutes"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          target: {
            const: "usb",
          },
          port: {
            type: "string",
            enum: ["p1", "p2"],
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["target", "port", "enabled"],
        additionalProperties: false,
      },
    ],
  },
  "cli.sys.bonjour": {
    type: "object",
    properties: {
      serviceEnabled: {
        type: "boolean",
      },
      httpEnabled: {
        type: "boolean",
      },
      telnetEnabled: {
        type: "boolean",
      },
      ftpEnabled: {
        type: "boolean",
      },
      sshEnabled: {
        type: "boolean",
      },
      printerEnabled: {
        type: "boolean",
      },
      ipv6Enabled: {
        type: "boolean",
      },
    },
    additionalProperties: false,
  },
  "cli.sys.cc": null,
  "cli.sys.cfg.default": null,
  "cli.sys.cfg.status": null,
  "cli.sys.cmdlog": null,
  "cli.sys.commit": null,
  "cli.sys.con2tel": null,
  "cli.sys.dashboard": null,
  "cli.sys.dashboard.set": {
    type: "object",
    properties: {
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            section: {
              type: "string",
              enum: ["0", "1", "2", "3", "a", "5", "9", "4", "6", "7", "8"],
            },
            enabled: {
              type: "boolean",
            },
          },
          required: ["section", "enabled"],
          additionalProperties: false,
        },
        description:
          "Sections to show/hide: 0 Front Panel, 1 System Information, 2 IPv4 LAN,\n3 IPv4 Internet Access, 4 IPv6 Internet Access, 5 Interface, 6 Security,\n7 System Resource, 8 LTE Status, 9 Quick Access, a VoIP.",
      },
    },
    required: ["sections"],
    additionalProperties: false,
  },
  "cli.sys.dashboard.show": null,
  "cli.sys.daylightsave": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
      show: {
        type: "boolean",
      },
      reset: {
        type: "boolean",
      },
    },
    additionalProperties: false,
  },
  "cli.sys.dnscachetbl": null,
  "cli.sys.domainname": {
    type: "object",
    properties: {
      wan: {
        type: "string",
        enum: ["wan1", "wan2"],
      },
      value: {
        type: "string",
      },
    },
    required: ["wan", "value"],
    additionalProperties: false,
  },
  "cli.sys.eaptls": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.sys.frlog": null,
  "cli.sys.ftpd": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.sys.health": {
    type: "object",
    properties: {
      metric: {
        type: "string",
        enum: [
          "view",
          "cpu_usage",
          "mem_usage",
          "arp_status",
          "dos_status",
          "sess_usage",
          "vpn_status",
          "voip_status",
        ],
      },
    },
    required: ["metric"],
    additionalProperties: false,
  },
  "cli.sys.iface": null,
  "cli.sys.info": null,
  "cli.sys.ipfixnetflow": {
    oneOf: [
      {
        type: "object",
        properties: {
          setting: {
            const: "enable",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["setting", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          setting: {
            const: "collector_ip",
          },
          address: {
            type: "string",
          },
        },
        required: ["setting", "address"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          setting: {
            const: "collector_port",
          },
          port: {
            type: "integer",
            minimum: 1,
            maximum: 65535,
          },
        },
        required: ["setting", "port"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          setting: {
            const: "collector_proto",
          },
          protocol: {
            type: "string",
            enum: ["TCP", "UDP"],
          },
        },
        required: ["setting", "protocol"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          setting: {
            const: "version",
          },
          version: {
            type: "number",
            enum: [10, 5, 9],
          },
        },
        required: ["setting", "version"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          setting: {
            type: "string",
            enum: ["inactive_timeout", "active_timeout"],
          },
          seconds: {
            type: "integer",
            minimum: 1,
            maximum: 86400,
          },
        },
        required: ["setting", "seconds"],
        additionalProperties: false,
      },
    ],
  },
  "cli.sys.ipfixnetflow.status": null,
  "cli.sys.license": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.sys.mailalert": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.sys.maxsession": null,
  "cli.sys.maxsession.set": {
    type: "object",
    properties: {
      value: {
        type: "string",
        enum: ["300K", "500K", "1000K"],
      },
    },
    required: ["value"],
    additionalProperties: false,
  },
  "cli.sys.mpage": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.sys.name": {
    type: "object",
    properties: {
      wan: {
        type: "string",
        enum: ["wan1", "wan2"],
      },
      value: {
        type: "string",
      },
    },
    required: ["wan", "value"],
    additionalProperties: false,
  },
  "cli.sys.passwd": {
    type: "object",
    properties: {
      oldPassword: {
        type: "string",
      },
      newPassword: {
        type: "string",
      },
    },
    required: ["oldPassword", "newPassword"],
    additionalProperties: false,
  },
  "cli.sys.pollbuf": null,
  "cli.sys.pollbuf.off": null,
  "cli.sys.pollbuf.on": null,
  "cli.sys.pwenc": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.sys.qrybuf": null,
  "cli.sys.reboot": null,
  "cli.sys.rtspalg": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
      port: {
        type: "integer",
        minimum: 1,
        maximum: 65535,
      },
      udpPathEnabled: {
        type: "boolean",
      },
      tcpPathEnabled: {
        type: "boolean",
      },
      showPortmap: {
        type: "boolean",
      },
    },
    additionalProperties: false,
  },
  "cli.sys.sipalg": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
      port: {
        type: "integer",
        minimum: 1,
        maximum: 65535,
      },
      udpPathEnabled: {
        type: "boolean",
      },
      tcpPathEnabled: {
        type: "boolean",
      },
    },
    additionalProperties: false,
  },
  "cli.sys.syslog": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.sys.tftpd": null,
  "cli.sys.time": null,
  "cli.sys.time.inquire": null,
  "cli.sys.time.pseudo": null,
  "cli.sys.time.server": {
    type: "object",
    properties: {
      domain: {
        type: "string",
        description: "Time server domain name (max 39 characters).",
      },
    },
    required: ["domain"],
    additionalProperties: false,
  },
  "cli.sys.time.show": null,
  "cli.sys.time.wan": {
    type: "object",
    properties: {
      wan: {
        type: "integer",
        minimum: 0,
        maximum: 12,
        description: "Interface sending the NTP request: 0 = Auto, 1..12 = WAN1..WAN12.",
      },
    },
    required: ["wan"],
    additionalProperties: false,
  },
  "cli.sys.time.zone": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        description:
          "Documented time-zone index (1 = GMT-12:00 Eniwetok ... see the manual's table).",
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.sys.tr069": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.sys.version": null,
  "cli.sys.webhook": {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["args"],
    additionalProperties: false,
  },
  "cli.tacacsplus.set": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "enable",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "serverIp",
          },
          serverIndex: {
            type: "number",
            enum: [0, 1],
          },
          ipAddress: {
            type: "string",
          },
        },
        required: ["action", "serverIndex", "ipAddress"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "serverPort",
          },
          serverIndex: {
            type: "number",
            enum: [0, 1],
          },
          port: {
            type: "integer",
            minimum: 1,
            maximum: 65535,
          },
        },
        required: ["action", "serverIndex", "port"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "sharedSecret",
          },
          serverIndex: {
            type: "number",
            enum: [0, 1],
          },
          secret: {
            type: "string",
          },
        },
        required: ["action", "serverIndex", "secret"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "clear",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.tacacsplus.view": null,
  "cli.testmail": null,
  "cli.upnp.nat": null,
  "cli.upnp.off": null,
  "cli.upnp.on": null,
  "cli.upnp.service": null,
  "cli.upnp.subscribe": null,
  "cli.upnp.tmpvs": null,
  "cli.upnp.wan": {
    type: "object",
    properties: {
      wanIndex: {
        type: "integer",
        minimum: 0,
        maximum: 12,
      },
    },
    required: ["wanIndex"],
    additionalProperties: false,
  },
  "cli.usb.devstat": null,
  "cli.usb.disk": null,
  "cli.usb.ftpusage": null,
  "cli.usb.temp": {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["show", "allData"],
      },
    },
    required: ["action"],
    additionalProperties: false,
  },
  "cli.usb.user.disable": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.usb.user.enable": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.usb.user.list": null,
  "cli.usb.user.rm": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.user": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "set",
          },
          param: {
            type: "string",
          },
        },
        required: ["action", "param"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "edit",
          },
          profileIdx: {
            type: "number",
          },
          param: {
            type: "string",
          },
        },
        required: ["action", "profileIdx", "param"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "account",
          },
          userName: {
            type: "string",
          },
          param: {
            type: "string",
          },
        },
        required: ["action", "userName", "param"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "setdefault",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.vigbrg.cfgip": {
    type: "object",
    properties: {
      ip: {
        type: "string",
      },
    },
    required: ["ip"],
    additionalProperties: false,
  },
  "cli.vigbrg.closeall": null,
  "cli.vigbrg.set": {
    type: "object",
    properties: {
      ipVersion: {
        type: "number",
        enum: [4, 6],
      },
      wanIndex: {
        type: "integer",
        minimum: 1,
        maximum: 10,
      },
      lanIndex: {
        type: "integer",
        minimum: 1,
        maximum: 100,
      },
      bridgeEnabled: {
        type: "boolean",
      },
      firewallEnabled: {
        type: "boolean",
      },
    },
    required: ["ipVersion", "wanIndex", "lanIndex", "bridgeEnabled"],
    additionalProperties: false,
  },
  "cli.vigbrg.status": null,
  "cli.vigbrg.wanstatus": null,
  "cli.vigbrg.wlanstatus": null,
  "cli.vlan.group": {
    type: "object",
    properties: {
      groupId: {
        type: "integer",
        minimum: 0,
        maximum: 99,
      },
      action: {
        type: "string",
        enum: ["show", "add", "set", "add_ex", "set_ex"],
      },
      ports: {
        type: "array",
        items: {
          type: "number",
        },
        description:
          'LAN port numbers (1-12) to join the group; required for every action except `"show"` (documented example: `vlan group 3 set p1 p4`).',
      },
    },
    required: ["groupId", "action"],
    additionalProperties: false,
  },
  "cli.vlan.map": null,
  "cli.vlan.off": null,
  "cli.vlan.on": null,
  "cli.vlan.pri": {
    type: "object",
    properties: {
      vlanId: {
        type: "integer",
        minimum: 0,
        maximum: 7,
      },
      priority: {
        type: "integer",
        minimum: 0,
        maximum: 7,
      },
    },
    required: ["vlanId", "priority"],
    additionalProperties: false,
  },
  "cli.vlan.restart": null,
  "cli.vlan.status": null,
  "cli.vlan.submode.off": null,
  "cli.vlan.submode.on": null,
  "cli.vlan.submode.status": null,
  "cli.vlan.subnet": {
    type: "object",
    properties: {
      lanInterface: {
        type: "integer",
        minimum: 1,
        maximum: 100,
      },
    },
    required: ["lanInterface"],
    additionalProperties: false,
  },
  "cli.vlan.sysvid": {
    oneOf: [
      {
        type: "object",
        properties: {
          mode: {
            const: "show",
          },
        },
        required: ["mode"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          mode: {
            const: "set",
          },
          value: {
            type: "integer",
            minimum: 0,
            maximum: 3828,
          },
        },
        required: ["mode", "value"],
        additionalProperties: false,
      },
    ],
  },
  "cli.vlan.tagged": {
    oneOf: [
      {
        type: "object",
        properties: {
          target: {
            const: "channel",
          },
          channel: {
            type: "integer",
            minimum: 0,
            maximum: 99,
          },
          state: {
            type: "string",
            enum: ["on", "off"],
          },
        },
        required: ["target", "channel", "state"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          target: {
            const: "unlimited",
          },
          state: {
            type: "string",
            enum: ["on", "off"],
          },
        },
        required: ["target", "state"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          target: {
            const: "p1_untag",
          },
          state: {
            type: "string",
            enum: ["on", "off"],
          },
        },
        required: ["target", "state"],
        additionalProperties: false,
      },
    ],
  },
  "cli.vlan.vid": {
    type: "object",
    properties: {
      channel: {
        type: "integer",
        minimum: 0,
        maximum: 7,
      },
      vid: {
        type: "integer",
        minimum: 0,
        maximum: 4095,
      },
    },
    required: ["channel", "vid"],
    additionalProperties: false,
  },
  "cli.vpn.dialout": {
    type: "object",
    properties: {
      param: {
        type: "string",
      },
    },
    required: ["param"],
    additionalProperties: false,
  },
  "cli.vpn.dinset": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
      param: {
        type: "string",
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.vpn.dpdkctrl.dump": {
    type: "object",
    properties: {
      table: {
        type: "string",
        enum: ["sp", "sa"],
        description: "IPsec security policy (`sp`) or security association (`sa`) table.",
      },
    },
    required: ["table"],
    additionalProperties: false,
  },
  "cli.vpn.dpdkctrl.flush": {
    type: "object",
    properties: {
      table: {
        type: "string",
        enum: ["sp", "sa"],
        description: "IPsec security policy (`sp`) or security association (`sa`) table.",
      },
    },
    required: ["table"],
    additionalProperties: false,
  },
  "cli.vpn.dpdkctrl.set": {
    oneOf: [
      {
        type: "object",
        properties: {
          feature: {
            type: "string",
            enum: ["pptp", "wireguard"],
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["feature", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          feature: {
            const: "fastroute",
            description: "DPDK acceleration for SYN / SYN,ACK.",
          },
          mode: {
            type: "string",
            enum: ["off", "subnet", "ip_all", "subnet_all"],
          },
        },
        required: ["feature", "mode"],
        additionalProperties: false,
      },
    ],
  },
  "cli.vpn.fromlan.add": {
    type: "object",
    properties: {
      lan: {
        type: "string",
        description: "LAN token as documented (`lan2`, `lan3`, ...).",
      },
    },
    required: ["lan"],
    additionalProperties: false,
  },
  "cli.vpn.fromlan.disable": null,
  "cli.vpn.fromlan.enable": null,
  "cli.vpn.fromlan.remove": {
    type: "object",
    properties: {
      lan: {
        type: "string",
      },
    },
    required: ["lan"],
    additionalProperties: false,
  },
  "cli.vpn.fromlan.status": null,
  "cli.vpn.graph": null,
  "cli.vpn.ike": {
    type: "object",
    properties: {
      flag: {
        type: "string",
        enum: ["s", "q"],
      },
    },
    required: ["flag"],
    additionalProperties: false,
  },
  "cli.vpn.isolate": {
    type: "object",
    properties: {
      state: {
        type: "string",
        enum: ["on", "off"],
      },
    },
    required: ["state"],
    additionalProperties: false,
  },
  "cli.vpn.l2ldialout": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.vpn.l2ldrop": {
    type: "object",
    properties: {
      param: {
        type: "string",
      },
    },
    additionalProperties: false,
  },
  "cli.vpn.l2lset": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
      param: {
        type: "string",
      },
    },
    required: ["index", "param"],
    additionalProperties: false,
  },
  "cli.vpn.list": null,
  "cli.vpn.list.profile": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        maximum: 500,
        description: "LAN-to-LAN profile 1..500.",
      },
      section: {
        type: "string",
        enum: ["all", "com", "out", "in", "net"],
      },
    },
    required: ["index", "section"],
    additionalProperties: false,
  },
  "cli.vpn.mfa": {
    type: "object",
    properties: {
      duration: {
        type: "string",
      },
    },
    required: ["duration"],
    additionalProperties: false,
  },
  "cli.vpn.mirror": {
    type: "object",
    properties: {
      scope: {
        type: "string",
        enum: ["l2l", "h2l"],
      },
      index: {
        type: "number",
      },
    },
    required: ["scope", "index"],
    additionalProperties: false,
  },
  "cli.vpn.mroute.add": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
      network: {
        type: "string",
      },
    },
    required: ["index", "network"],
    additionalProperties: false,
  },
  "cli.vpn.mroute.addmsa": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
      localNetwork: {
        type: "string",
      },
      remoteNetwork: {
        type: "string",
      },
    },
    required: ["index", "localNetwork", "remoteNetwork"],
    additionalProperties: false,
  },
  "cli.vpn.mroute.del": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
      network: {
        type: "string",
      },
    },
    required: ["index", "network"],
    additionalProperties: false,
  },
  "cli.vpn.mroute.delmsa": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
      localNetwork: {
        type: "string",
      },
      remoteNetwork: {
        type: "string",
      },
    },
    required: ["index", "localNetwork", "remoteNetwork"],
    additionalProperties: false,
  },
  "cli.vpn.mroute.list": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.vpn.mss.default": null,
  "cli.vpn.mss.set": {
    type: "object",
    properties: {
      connectionType: {
        type: "number",
        enum: [3, 1, 2, 4, 6, 5, 7],
      },
      mss: {
        type: "integer",
        minimum: 512,
      },
    },
    required: ["connectionType", "mss"],
    additionalProperties: false,
  },
  "cli.vpn.mss.show": null,
  "cli.vpn.multicast": {
    type: "object",
    properties: {
      scope: {
        type: "string",
        enum: ["H2l", "L2l"],
      },
      index: {
        type: "number",
      },
      mode: {
        type: "string",
        enum: ["Block", "Pass"],
      },
    },
    required: ["scope", "index", "mode"],
    additionalProperties: false,
  },
  "cli.vpn.netbios": {
    type: "object",
    properties: {
      scope: {
        type: "string",
        enum: ["H2l", "L2l"],
      },
      index: {
        type: "number",
      },
      mode: {
        type: "string",
        enum: ["Block", "Pass"],
      },
    },
    required: ["scope", "index", "mode"],
    additionalProperties: false,
  },
  "cli.vpn.option": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
      param: {
        type: "string",
      },
    },
    required: ["index", "param"],
    additionalProperties: false,
  },
  "cli.vpn.ovpn": {
    type: "object",
    properties: {
      param: {
        type: "string",
      },
    },
    required: ["param"],
    additionalProperties: false,
  },
  "cli.vpn.pass2nat": {
    type: "object",
    properties: {
      state: {
        type: "string",
        enum: ["on", "off"],
      },
    },
    required: ["state"],
    additionalProperties: false,
  },
  "cli.vpn.pass2nd": {
    type: "object",
    properties: {
      state: {
        type: "string",
        enum: ["on", "off"],
      },
    },
    required: ["state"],
    additionalProperties: false,
  },
  "cli.vpn.passapm": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.vpn.remote": null,
  "cli.vpn.remote.set": {
    type: "object",
    properties: {
      service: {
        type: "string",
        enum: ["PPTP", "IPsec", "L2TP", "SSLVPN", "OpenVPN", "WireGuard"],
      },
      wanInterface: {
        type: "string",
        description: "`wan1`..`wan12`; omitted applies to the service as a whole.",
      },
      enabled: {
        type: "boolean",
      },
    },
    required: ["service", "enabled"],
    additionalProperties: false,
  },
  "cli.vpn.samesubnet": {
    type: "object",
    properties: {
      param: {
        type: "string",
      },
    },
    required: ["param"],
    additionalProperties: false,
  },
  "cli.vpn.setup": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        maximum: 128,
      },
      param: {
        type: "string",
      },
    },
    required: ["index", "param"],
    additionalProperties: false,
  },
  "cli.vpn.subnet": {
    type: "object",
    properties: {
      index: {
        type: "number",
      },
      lan: {
        type: "integer",
        minimum: 1,
        maximum: 100,
      },
    },
    required: ["index", "lan"],
    additionalProperties: false,
  },
  "cli.vpn.trunk": {
    type: "object",
    properties: {
      param: {
        type: "string",
      },
    },
    required: ["param"],
    additionalProperties: false,
  },
  "cli.vpn.udp": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["add", "del"],
          },
          remoteIp: {
            type: "string",
          },
          remotePort: {
            type: "integer",
            minimum: 1,
            maximum: 65535,
          },
          localPort: {
            type: "integer",
            minimum: 1,
            maximum: 65535,
          },
        },
        required: ["action", "remoteIp", "remotePort", "localPort"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "set",
          },
          serverIp: {
            type: "string",
          },
          serverPort: {
            type: "integer",
            minimum: 1,
            maximum: 65535,
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["action", "serverIp", "serverPort", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "clear",
            description: "`udp.<DeviceID>.local` host name to clear.",
          },
          host: {
            type: "string",
          },
        },
        required: ["action", "host"],
        additionalProperties: false,
      },
    ],
  },
  "cli.vpn.wg.enable": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.vpn.wg.interface": {
    type: "object",
    properties: {
      listenPort: {
        type: "integer",
        minimum: 1,
        maximum: 65535,
      },
      address: {
        type: "string",
        description: "Tunnel address, e.g. `10.0.0.1/24`.",
      },
      mtu: {
        type: "integer",
        minimum: 576,
        maximum: 9000,
      },
    },
    required: ["listenPort", "address"],
    additionalProperties: false,
  },
  "cli.vpn.wg.keygen": null,
  "cli.vpn.wg.keyset": {
    type: "object",
    properties: {
      privateKey: {
        type: "string",
        description: "Base64 private key (secret).",
      },
    },
    required: ["privateKey"],
    additionalProperties: false,
  },
  "cli.vpn.wg.peer": {
    oneOf: [
      {
        type: "object",
        properties: {
          index: {
            type: "integer",
            minimum: 1,
            maximum: 1000,
          },
          action: {
            type: "string",
            enum: ["pubkey", "psk"],
          },
          key: {
            type: "string",
          },
        },
        required: ["index", "action", "key"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "allowedIps",
          },
          allowedIps: {
            type: "string",
          },
        },
        required: ["index", "action", "allowedIps"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "keepalive",
          },
          seconds: {
            type: "integer",
            minimum: 0,
            maximum: 65535,
          },
        },
        required: ["index", "action", "seconds"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          index: {
            type: "number",
          },
          action: {
            const: "clear",
          },
        },
        required: ["index", "action"],
        additionalProperties: false,
      },
    ],
  },
  "cli.vpn.wg.show": null,
  "cli.vrrp.apply": null,
  "cli.vrrp.enable": {
    type: "object",
    properties: {
      onOff: {
        type: "string",
        enum: ["on", "off"],
      },
    },
    required: ["onOff"],
    additionalProperties: false,
  },
  "cli.vrrp.reset": null,
  "cli.vrrp.set": {
    type: "object",
    properties: {
      param: {
        type: "string",
      },
    },
    required: ["param"],
    additionalProperties: false,
  },
  "cli.vrrp.show": null,
  "cli.wan.budget": {
    oneOf: [
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "integer",
            minimum: 1,
            maximum: 12,
          },
          action: {
            const: "state",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["wanInterface", "action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "number",
          },
          action: {
            const: "thresholdMb",
          },
          limitMb: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["wanInterface", "action", "limitMb"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "number",
          },
          action: {
            const: "thresholdGb",
          },
          limitGb: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["wanInterface", "action", "limitGb"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "number",
            description:
              "Refresh time: day 1..30, hour 1..23 (monthly: that day/hour; periodic: every N days + H hours).",
          },
          action: {
            const: "refreshDate",
          },
          day: {
            type: "integer",
            minimum: 1,
            maximum: 30,
          },
          hour: {
            type: "integer",
            minimum: 1,
            maximum: 23,
          },
        },
        required: ["wanInterface", "action", "day", "hour"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "number",
          },
          action: {
            const: "mode",
          },
          mode: {
            type: "string",
            enum: ["monthly", "periodic", "none"],
          },
        },
        required: ["wanInterface", "action", "mode"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "number",
            description: "Periodic mode: today is the Nth day of the billing cycle.",
          },
          action: {
            const: "periodStartDay",
          },
          day: {
            type: "integer",
            minimum: 1,
          },
        },
        required: ["wanInterface", "action", "day"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "number",
            description: "0 cycle in hours, 1 cycle in days.",
          },
          action: {
            const: "customMode",
          },
          customMode: {
            type: "number",
            enum: [0, 1],
          },
        },
        required: ["wanInterface", "action", "customMode"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "number",
          },
          action: {
            const: "customModeResetHour",
          },
          hour: {
            type: "integer",
            minimum: 1,
            maximum: 23,
          },
        },
        required: ["wanInterface", "action", "hour"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "number",
            description: "Bitmap: 1 shut down WAN, 2 mail alert, 4 SMS alert (sum to combine).",
          },
          action: {
            const: "limitAction",
          },
          bitmap: {
            type: "integer",
            minimum: 0,
            maximum: 7,
          },
        },
        required: ["wanInterface", "action", "bitmap"],
        additionalProperties: false,
      },
    ],
  },
  "cli.wan.budget.status": null,
  "cli.wan.detect": null,
  "cli.wan.detect.interval": {
    type: "object",
    properties: {
      wanInterface: {
        type: "string",
      },
      value: {
        type: "integer",
      },
    },
    required: ["wanInterface", "value"],
    additionalProperties: false,
  },
  "cli.wan.detect.mode": {
    oneOf: [
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "string",
          },
          mode: {
            type: "string",
            enum: ["on", "strict", "always_on"],
          },
        },
        required: ["wanInterface", "mode"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "string",
          },
          mode: {
            const: "off",
          },
          timeSeconds: {
            type: "integer",
            minimum: 0,
            maximum: 256,
            description: "ARP detection send time (`-t`, 0..256).",
          },
          intervalSeconds: {
            type: "integer",
            minimum: 0,
            maximum: 256,
            description: "ARP detection interval (`-i`, 0..time).",
          },
        },
        required: ["wanInterface", "mode"],
        additionalProperties: false,
      },
    ],
  },
  "cli.wan.detect.retry": {
    type: "object",
    properties: {
      wanInterface: {
        type: "string",
      },
      value: {
        type: "integer",
      },
    },
    required: ["wanInterface", "value"],
    additionalProperties: false,
  },
  "cli.wan.detect.target": {
    type: "object",
    properties: {
      wanInterface: {
        type: "string",
      },
      ipv4Address: {
        type: "string",
      },
    },
    required: ["wanInterface", "ipv4Address"],
    additionalProperties: false,
  },
  "cli.wan.detect.target2": {
    type: "object",
    properties: {
      wanInterface: {
        type: "string",
      },
      ipv4Address: {
        type: "string",
      },
    },
    required: ["wanInterface", "ipv4Address"],
    additionalProperties: false,
  },
  "cli.wan.detect.targetgw": {
    type: "object",
    properties: {
      wanInterface: {
        type: "string",
      },
      enabled: {
        type: "boolean",
      },
    },
    required: ["wanInterface", "enabled"],
    additionalProperties: false,
  },
  "cli.wan.detect.ttl": {
    type: "object",
    properties: {
      wanInterface: {
        type: "string",
      },
      value: {
        type: "integer",
      },
    },
    required: ["wanInterface", "value"],
    additionalProperties: false,
  },
  "cli.wan.detect2": {
    type: "object",
    properties: {
      settings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            flag: {
              type: "string",
            },
            value: {
              oneOf: [
                {
                  type: "string",
                },
                {
                  type: "number",
                },
              ],
            },
          },
          required: ["flag", "value"],
          additionalProperties: false,
        },
        description:
          "w WAN 1..12, x VPN 1..500, p profile 1..32, t type (0 off, 1 ICMP,\n2 TCP), i/j first/second server IP, k HTTP hostname index 1..20, g\ngateway as third server, d ICMP id / TCP port, v interval s, r retry,\nl retry delay s, b hub VPN ifno.",
      },
    },
    required: ["settings"],
    additionalProperties: false,
  },
  "cli.wan.detect2.result": null,
  "cli.wan.detect2.show": null,
  "cli.wan.detectmtu": {
    type: "object",
    properties: {
      host: {
        type: "string",
      },
      mtuSize: {
        type: "integer",
        minimum: 1000,
        maximum: 1500,
      },
      decreaseSize: {
        type: "integer",
        minimum: 1,
        maximum: 100,
      },
      wanInterface: {
        type: "integer",
        minimum: 1,
        maximum: 12,
      },
      count: {
        type: "integer",
        minimum: 1,
        maximum: 10,
      },
    },
    required: ["host", "mtuSize", "decreaseSize", "wanInterface", "count"],
    additionalProperties: false,
  },
  "cli.wan.detectmtu6": {
    type: "object",
    properties: {
      host: {
        type: "string",
      },
      mtuSize: {
        type: "integer",
        minimum: 1280,
        maximum: 1500,
      },
      wanInterface: {
        type: "integer",
        minimum: 1,
        maximum: 12,
      },
    },
    required: ["host", "mtuSize", "wanInterface"],
    additionalProperties: false,
  },
  "cli.wan.dfcheck": {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
      },
    },
    required: ["enabled"],
    additionalProperties: false,
  },
  "cli.wan.disable": {
    type: "object",
    properties: {
      wanInterface: {
        type: "integer",
        minimum: 1,
        maximum: 12,
      },
    },
    required: ["wanInterface"],
    additionalProperties: false,
  },
  "cli.wan.dns": {
    type: "object",
    properties: {
      wanNo: {
        type: "integer",
        minimum: 1,
        maximum: 10,
      },
      dnsSelect: {
        type: "string",
        enum: ["pri", "sec"],
      },
      ipv4Address: {
        type: "string",
      },
    },
    required: ["wanNo", "dnsSelect", "ipv4Address"],
    additionalProperties: false,
  },
  "cli.wan.dpdkport": {
    type: "object",
    properties: {
      wanNo: {
        type: "integer",
        minimum: 1,
        maximum: 12,
      },
      portId: {
        type: "integer",
        minimum: 0,
        maximum: 64,
      },
    },
    required: ["wanNo", "portId"],
    additionalProperties: false,
  },
  "cli.wan.drop": {
    type: "object",
    properties: {
      wanInterface: {
        type: "string",
        description: "`wan1`..`wan12`.",
      },
    },
    required: ["wanInterface"],
    additionalProperties: false,
  },
  "cli.wan.enable": {
    type: "object",
    properties: {
      wanInterface: {
        type: "integer",
        minimum: 1,
        maximum: 12,
      },
    },
    required: ["wanInterface"],
    additionalProperties: false,
  },
  "cli.wan.failover": {
    oneOf: [
      {
        type: "object",
        properties: {
          action: {
            const: "newlb",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 12,
          },
          settings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                flag: {
                  type: "string",
                  enum: ["d", "p", "a", "n", "u", "m", "y", "l", "z", "j", "x"],
                  description:
                    "a all-meet(1)/any-meet(0); u/d/l/j/p check upload/download/latency/\njitter/packet loss (0/1); m/n upload/download threshold, x latency,\ny jitter, z packet-loss threshold value.",
                },
                value: {
                  type: "number",
                },
              },
              required: ["flag", "value"],
              additionalProperties: false,
            },
          },
        },
        required: ["action", "index", "settings"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "off",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 12,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "show",
          },
          index: {
            type: "integer",
            minimum: 1,
            maximum: 12,
          },
        },
        required: ["action", "index"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          action: {
            const: "on",
          },
          failoverWan: {
            type: "integer",
            minimum: 1,
            maximum: 7,
          },
          disconnectActionEnabled: {
            type: "boolean",
          },
          anyOrAllActionEnabled: {
            type: "boolean",
          },
          mainWan: {
            type: "integer",
            minimum: 1,
            maximum: 7,
          },
          downloadThresholdKbps: {
            type: "integer",
            minimum: 0,
          },
          uploadThresholdKbps: {
            type: "integer",
            minimum: 0,
          },
        },
        required: [
          "action",
          "failoverWan",
          "disconnectActionEnabled",
          "anyOrAllActionEnabled",
          "mainWan",
          "downloadThresholdKbps",
          "uploadThresholdKbps",
        ],
        additionalProperties: false,
      },
    ],
  },
  "cli.wan.forward": {
    type: "object",
    properties: {
      state: {
        type: "string",
        enum: ["on", "off"],
      },
    },
    required: ["state"],
    additionalProperties: false,
  },
  "cli.wan.lb": {
    type: "object",
    properties: {
      wanInterface: {
        type: "string",
      },
      state: {
        type: "string",
        enum: ["on", "off"],
      },
    },
    required: ["wanInterface", "state"],
    additionalProperties: false,
  },
  "cli.wan.lb.mode": {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: ["ip", "session"],
      },
    },
    required: ["mode"],
    additionalProperties: false,
  },
  "cli.wan.lb.status": null,
  "cli.wan.lbel": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        maximum: 32,
      },
      enabled: {
        type: "boolean",
      },
      protocol: {
        type: "string",
        enum: ["all", "tcp", "udp"],
      },
      ipType: {
        type: "number",
        enum: [0, 1, 2],
      },
      objectOrGroupIndex: {
        type: "integer",
        minimum: 0,
        maximum: 500,
      },
      portStart: {
        type: "integer",
        minimum: 0,
        maximum: 65535,
      },
      portEnd: {
        type: "integer",
        minimum: 0,
        maximum: 65535,
      },
      comment: {
        type: "string",
      },
    },
    required: [
      "index",
      "enabled",
      "protocol",
      "ipType",
      "objectOrGroupIndex",
      "portStart",
      "portEnd",
      "comment",
    ],
    additionalProperties: false,
  },
  "cli.wan.lbel.status": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
        maximum: 32,
      },
    },
    required: ["index"],
    additionalProperties: false,
  },
  "cli.wan.lbweight": {
    type: "object",
    properties: {
      settings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            flag: {
              type: "string",
            },
            value: {
              oneOf: [
                {
                  type: "string",
                },
                {
                  type: "number",
                },
              ],
            },
          },
          required: ["flag", "value"],
          additionalProperties: false,
        },
        description:
          "u/d/l/j/p upload/download/latency/jitter/packet-loss priority (3 high, 2 median, 1 low); t template 0..3.",
      },
    },
    required: ["settings"],
    additionalProperties: false,
  },
  "cli.wan.lbweight.status": null,
  "cli.wan.mtu.mtu2": {
    type: "object",
    properties: {
      target: {
        type: "string",
        enum: ["mtu", "mtu2"],
      },
      value: {
        type: "integer",
        minimum: 1000,
        maximum: 1500,
      },
    },
    required: ["target", "value"],
    additionalProperties: false,
  },
  "cli.wan.multifno": {
    type: "object",
    properties: {
      channel: {
        type: "integer",
        minimum: 13,
        maximum: 52,
      },
      wanInterface: {
        type: "integer",
        minimum: 1,
        maximum: 20,
      },
    },
    required: ["channel", "wanInterface"],
    additionalProperties: false,
  },
  "cli.wan.multifno.status": null,
  "cli.wan.mvlan": {
    type: "object",
    properties: {
      pvcNo: {
        type: "integer",
        minimum: 2,
        maximum: 7,
      },
      state: {
        type: "string",
        enum: ["on", "off"],
      },
      ports: {
        type: "array",
        items: {
          type: "number",
        },
      },
    },
    required: ["pvcNo", "state"],
    additionalProperties: false,
  },
  "cli.wan.phymode": {
    type: "object",
    properties: {
      wanNo: {
        type: "integer",
        minimum: 1,
        maximum: 12,
      },
      mode: {
        const: 0,
        description: "Physical mode; the firmware documents only 0 = Ethernet (WAN2 only).",
      },
    },
    required: ["wanNo", "mode"],
    additionalProperties: false,
  },
  "cli.wan.phymode.status": null,
  "cli.wan.pppmru": {
    type: "object",
    properties: {
      wanInterface: {
        type: "integer",
        minimum: 1,
        maximum: 12,
      },
      mruSize: {
        type: "integer",
        minimum: 1400,
        maximum: 1600,
      },
    },
    required: ["wanInterface", "mruSize"],
    additionalProperties: false,
  },
  "cli.wan.status": null,
  "cli.wan.vlan": {
    oneOf: [
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "integer",
            minimum: 1,
            maximum: 12,
          },
          action: {
            const: "tag",
          },
          tagValue: {
            oneOf: [
              {
                const: -1,
              },
              {
                type: "integer",
                minimum: 1,
                maximum: 4095,
              },
            ],
          },
        },
        required: ["wanInterface", "action", "tagValue"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "number",
          },
          action: {
            const: "state",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["wanInterface", "action", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          wanInterface: {
            type: "number",
          },
          action: {
            const: "priority",
          },
          priority: {
            type: "integer",
            minimum: 0,
            maximum: 7,
          },
        },
        required: ["wanInterface", "action", "priority"],
        additionalProperties: false,
      },
    ],
  },
  "cli.wan.vlan.stat": null,
  "cli.wan.voipdect": {
    oneOf: [
      {
        type: "object",
        properties: {
          option: {
            const: "enable",
          },
          enabled: {
            type: "boolean",
          },
        },
        required: ["option", "enabled"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          option: {
            type: "string",
            enum: ["threshold", "better"],
            description: "`-t` threshold MOS 2.0..4.0 / `-b` better-WAN margin 0.1..1.0.",
          },
          mos: {
            type: "number",
          },
        },
        required: ["option", "mos"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          option: {
            const: "debugWan",
          },
          wan: {
            type: "integer",
            minimum: 1,
            maximum: 12,
          },
        },
        required: ["option", "wan"],
        additionalProperties: false,
      },
    ],
  },
  "cli.wan.voipdect.rtp": null,
  "cli.wan.voipdect.view": null,
  "cli.wol": {
    oneOf: [
      {
        type: "object",
        properties: {
          macAddress: {
            type: "string",
          },
        },
        required: ["macAddress"],
        additionalProperties: false,
      },
      {
        type: "object",
        properties: {
          ipAddress: {
            type: "string",
          },
        },
        required: ["ipAddress"],
        additionalProperties: false,
      },
    ],
  },
  "cli.wol.fromwan": {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: ["on", "off", "any"],
      },
    },
    required: ["mode"],
    additionalProperties: false,
  },
  "cli.wol.fromwansetting": {
    type: "object",
    properties: {
      index: {
        type: "integer",
        minimum: 1,
      },
      ipAddress: {
        type: "string",
      },
      mask: {
        type: "string",
      },
    },
    required: ["index", "ipAddress", "mask"],
    additionalProperties: false,
  },
};
