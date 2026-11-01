import { PublicHeader, SiteFooter } from "@/components/ui";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl px-4 pb-8">
        <h1 className="text-4xl text-lagoon">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-ink/80">
          <p>
            This site shows the class timetable, special classes, and pack prices. It does not ask
            you to create an account.
          </p>
          <p>
            The studio desk keeps the name and contact details needed to record a booking or a
            class pack. That information is used to run classes, packs, and follow-up with people
            who already train here. It is not sold.
          </p>
          <p>
            Questions about a booking, or about the details the studio holds, can be asked at the
            desk: 12 Vo Truong Toan, Ho Chi Minh City.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
