"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { loadSharedItems, saveSharedItems } from "../lib/shared-data-client";

type MedicationItem = {
  id: string;
  medicationName: string;
  dosage: string;
  time: string;
  notes: string;
  lastTaken: string | null;
  taken: boolean;
};

type MedicationFormState = {
  medicationName: string;
  dosage: string;
  time: string;
  notes: string;
  taken: boolean;
};

const STORAGE_KEY = "calm-companion-medication";

const initialFormState: MedicationFormState = {
  medicationName: "",
  dosage: "",
  time: "",
  notes: "",
  taken: false,
};

export default function MedicationPage() {
  const [items, setItems] = useState<MedicationItem[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MedicationFormState>(initialFormState);
  const [remindersDelayedUntil, setRemindersDelayedUntil] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    loadSharedItems<MedicationItem>("medication", STORAGE_KEY)
      .then((loadedItems) => {
        const normalizedItems = loadedItems
          .map((item) => {
            const raw = item as Partial<MedicationItem> & { name?: string };
            const medicationName =
              typeof raw.medicationName === "string"
                ? raw.medicationName
                : typeof raw.name === "string"
                ? raw.name
                : "";
            const dosage = typeof raw.dosage === "string" ? raw.dosage : "";
            const time = typeof raw.time === "string" ? raw.time : "";
            const notes = typeof raw.notes === "string" ? raw.notes : "";
            const lastTaken = typeof raw.lastTaken === "string" ? raw.lastTaken : null;
            const taken = typeof raw.taken === "boolean" ? raw.taken : false;
            const id = typeof raw.id === "string" ? raw.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

            if (!medicationName || !dosage || !time) {
              return null;
            }

            return { id, medicationName, dosage, time, notes, lastTaken, taken };
          })
          .filter((item): item is MedicationItem => item !== null);

        setItems(normalizedItems);
      })
      .catch(() => undefined)
      .finally(() => {
        setHasLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoaded) {
      return;
    }

    void saveSharedItems("medication", items);
  }, [hasLoaded, items]);

  // Refresh the clock during the day and at midnight so status and reminders stay current.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const nextReminderTime = Object.values(remindersDelayedUntil)
      .filter((time) => time > Date.now())
      .sort((left, right) => left - right)[0];

    if (!nextReminderTime) {
      return;
    }

    const timer = window.setTimeout(() => setNow(new Date()), nextReminderTime - Date.now());
    return () => window.clearTimeout(timer);
  }, [remindersDelayedUntil]);

  function resetForm() {
    setFormData(initialFormState);
    setEditingItemId(null);
    setIsFormOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const medicationName = formData.medicationName.trim();
    const dosage = formData.dosage.trim();
    const time = formData.time.trim();
    const notes = formData.notes.trim();

    if (!medicationName || !dosage || !time) {
      return;
    }

    if (editingItemId) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingItemId
            ? { ...item, medicationName, dosage, time, notes }
            : item,
        ),
      );
    } else {
      const newItem: MedicationItem = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        medicationName,
        dosage,
        time,
        notes,
          lastTaken: null,
        taken: false,
      };

      setItems((currentItems) => [newItem, ...currentItems]);
    }

    resetForm();
  }

  function markTakenToday(itemId: string) {
    const today = new Date().toISOString().slice(0, 10);
    setRemindersDelayedUntil((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, lastTaken: today, taken: true } : item,
      ),
    );
  }

  function deleteItem(itemId: string) {
    setRemindersDelayedUntil((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  function remindAgainLater(itemId: string) {
    setRemindersDelayedUntil((current) => ({
      ...current,
      [itemId]: Date.now() + 10 * 60 * 1000,
    }));
  }

  function startEdit(item: MedicationItem) {
    setEditingItemId(item.id);
    setFormData({
      medicationName: item.medicationName,
      dosage: item.dosage,
      time: item.time,
      notes: item.notes,
      taken: item.taken,
    });
    setIsFormOpen(true);
  }

  const timeOrder = ["Morning", "Afternoon", "Evening", "Bedtime"];

  const sortedItems = [...items].sort((left, right) => {
    const leftIndex = timeOrder.indexOf(left.time);
    const rightIndex = timeOrder.indexOf(right.time);

    if (leftIndex === rightIndex) {
      return left.medicationName.localeCompare(right.medicationName);
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });

  const medicationGroups = timeOrder.map((time) => ({
    time,
    items: sortedItems.filter((item) => item.time === time),
  }));

  const todayString = () => new Date().toISOString().slice(0, 10);

  function isTakenToday(item: MedicationItem) {
    return !!item.lastTaken && item.lastTaken === todayString();
  }

  function isOverdue(item: MedicationItem) {
    if (isTakenToday(item)) return false;

    const hourNow = now.getHours() + now.getMinutes() / 60;
    const cutoffMap: Record<string, number> = {
      Morning: 11, // 11:00
      Afternoon: 17, // 17:00
      Evening: 21, // 21:00
      Bedtime: 24, // end of day
    };

    const cutoff = cutoffMap[item.time] ?? 24;
    return hourNow >= cutoff;
  }

  function isMedicationDue(item: MedicationItem) {
    if (isTakenToday(item)) {
      return false;
    }

    const hourNow = now.getHours() + now.getMinutes() / 60;
    const scheduledTimeMap: Record<string, number> = {
      Morning: 8,
      Afternoon: 12,
      Evening: 18,
      Bedtime: 21,
    };
    const scheduledTime = scheduledTimeMap[item.time];

    return (
      scheduledTime !== undefined &&
      hourNow >= scheduledTime &&
      (remindersDelayedUntil[item.id] ?? 0) <= now.getTime()
    );
  }

  function getMedicationStatus(item: MedicationItem) {
    if (isTakenToday(item)) {
      return "Taken" as const;
    }

    return isOverdue(item) ? "Overdue" as const : "Due" as const;
  }

  const statusStyles = {
    Taken: "bg-emerald-100 text-emerald-800",
    Due: "bg-amber-100 text-amber-800",
    Overdue: "bg-red-100 text-red-800",
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Medication
              </p>
              <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Medication</h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-600">
                Keep track of medicines, doses, and reminders in one calm place.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isFormOpen) {
                  resetForm();
                  return;
                }
                setFormData(initialFormState);
                setEditingItemId(null);
                setIsFormOpen(true);
              }}
              className="rounded-2xl bg-sky-700 px-5 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
            >
              {isFormOpen ? "Close form" : "+ Add Medication"}
            </button>
          </div>

          {isFormOpen ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingItemId ? "Edit Medication" : "Add Medication"}
                </h2>
              </div>

              <div>
                <label htmlFor="medicationName" className="mb-2 block text-base font-semibold text-slate-700">
                  Medication name
                </label>
                <input
                  id="medicationName"
                  name="medicationName"
                  value={formData.medicationName}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, medicationName: event.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-0 focus:border-sky-500"
                  placeholder="Vitamin D"
                />
              </div>

              <div>
                <label htmlFor="dosage" className="mb-2 block text-base font-semibold text-slate-700">
                  Dosage
                </label>
                <input
                  id="dosage"
                  name="dosage"
                  value={formData.dosage}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, dosage: event.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-0 focus:border-sky-500"
                  placeholder="1 tablet"
                />
              </div>

              <div>
                <label htmlFor="time" className="mb-2 block text-base font-semibold text-slate-700">
                  Time
                </label>
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, time: event.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-0 focus:border-sky-500"
                >
                  <option value="">Select time of day</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Bedtime">Bedtime</option>
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="mb-2 block text-base font-semibold text-slate-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, notes: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-0 focus:border-sky-500"
                  placeholder="Any reminders or special instructions"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 px-5 py-4 text-lg font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  {editingItemId ? "Save changes" : "Save medication"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </div>

        {sortedItems.some(isMedicationDue) ? (
          <section
            aria-label="Medication reminders"
            className="rounded-3xl border-4 border-amber-300 bg-amber-50 p-6 shadow-sm sm:p-8"
          >
            <h2 className="text-3xl font-bold text-amber-950 sm:text-4xl">Medication Due</h2>
            <div className="mt-5 space-y-4">
              {sortedItems.filter(isMedicationDue).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-amber-200 bg-white p-5"
                >
                  <p className="text-2xl font-bold text-slate-900">{item.medicationName}</p>
                  <p className="mt-1 text-xl text-slate-700">{item.dosage}</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => markTakenToday(item.id)}
                      className="rounded-2xl bg-emerald-600 px-6 py-4 text-xl font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                    >
                      Taken
                    </button>
                    <button
                      type="button"
                      onClick={() => remindAgainLater(item.id)}
                      className="rounded-2xl border border-amber-300 bg-white px-6 py-4 text-lg font-semibold text-amber-900 transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-200"
                    >
                      Remind me again in 10 minutes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-label="Medication list" className="space-y-8">
          {sortedItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <p className="text-xl font-semibold text-slate-800">No medications added yet.</p>
              <p className="mt-2 text-lg text-slate-600">
                Add your first medication above to get started.
              </p>
            </div>
          ) : (
            medicationGroups.map(({ time, items: groupItems }) => (
              <section key={time} aria-label={`${time} medications`} className="space-y-4">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-slate-200 pb-3">
                  <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{time}</h2>
                  <p className="text-lg font-medium text-slate-600">
                    {groupItems.length === 1 ? "1 medication" : `${groupItems.length} medications`}
                  </p>
                </div>
                {groupItems.length === 0 ? (
                  <p className="py-2 text-lg text-slate-500">No medications scheduled for {time.toLowerCase()}.</p>
                ) : (
                  groupItems.map((item) => {
                    const status = getMedicationStatus(item);

                    return (
                      <article
                        key={item.id}
                        className={`rounded-3xl border p-6 shadow-sm ${status === "Taken" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}
                      >
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-base font-semibold ${statusStyles[status]}`}>
                                {status}
                              </span>
                            </div>
                            <h3 className={`text-2xl font-semibold ${status === "Taken" ? "text-slate-500 line-through" : "text-slate-900"}`}>
                              {item.medicationName}
                            </h3>
                            <p className="text-lg text-slate-700">{item.dosage}</p>
                            <p className="text-base leading-7 text-slate-600">
                              {item.notes || "No additional notes."}
                            </p>
                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {status === "Taken" ? (
                              <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white">
                                <span aria-hidden>✅</span>
                                Taken today
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => markTakenToday(item.id)}
                                aria-label={`Mark ${item.medicationName} as taken today`}
                                className="rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                              >
                                Taken
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-lg font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-300"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteItem(item.id)}
                              className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-lg font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </section>
            ))
          )}
        </section>

        <Link
          href="/"
          className="w-fit rounded-full bg-slate-900 px-5 py-3 text-lg font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300"
        >
          Back Home
        </Link>
      </div>
    </main>
  );
}
