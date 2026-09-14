export const sdkErrorCodes = {
  operationNotImplemented: "operation_not_implemented",
  commandFramingRejected: "command_framing_rejected",
  executionTimeout: "execution_timeout",
  outputLimitExceeded: "output_limit_exceeded",
  sessionClosed: "session_closed",
  liveClientRejected: "live_client_rejected",
  forgedOperationRejected: "forged_operation_rejected",
} as const;

export type SdkErrorCode = (typeof sdkErrorCodes)[keyof typeof sdkErrorCodes];

export interface Vigor3912SErrorOptions {
  readonly cause?: unknown;
}

export class Vigor3912SError extends Error {
  public readonly code: SdkErrorCode;

  public constructor(code: SdkErrorCode, message: string, options: Vigor3912SErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "Vigor3912SError";
    this.code = code;
  }
}

export class OperationNotImplementedError extends Vigor3912SError {
  public constructor(message = "This SDK operation is not implemented yet.") {
    super(sdkErrorCodes.operationNotImplemented, message);
    this.name = "OperationNotImplementedError";
  }
}
