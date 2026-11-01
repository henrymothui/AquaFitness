import { Flash, Field, Panel, buttonClass, inputClass } from "@/components/ui";
import { createSchedule, updateSchedule } from "@/app/studio/actions";
import { WEEKDAYS, weekdayLabel } from "@/lib/dates";
import { timeInputValue } from "@/lib/format";
import { listClassTypes, listSchedules } from "@/lib/queries";

export const metadata = { title: "Weekly times" };

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const [classes, schedules] = await Promise.all([listClassTypes(false), listSchedules()]);

  return (
    <main className="grid gap-6">
      <div>
        <h1 className="text-4xl text-lagoon">Weekly times</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          Saving a time fills the next 12 weeks. Removing one date later does not delete the weekly
          rule. Turning the rule off clears upcoming classes and returns their credits.
        </p>
      </div>
      <Flash error={params.error} notice={params.notice} />
      <Panel title="Add a weekly time">
        {classes.length === 0 ? (
          <p className="text-sm text-ink/70">Add an active class first.</p>
        ) : (
          <form action={createSchedule} className="grid gap-4 md:grid-cols-2">
            <Field label="Class">
              <select name="class_type_id" required className={inputClass}>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Day">
              <select name="weekday" required className={inputClass} defaultValue={1}>
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start">
              <input name="start_time" type="time" required defaultValue="18:00" className={inputClass} />
            </Field>
            <Field label="End">
              <input name="end_time" type="time" required defaultValue="18:45" className={inputClass} />
            </Field>
            <Field label="Spots for this time" hint="Leave blank to use the class default, usually 10">
              <input name="capacity" type="number" min={1} max={100} className={inputClass} />
            </Field>
            <div className="flex items-end">
              <button className={buttonClass}>Add weekly time</button>
            </div>
          </form>
        )}
      </Panel>
      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <form key={schedule.id} action={updateSchedule} className="grid gap-3 rounded-3xl border border-line bg-card p-4 md:grid-cols-6">
            <input type="hidden" name="id" value={schedule.id} />
            <p className="font-medium md:col-span-6">{schedule.class_name}</p>
            <Field label="Day">
              <select name="weekday" defaultValue={schedule.weekday} className={inputClass}>
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start">
              <input name="start_time" type="time" required defaultValue={timeInputValue(schedule.start_time)} className={inputClass} />
            </Field>
            <Field label="End">
              <input name="end_time" type="time" required defaultValue={timeInputValue(schedule.end_time)} className={inputClass} />
            </Field>
            <Field label="Spots">
              <input name="capacity" type="number" min={1} max={100} defaultValue={schedule.capacity ?? ""} placeholder="Default" className={inputClass} />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={schedule.active} />
              On
            </label>
            <div className="flex items-end">
              <button className={buttonClass}>Save {weekdayLabel(schedule.weekday)}</button>
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}
