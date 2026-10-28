import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";

describe("repository hook contracts",()=>{
  it.each(["post-checkout","post-commit","post-merge","pre-push"])("keeps the LFS %s forwarding hook",name=>{
    const hook=readFileSync(new URL(`../../../.githooks/${name}`,import.meta.url),"utf8");
    expect(hook).toMatch(/^#!\/bin\/sh/);
    expect(hook).toContain(`git lfs ${name} "$@"`);
    expect(hook).toContain("command -v git-lfs");
  });
  it("retains the staged-content secret check before commit",()=>{
    const hook=readFileSync(new URL("../../../.githooks/pre-commit",import.meta.url),"utf8");
    expect(hook).toContain("set -eu");
    expect(hook).toContain("node Tooling/scripts/check-secrets.mjs");
  });
});
