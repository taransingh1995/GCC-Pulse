export function nowIso(): string {
  return new Date().toISOString();
}
export function shortDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
export function formatLocalTime(d: Date): string {
  return d.toLocaleString(undefined, { hour: "2-digit", minute:"2-digit" });
}
