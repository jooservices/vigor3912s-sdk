import { ddnsShowAll } from "../../../src/domains/ddns.js";
import { describeOperation } from "../../support/operation-cases.js";

describeOperation({
  operation: ddnsShowAll,
  classification: "read",
  valid: [[undefined, "ddns show"]],
  // Multi-account output must never go through the single-account parser.
  sampleOutput: "Index: 1\nDomain Name: a.example\nIndex: 2\nDomain Name: b.example\n",
  expectedParse: { raw: "Index: 1\nDomain Name: a.example\nIndex: 2\nDomain Name: b.example" },
});
