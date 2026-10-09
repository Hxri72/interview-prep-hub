/**
 * Everything the user does (learned, revise later, bookmarks, flashcard results,
 * solved problems) is saved in localStorage on this device only.
 */
import { useSyncExternalStore } from 'react';

const KEY = 'iph-progress-v1';

export interface CardResult {
  knew: boolean; // result of the last attempt
  right: number; // times "I knew it"
  wrong: number; // times "I didn't"
  at: number;
}

export interface Progress {
  learned: Record<string, number>; // topicId → timestamp
  revise: Record<string, number>; // topicId → timestamp
  bookmarks: Record<string, number>; // topicId → timestamp
  cards: Record<string, CardResult>; // cardId → result
  solved: Record<string, number>; // problemId → timestamp
  lastVisited?: { id: string; at: number };
}

const empty = (): Progress => ({ learned: {}, revise: {}, bookmarks: {}, cards: {}, solved: {} });

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    return empty();
  }
}

let state: Progress = read();
const listeners = new Set<() => void>();

function save(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked — progress still works until the tab closes
  }
  listeners.forEach((l) => l());
}

// keep several open tabs in sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = read();
      listeners.forEach((l) => l());
    }
  });
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

type FlagList = 'learned' | 'revise' | 'bookmarks' | 'solved';

export function toggle(list: FlagList, id: string, on?: boolean) {
  const current = { ...state[list] };
  const shouldBeOn = on ?? !current[id];
  if (shouldBeOn) current[id] = Date.now();
  else delete current[id];
  const next = { ...state, [list]: current };
  // learning a topic takes it off the "revise later" list
  if (list === 'learned' && shouldBeOn) {
    const revise = { ...state.revise };
    delete revise[id];
    next.revise = revise;
  }
  save(next);
}

export function recordCard(cardId: string, knew: boolean) {
  const prev = state.cards[cardId];
  save({
    ...state,
    cards: {
      ...state.cards,
      [cardId]: { knew, right: (prev?.right ?? 0) + (knew ? 1 : 0), wrong: (prev?.wrong ?? 0) + (knew ? 0 : 1), at: Date.now() },
    },
  });
}

export function visit(id: string) {
  if (state.lastVisited?.id === id) return;
  save({ ...state, lastVisited: { id, at: Date.now() } });
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(json: string) {
  const data = JSON.parse(json);
  if (typeof data !== 'object' || !data || !('learned' in data)) throw new Error('This is not a progress file.');
  save({ ...empty(), ...data });
}

export function resetProgress() {
  save(empty());
}
