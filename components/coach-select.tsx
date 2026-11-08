import { Field, inputClass } from "@/components/ui";

export type CoachOption = {
  id: string;
  fullName: string;
  active: boolean;
};

export function CoachSelect({
  coaches,
  value,
  legacyName,
}: {
  coaches?: CoachOption[];
  value: string | null;
  legacyName?: string | null;
}) {
  const options = (coaches ?? []).filter((coach) => coach.active || coach.id === value);

  return (
    <Field label="Coach">
      <select name="coach_id" defaultValue={value ?? ""} className={inputClass}>
        <option value="">Unassigned</option>
        {options.map((coach) => (
          <option key={coach.id} value={coach.id}>
            {coach.fullName}{coach.active ? "" : " (inactive)"}
          </option>
        ))}
      </select>
      {!value && legacyName ? (
        <span className="mt-1 block text-xs font-normal text-ink/55">Previously listed as {legacyName}. Choose a coach to assign this course.</span>
      ) : null}
      {options.length === 0 ? (
        <span className="mt-1 block text-xs font-normal text-ink/55">Add a coach in Studio → Coach before assigning one.</span>
      ) : null}
    </Field>
  );
}
