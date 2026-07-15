"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, LOCALE_LABELS, type Locale } from "./dictionary";

// Presentational-only listbox dropdown, shared between the landing page
// (localStorage-backed, see locale-switcher.tsx) and the dashboard (cookie +
// router.refresh(), see app/app/app-language-switcher.tsx) — those two
// persistence mechanisms genuinely diverge, so only the markup/interaction
// is worth deduplicating, not the persistence itself. A native <select>
// can't be restyled to match this dark, highly custom UI (the browser owns
// the popup's chrome), hence a custom listbox instead.
export function LocaleDropdown({ value, onSelect }: { value: Locale; onSelect: (locale: Locale) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function moveFocus(from: number, delta: number): void {
    const next = (from + delta + LOCALES.length) % LOCALES.length;
    const el = rootRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[next];
    el?.focus();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
      >
        {LOCALE_LABELS[value]}
        <svg
          viewBox="0 0 24 24"
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 min-w-[7rem] overflow-hidden rounded-card border border-border bg-surface-elevated py-1 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.8)]"
        >
          {LOCALES.map((code, i) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={value === code}
                tabIndex={0}
                onClick={() => {
                  onSelect(code);
                  setOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveFocus(i, 1);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveFocus(i, -1);
                  } else if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(code);
                    setOpen(false);
                  }
                }}
                className={`block w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                  value === code ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-surface"
                }`}
              >
                {LOCALE_LABELS[code]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
