export type { CommandResult, ExecuteOptions, FromTransportOptions } from "./client.js";
export { Vigor3912SClient } from "./client.js";
export { OperationNotImplementedError, Vigor3912SError, sdkErrorCodes } from "./errors.js";
export type { SdkErrorCode, Vigor3912SErrorOptions } from "./errors.js";

export const sdkPackageName = "@jooservices/vigor3912s-sdk" as const;

export interface SdkMetadata {
  readonly packageName: typeof sdkPackageName;
  readonly status: "cli-operations-implemented";
}

export const sdkMetadata: SdkMetadata = {
  packageName: sdkPackageName,
  status: "cli-operations-implemented",
};
