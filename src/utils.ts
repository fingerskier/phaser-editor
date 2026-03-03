/** Generate a unique ID using timestamp + random suffix. */
export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
