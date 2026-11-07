import { CLASS_COLOR_OPTIONS, DEFAULT_CLASS_COLOR } from "@/lib/class-colors";

export function ClassColorOptions({ value }: { value?: string | null }) {
  const selected = value ?? DEFAULT_CLASS_COLOR;
  const options = CLASS_COLOR_OPTIONS.some((option) => option.value === selected)
    ? CLASS_COLOR_OPTIONS
    : [...CLASS_COLOR_OPTIONS, { name: "Current", value: selected }];

  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {options.map((option) => (
        <label key={option.value} className="group grid justify-items-center gap-1.5 text-xs text-slate-500">
          <input
            className="peer sr-only"
            type="radio"
            name="color"
            value={option.value}
            defaultChecked={option.value === selected}
            aria-label={`${option.name} schedule color`}
          />
          <span
            className="h-8 w-8 rounded-full border border-black/10 ring-offset-2 transition group-hover:scale-110 peer-checked:ring-2 peer-checked:ring-slate-800 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-600"
            style={{ backgroundColor: option.value }}
          />
          <span>{option.name}</span>
        </label>
      ))}
    </div>
  );
}
