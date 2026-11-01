import { PublicHeader, SiteFooter } from "@/components/ui";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl px-4 pb-8">
        <h1 className="text-4xl text-lagoon">Terms of Service</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-ink/80">
          <p>
            Hydrofit Aquafitness runs pool classes at 12 Vo Truong Toan, Ho Chi Minh City. The
            timetable, special classes, and pack prices on this site are what the studio is
            currently offering.
          </p>
          <p>
            A place is held when the studio desk records the booking, and only while the class
            still has room. A class stops taking bookings when it reaches its spot limit.
          </p>
          <p>
            Class packs are paid at the desk. Each class you attend uses one credit. A pack ends
            when those credits are used, or when its validity period ends if one is set.
          </p>
          <p>
            Class times can change. If a session moves or is cancelled, the studio will say so at
            the desk.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
