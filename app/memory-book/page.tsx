"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { loadSharedItems, saveSharedItems } from "../lib/shared-data-client";

type MemoryEntry = {
  id: string;
  name: string;
  relationship: string;
  memory: string;
  photo: string;
};

type MemoryFormState = {
  name: string;
  relationship: string;
  memory: string;
  photo: string;
};

const STORAGE_KEY = "calm-companion-memory-book";

const initialFormState: MemoryFormState = {
  name: "",
  relationship: "",
  memory: "",
  photo: "",
};

export default function MemoryBookPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MemoryFormState>(initialFormState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    loadSharedItems<MemoryEntry>("memory-book", STORAGE_KEY)
      .then(setMemories)
      .catch(() => undefined)
      .finally(() => {
        setHasLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoaded) {
      return;
    }

    void saveSharedItems("memory-book", memories);
  }, [hasLoaded, memories]);

  function resetForm() {
    setFormData(initialFormState);
    setEditingMemoryId(null);
    setIsFormOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = formData.name.trim();
    const relationship = formData.relationship.trim();
    const memory = formData.memory.trim();
    const photo = formData.photo.trim();

    if (!name || !relationship || !memory) {
      return;
    }

    if (editingMemoryId) {
      setMemories((currentMemories) =>
        currentMemories.map((entry) =>
          entry.id === editingMemoryId
            ? { ...entry, name, relationship, memory, photo }
            : entry,
        ),
      );
    } else {
      const newMemory: MemoryEntry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        relationship,
        memory,
        photo,
      };

      setMemories((currentMemories) => [newMemory, ...currentMemories]);
    }

    resetForm();
  }

  function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setFormData((current) => ({ ...current, photo: result }));
      }
    };

    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setFormData((current) => ({ ...current, photo: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleEditMemory(memory: MemoryEntry) {
    setEditingMemoryId(memory.id);
    setFormData({
      name: memory.name,
      relationship: memory.relationship,
      memory: memory.memory,
      photo: memory.photo,
    });
    setIsFormOpen(true);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Memory Book
              </p>
              <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Memory Book</h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-600">
                Save the moments that matter most in a calm, easy-to-read place.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isFormOpen && editingMemoryId) {
                  resetForm();
                  return;
                }

                if (isFormOpen) {
                  resetForm();
                  return;
                }

                setFormData(initialFormState);
                setEditingMemoryId(null);
                setIsFormOpen(true);
              }}
              className="rounded-2xl bg-sky-700 px-5 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
            >
              {isFormOpen ? "Close form" : "+ Add Memory"}
            </button>
          </div>

          {isFormOpen ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingMemoryId ? "Edit Memory" : "Add Memory"}
                </h2>
              </div>

              <div>
                <label htmlFor="name" className="mb-2 block text-base font-semibold text-slate-700">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-0 focus:border-sky-500"
                  placeholder="Maya"
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
                  placeholder="Grandmother"
                />
              </div>

              <div>
                <label htmlFor="memory" className="mb-2 block text-base font-semibold text-slate-700">
                  Memory
                </label>
                <textarea
                  id="memory"
                  name="memory"
                  rows={5}
                  value={formData.memory}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, memory: event.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-0 focus:border-sky-500"
                  placeholder="Write down the memory you want to keep close."
                />
              </div>

              <div>
                <label htmlFor="photo" className="mb-2 block text-base font-semibold text-slate-700">
                  Upload a photo (optional)
                </label>
                <input
                  ref={fileInputRef}
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-0 focus:border-sky-500"
                />
              </div>

              {formData.photo ? (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  Remove Photo
                </button>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 px-5 py-4 text-lg font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  {editingMemoryId ? "Save changes" : "Save memory"}
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

        <div className="space-y-4">
          {memories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <p className="text-xl font-semibold text-slate-800">No memories saved yet.</p>
              <p className="mt-2 text-lg text-slate-600">
                Use the button above to add the first memory.
              </p>
            </div>
          ) : (
            memories.map((memory) => (
              <article
                key={memory.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                        {memory.relationship}
                      </p>
                      <h2 className="mt-1 text-3xl font-semibold text-slate-900">{memory.name}</h2>
                    </div>
                    <p className="text-lg leading-8 text-slate-700 whitespace-pre-wrap">
                      {memory.memory}
                    </p>
                    {memory.photo ? (
                      <img
                        src={memory.photo}
                        alt={`${memory.name} memory photo`}
                        className="max-h-72 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-lg font-medium text-slate-500">
                        No Photo
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEditMemory(memory)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-300"
                  >
                    Edit
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

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
