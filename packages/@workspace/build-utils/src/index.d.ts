import type { UserProjectConfigExport } from "vitest/config";

const DEFAULT: (
  entries: string | string[] | Record<string, string>
) => UserProjectConfigExport;
export default DEFAULT;
