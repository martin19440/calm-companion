import Link from "next/link";

export default function MedicationPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Medication</p>
        <h1 className="text-3xl font-bold">Medication reminders</h1>
        <p className="text-lg text-slate-600">
          Reminder notes and medicine details can be shown here in a simple format.
        </p>
        <Link
          href="/"
          className="w-fit rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
