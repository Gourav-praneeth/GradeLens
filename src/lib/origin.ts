export function appOrigin(request: Request, env: Record<string, string | undefined> = process.env): string {
  const configured = env.PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
  return new URL(request.url).origin;
}
