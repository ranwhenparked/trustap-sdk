import { describe } from "vitest";

function containsNodeModules(url: string): boolean {
  return url.includes("/node_modules/") || url.includes("\\node_modules\\");
}

export function runTrustapSuite(
  moduleUrl: string,
  suiteName: string,
  callback: () => void,
): void {
  const shouldRun = !containsNodeModules(moduleUrl);

  if (shouldRun) {
    callback();
  } else {
    describe.skip(
      suiteName,
      () => {
        // skipped when executed from a dependency context
      },
    );
  }
}
