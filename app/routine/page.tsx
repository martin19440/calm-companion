"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { loadSharedItems, saveSharedItems } from "../lib/shared-data-client";

type RoutineTask = {
  id: string;
  text: string;
  completed: boolean;
};

const STORAGE_KEY = "calm-companion-routine";

export default function RoutinePage() {
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [taskText, setTaskText] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    loadSharedItems<RoutineTask>("routine", STORAGE_KEY)
      .then(setTasks)
      .catch(() => undefined)
      .finally(() => {
        setHasLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoaded) {
      return;
    }

    void saveSharedItems("routine", tasks);
  }, [hasLoaded, tasks]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedText = taskText.trim();
    if (!trimmedText) {
      return;
    }

    const newTask: RoutineTask = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text: trimmedText,
      completed: false,
    };

    setTasks((currentTasks) => [newTask, ...currentTasks]);
    setTaskText("");
  }

  function toggleTaskCompletion(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function deleteTask(taskId: string) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Today&apos;s Routine
              </p>
              <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Today&apos;s Routine</h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-600">
                Keep the day feeling calm with a simple list of tasks to complete.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label htmlFor="taskText" className="mb-2 block text-base font-semibold text-slate-700">
              Add a task
            </label>
            <input
              id="taskText"
              name="taskText"
              value={taskText}
              onChange={(event) => setTaskText(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-0 focus:border-sky-500"
              placeholder="Take medication"
            />
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-5 py-4 text-lg font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300"
            >
              Add task
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <p className="text-xl font-semibold text-slate-800">No tasks yet.</p>
              <p className="mt-2 text-lg text-slate-600">
                Add the first task above to get started.
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-4 text-left">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task.id)}
                      className="h-6 w-6 rounded border-slate-300 text-sky-700 focus:ring-sky-400"
                    />
                    <span
                      className={`text-2xl font-semibold ${task.completed ? "text-slate-400 line-through" : "text-slate-900"}`}
                    >
                      {task.text}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-300"
                  >
                    Delete
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
