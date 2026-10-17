import { pathToFileURL } from "node:url";

/** Runs a CLI callback only when this module is the invoked entry point. */
export async function runIfMain<T>(
  argvEntryPoint: string | undefined,
  moduleUrl: string,
  run: () => Promise<T>,
): Promise<T | undefined> {
  if (argvEntryPoint === undefined || moduleUrl !== pathToFileURL(argvEntryPoint).href) {
    return undefined;
  }

  return run();
}

/** Maps a failed boolean CLI result to Node's conventional non-zero exit code. */
export async function runBooleanCliIfMain(
  argvEntryPoint: string | undefined,
  moduleUrl: string,
  run: () => Promise<boolean>,
): Promise<void> {
  const succeeded = await runIfMain(argvEntryPoint, moduleUrl, run);

  if (succeeded === false) {
    process.exitCode = 1;
  }
}
