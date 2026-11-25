import type { BuilderComponent } from "@/types/builder";

/** Layout-Links: Base64 von UTF-8-JSON. Kompatibel mit dem Arrivo-Dashboard (Import/Export). */
export function encodeLayoutState(components: BuilderComponent[]): string {
  const bytes = new TextEncoder().encode(JSON.stringify(components));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function decodeLayoutState(state: string): unknown {
  const bin = atob(state);
  try {
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  } catch {
    return JSON.parse(bin); // ältere Links
  }
}
