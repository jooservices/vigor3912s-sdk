/**
 * The one path that executes a typed operation, shared by
 * `Vigor3912SClient#invoke` and `LiveReadOnlyClient#invoke`: frame, run each
 * frame, refuse router rejections, then parse.
 */

import type { ExecuteOptions } from "../../client.js";
import { InvalidInputError, Vigor3912SError, sdkErrorCodes } from "../../errors.js";
import type { CommandRunner } from "../command-runner.js";
import { inputSchemaFor, schemaProblem } from "../../schemas/index.js";
import type { TypedOperation } from "../registry/operation.js";
import { detectCliRejection } from "./cli-outcome.js";
import type { CommandFrame } from "./framing.js";
import type { CommandExchange } from "./transport.js";

/**
 * Checks the input against the operation's generated JSON Schema first:
 * untyped input (JSON from an MCP tool) may have any shape. A builder that
 * still throws on malformed input reports an input error, not an internal
 * crash. SDK errors pass through.
 */
function buildFramesFor<TInput>(
  operation: TypedOperation<TInput, unknown>,
  input: TInput,
): unknown {
  const schema = inputSchemaFor(operation.manifestId);
  const problem =
    schema === null || schema === undefined ? undefined : schemaProblem(input, schema);

  if (problem !== undefined) {
    throw new InvalidInputError(`Invalid input for "${operation.manifestId}": ${problem}`);
  }

  try {
    return operation.buildFrames(input);
  } catch (error) {
    if (error instanceof Vigor3912SError) {
      throw error;
    }

    throw new InvalidInputError(`Input for "${operation.manifestId}" is malformed.`, {
      cause: error,
    });
  }
}

export async function runOperation<TInput, TOutput>(
  runner: CommandRunner,
  operation: TypedOperation<TInput, TOutput>,
  input: TInput,
  options?: ExecuteOptions,
): Promise<TOutput> {
  // Untyped input (JSON from an MCP tool) can name no documented form, e.g. an
  // unknown `action`, and fall through a builder's `switch`.
  const frames = buildFramesFor(operation, input);

  if (!Array.isArray(frames) || frames.length === 0) {
    throw new InvalidInputError(
      `Input for "${operation.manifestId}" does not select a documented command form.`,
    );
  }

  const exchanges: CommandExchange[] = [];

  for (const frame of frames as readonly CommandFrame[]) {
    const result =
      runner.runWithOverride !== undefined
        ? await runner.runWithOverride(frame.command, operation.executionOverride ?? {}, options)
        : await runner.run(frame.command, options);
    const exchange = { stdout: result.stdout, stderr: result.stderr };
    const rejection = detectCliRejection(exchange);

    // Never parse a rejected command as a result. The message carries only
    // the rejection kind, not router output (no-output-leak rule).
    if (rejection !== undefined) {
      throw new Vigor3912SError(
        sdkErrorCodes.commandRejected,
        `Router rejected "${operation.manifestId}" (${rejection}).`,
      );
    }

    exchanges.push(exchange);
  }

  return operation.parse(exchanges);
}
