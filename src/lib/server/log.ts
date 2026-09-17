type LogLevel = "info" | "warn" | "error";

export function log(
  level: LogLevel,
  fields: Record<string, unknown> & { module: string; event: string },
): void {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "kimlan",
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
