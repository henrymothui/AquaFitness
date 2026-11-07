export const DEFAULT_CLASS_COLOR = "#0f766e";

export const CLASS_COLOR_OPTIONS = [
  { name: "Teal", value: "#0f766e" },
  { name: "Cyan", value: "#0891b2" },
  { name: "Sky", value: "#0284c7" },
  { name: "Blue", value: "#2563eb" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Purple", value: "#9333ea" },
  { name: "Fuchsia", value: "#c026d3" },
  { name: "Pink", value: "#db2777" },
  { name: "Rose", value: "#e11d48" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Amber", value: "#d97706" },
  { name: "Lime", value: "#65a30d" },
  { name: "Green", value: "#16a34a" },
  { name: "Emerald", value: "#059669" },
] as const;

export function classColorField(formData: FormData) {
  const color = formData.get("color");
  if (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    throw new Error("Choose a valid six-digit course color");
  }
  return color.toLowerCase();
}
