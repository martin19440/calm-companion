"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const actions = [
  { href: "/routine", label: "Today's Routine", icon: "📋", color: "bg-sky-100" },
  { href: "/medication", label: "Medication", icon: "💊", color: "bg-emerald-100" },
  { href: "/family", label: "Family", icon: "👨‍👩‍👧", color: "bg-amber-100" },
  { href: "/memory-book", label: "Memory Book", icon: "📖", color: "bg-rose-100" },
];

export default function HomePage() {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    );
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <header className="mb-8 space-y-3 sm:mb-10">
          <h1 className="text-4xl font-bold sm:text-5xl">Calm Companion</h1>
          <div className="pt-3">
            <h2 className="text-3xl font-semibold text-slate-800 sm:text-4xl">Good morning</h2>
            <p className="mt-2 text-xl text-slate-600" aria-live="polite">
              {today || " "}
            </p>
          </div>
        </header>

        <nav aria-label="My Day" className="grid flex-1 content-start gap-5 sm:grid-cols-2 sm:gap-6">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex min-h-40 items-center gap-5 rounded-3xl border border-slate-200 ${action.color} p-6 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-400 sm:min-h-44 sm:p-8`}
            >
              <span aria-hidden="true" className="shrink-0 text-5xl sm:text-6xl">
                {action.icon}
              </span>
              <span className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {action.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="mt-8 sm:mt-10">
          <Link
            href="/help"
            className="flex min-h-20 w-full items-center justify-center rounded-3xl bg-sky-800 px-6 py-5 text-2xl font-bold text-white shadow-sm transition hover:bg-sky-900 focus:outline-none focus:ring-4 focus:ring-sky-400 sm:text-3xl"
          >
            Help
          </Link>
        </div>
      </div>
    </main>
  );
}
