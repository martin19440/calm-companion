"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSharedItems, saveSharedItems } from "../lib/shared-data-client";

type FamilyContact = {
  id: string;
  firstName: string;
  relationship: string;
  phoneNumber: string;
};

const STORAGE_KEY = "calm-companion-family-contacts";

export default function FamilyPage() {
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    relationship: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    loadSharedItems<FamilyContact>("family", STORAGE_KEY)
      .then(setContacts)
      .catch(() => undefined)
      .finally(() => {
        setHasLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoaded) {
      return;
    }

    void saveSharedItems("family", contacts);
  }, [contacts, hasLoaded]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const firstName = formData.firstName.trim();
    const relationship = formData.relationship.trim();
    const phoneNumber = formData.phoneNumber.trim();

    if (!firstName || !relationship || !phoneNumber) {
      return;
    }

    const newContact: FamilyContact = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      firstName,
      relationship,
      phoneNumber,
    };

    setContacts((currentContacts) => [newContact, ...currentContacts]);
    setFormData({ firstName: "", relationship: "", phoneNumber: "" });
    setIsFormOpen(false);
  }

  function handleCall(phoneNumber: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.location.href = `tel:${phoneNumber}`;
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Family
              </p>
              <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Family</h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-600">
                Keep important people close with a simple, calm contact list.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen((current) => !current)}
              className="rounded-2xl bg-sky-700 px-5 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
            >
              + Add Family Member
            </button>
          </div>

          {isFormOpen ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <label htmlFor="firstName" className="mb-2 block text-base font-semibold text-slate-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, firstName: event.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-0 focus:border-sky-500"
                  placeholder="Alex"
                />
              </div>

              <div>
                <label htmlFor="relationship" className="mb-2 block text-base font-semibold text-slate-700">
                  Relationship
                </label>
                <input
                  id="relationship"
                  name="relationship"
                  value={formData.relationship}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, relationship: event.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-0 focus:border-sky-500"
                  placeholder="Daughter"
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="mb-2 block text-base font-semibold text-slate-700">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, phoneNumber: event.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-0 focus:border-sky-500"
                  placeholder="555-123-4567"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 px-5 py-4 text-lg font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="space-y-4">
          {contacts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <p className="text-xl font-semibold text-slate-800">No family members added yet.</p>
              <p className="mt-2 text-lg text-slate-600">
                Use the button above to add the first contact.
              </p>
            </div>
          ) : (
            contacts.map((contact) => (
              <article
                key={contact.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="text-2xl font-semibold">{contact.firstName}</h2>
                  <p className="mt-2 text-lg text-slate-600">{contact.relationship}</p>
                  <p className="mt-2 text-lg text-slate-800">{contact.phoneNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCall(contact.phoneNumber)}
                  className="rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                >
                  Call
                </button>
              </article>
            ))
          )}
        </div>

        <Link
          href="/"
          className="w-fit rounded-full bg-slate-900 px-5 py-3 text-lg font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
