import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { cliPath } from "./cli-path";

const homes: string[] = [];
afterEach(async () => {
  await Promise.all(
    homes.splice(0).map((home) => rm(home, { recursive: true, force: true })),
  );
});
async function homeDirectory() {
  const home = await mkdtemp(join(tmpdir(), "reader-cli-path-"));
  homes.push(home);
  return home;
}
it("finds NVM installations from a Finder-style environment in numeric version order", async () => {
  const home = await homeDirectory();
  for (const version of ["v9.0.0", "v24.16.0", "not-a-version"]) {
    await mkdir(join(home, ".nvm", "versions", "node", version, "bin"), {
      recursive: true,
    });
  }
  const paths = (
    await cliPath({ home, env: { PATH: "/usr/bin:/bin" }, platform: "darwin" })
  ).split(":");
  const current = join(home, ".nvm", "versions", "node", "v24.16.0", "bin");
  expect(paths).toContain(current);
  expect(paths.indexOf(current)).toBeLessThan(
    paths.indexOf(join(home, ".nvm", "versions", "node", "v9.0.0", "bin")),
  );
  expect(paths.join(":")).not.toContain("not-a-version");
});
it("preserves inherited paths, handles missing managers and supports custom NVM_DIR", async () => {
  const home = await homeDirectory();
  const nvm = join(home, "custom-nvm");
  const bin = join(nvm, "versions", "node", "v22.0.0", "bin");
  await mkdir(bin, { recursive: true });
  const paths = (
    await cliPath({
      home,
      env: { PATH: "/custom/bin:/custom/bin:/usr/bin", NVM_DIR: nvm },
      platform: "darwin",
    })
  ).split(":");
  expect(paths.filter((path) => path === "/custom/bin")).toHaveLength(1);
  expect(paths.indexOf("/custom/bin")).toBeLessThan(paths.indexOf(bin));
  expect(paths).toContain(join(home, ".local", "bin"));
  expect(paths).not.toContain("");
});
it("finds fnm installations and leaves Windows drive paths intact", async () => {
  const home = await homeDirectory();
  const bin = join(
    home,
    "Library",
    "Application Support",
    "fnm",
    "node-versions",
    "v24.0.0",
    "installation",
    "bin",
  );
  await mkdir(bin, { recursive: true });
  expect(await cliPath({ home, env: {}, platform: "darwin" })).toContain(bin);
  const windows = await cliPath({
    home,
    env: { PATH: "C:\\Node;C:\\Windows" },
    platform: "win32",
  });
  expect(windows).toContain("C:\\Node;C:\\Windows");
  expect(windows).not.toContain("/opt/homebrew/bin");
});
