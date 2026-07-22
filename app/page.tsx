import Link from "next/link";

const actions = [
  { href: "/family", label: "Family", description: "Open family support and updates" },
  { href: "/memory-book", label: "Memory Book", description: "Save and revisit cherished memories" },
  { href: "/routine", label: "Today's Routine", description: "View the day’s planned activities" },
  { href: "/medication", label: "Medication", description: "Check reminders and medicine notes" },
  { href: "/help", label: "Help", description: "Get support and guidance" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-3 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Calm Companion
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome back
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Choose a task below to keep the day feeling calm, simple, and supported.
          </p>
        </header>

        <section aria-label="Main actions" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex min-h-36 flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-300"
            >
              <div>
                <h2 className="text-2xl font-semibold">{action.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
              </div>
              <span className="mt-6 inline-flex w-fit items-center rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
                Open
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
