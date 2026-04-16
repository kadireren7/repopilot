import { isRemoteRepositoryUrl } from "./url";

describe("isRemoteRepositoryUrl", () => {
  it("detects http(s) and git@ URLs", () => {
    expect(isRemoteRepositoryUrl("https://github.com/a/b")).toBe(true);
    expect(isRemoteRepositoryUrl("http://example.com/x.git")).toBe(true);
    expect(isRemoteRepositoryUrl("git@github.com:a/b.git")).toBe(true);
    expect(isRemoteRepositoryUrl(".")).toBe(false);
    expect(isRemoteRepositoryUrl("./foo")).toBe(false);
    expect(isRemoteRepositoryUrl("C:\\code\\repo")).toBe(false);
  });
});
