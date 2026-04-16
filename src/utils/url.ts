export function isRemoteRepositoryUrl(target: string): boolean {
  const t = target.trim();
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("git@");
}
