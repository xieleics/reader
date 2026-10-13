import { readdir } from "node:fs/promises";
import { join } from "node:path";

// Finder does not inherit paths configured by terminal startup files. Discover
// version-manager installations without executing a shell or reading credentials.
export async function cliPath({
  home,
  env,
  platform,
}: {
  home: string;
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
}): Promise<string> {
  const separator = platform === "win32" ? ";" : ":";
  const paths = [
    join(home, ".local", "bin"),
    join(home, ".kimi-code", "bin"),
    ...(platform === "win32" ? [] : ["/opt/homebrew/bin", "/usr/local/bin"]),
    ...(env.PATH || "").split(separator),
  ];
  if (platform === "darwin") {
    paths.push(
      join(env.VOLTA_HOME || join(home, ".volta"), "bin"),
      join(env.ASDF_DATA_DIR || join(home, ".asdf"), "shims"),
      join(env.MISE_DATA_DIR || join(home, ".local", "share", "mise"), "shims"),
      join(home, ".npm-global", "bin"),
    );
    const roots = [
      {
        root: join(env.NVM_DIR || join(home, ".nvm"), "versions", "node"),
        suffix: "bin",
      },
      {
        root: join(home, ".local", "share", "fnm", "node-versions"),
        suffix: "installation/bin",
      },
      {
        root: join(
          home,
          "Library",
          "Application Support",
          "fnm",
          "node-versions",
        ),
        suffix: "installation/bin",
      },
    ];
    for (const { root, suffix } of roots) {
      try {
        const entries = await readdir(root, { withFileTypes: true });
        const versions = entries
          .filter(
            (entry) =>
              (entry.isDirectory() || entry.isSymbolicLink()) &&
              /^v\d+\.\d+\.\d+$/.test(entry.name),
          )
          .map((entry) => entry.name)
          .sort((a, b) => b.localeCompare(a, "en", { numeric: true }));
        paths.push(...versions.map((version) => join(root, version, suffix)));
      } catch (error) {
        // Missing or inaccessible optional managers must not prevent startup.
        if (!(error instanceof Error)) throw error;
      }
    }
  }
  return [...new Set(paths.filter(Boolean))].join(separator);
}
