import { adjustCustomerCredits, enrollCustomer, grantCustomerDiscount } from "@/app/studio/actions";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { formatWhen } from "@/lib/format";
import type { CustomerAdminEvent, DiscountPlan, GrantedDiscount } from "@/lib/queries";

export type CourseChoice = {
  id: string;
  label: string;
  creditsRequired: number;
};

export function ClientCreditTools({
  customerId,
  liveCredits,
  courses,
  events,
  returnTo,
  timezone,
  discountPlans = [],
  grantedDiscount = null,
}: {
  customerId: string;
  liveCredits: number;
  courses: CourseChoice[];
  events: CustomerAdminEvent[] | null;
  returnTo: string;
  timezone: string;
  discountPlans?: DiscountPlan[];
  grantedDiscount?: GrantedDiscount | null;
}) {
  const choices = discountPlans.filter((plan) => plan.active || plan.id === grantedDiscount?.id);
  const applied = grantedDiscount?.active ? grantedDiscount : null;

  return (
    <div className="grid gap-5">
      <form action={grantCustomerDiscount} className="grid gap-3">
        <input type="hidden" name="customer_id" value={customerId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <Field
          label="Discount package"
          hint={applied
            ? `${applied.name} reduces this client's package price by ${applied.percent}% on new sales and credit orders.`
            : grantedDiscount
              ? `${grantedDiscount.name} is inactive, so package prices stay at the full amount until it is active again.`
              : "Choose a package created under Pricing → Discount. The client's package price is reduced by that percentage."}
        >
          {choices.length === 0 ? (
            <p className="mt-1 text-sm text-ink/60">No discount packages yet. Add one under Pricing → Discount.</p>
          ) : (
            <select name="discount_plan_id" className={inputClass} defaultValue={grantedDiscount?.id ?? ""}>
              <option value="">No discount</option>
              {choices.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · {plan.percent}% off{plan.active ? "" : " · inactive"}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="flex justify-end">
          <button className={buttonClass} disabled={choices.length === 0 && !grantedDiscount}>Save discount</button>
        </div>
      </form>

      <form action={adjustCustomerCredits} className="grid gap-3 border-t border-line pt-5">
        <input type="hidden" name="customer_id" value={customerId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <p className="text-sm text-ink/70">
          Live credits: <span className="font-semibold text-ink">{liveCredits}</span>
        </p>
        <Field label="Change credits" hint="Use a positive number to add credits, or a negative number to remove them. The change is logged.">
          <input name="delta" type="number" required min={-500} max={500} step={1} className={inputClass} />
        </Field>
        <Field label="Note">
          <input name="note" maxLength={160} className={inputClass} />
        </Field>
        <div className="flex justify-end">
          <button className={buttonClass}>Update credits</button>
        </div>
      </form>

      <form action={enrollCustomer} className="grid gap-3 border-t border-line pt-5">
        <input type="hidden" name="customer_id" value={customerId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <Field label="Add to a course" hint="Places this client on the course without them registering. The course price is taken from their credits and logged.">
          {courses.length === 0 ? (
            <p className="mt-1 text-sm text-ink/60">No upcoming courses are open.</p>
          ) : (
            <select name="session_id" required className={inputClass} defaultValue="">
              <option value="" disabled>Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.label}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Note">
          <input name="note" maxLength={160} className={inputClass} disabled={courses.length === 0} />
        </Field>
        <div className="flex justify-end">
          <button className={buttonClass} disabled={courses.length === 0}>Add to course</button>
        </div>
      </form>

      <div className="border-t border-line pt-5">
        <h3 className="text-sm font-semibold text-ink">Activity log</h3>
        {events === null ? (
          <p className="mt-2 text-sm text-ink/60">Loading the activity log…</p>
        ) : events.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">No studio changes have been logged yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {events.map((event) => (
              <li key={event.id} className="rounded-xl border border-line px-3 py-2 text-sm">
                <p className="font-medium text-ink">{event.summary}</p>
                <p className="mt-1 text-xs text-ink/55">
                  {event.adminUsername} · {formatWhen(event.createdAt, timezone)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
