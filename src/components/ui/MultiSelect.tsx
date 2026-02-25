"use client";

import { useState, useRef, useEffect } from "react";

type MultiSelectProps = {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Cari...",
  allowCustom = false,
}: MultiSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options by search, excluding already-selected
  const filtered = options.filter(
    (o) =>
      o.toLowerCase().includes(search.toLowerCase()) &&
      !selected.includes(o),
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addItem = (value: string) => {
    if (!selected.includes(value)) {
      onChange([...selected, value]);
    }
    setSearch("");
    inputRef.current?.focus();
  };

  const removeItem = (value: string) => {
    onChange(selected.filter((s) => s !== value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && search === "" && selected.length > 0) {
      removeItem(selected[selected.length - 1]);
    }
    if (e.key === "Enter" && search) {
      e.preventDefault();
      if (filtered.length > 0) {
        addItem(filtered[0]);
      } else if (allowCustom) {
        addItem(search);
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="ms-root">
      {/* ── Tags + Search Input ── */}
      <div
        className={`ms-container ${open ? "ms-container--focus" : ""}`}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div className="ms-tags">
          {selected.map((s) => (
            <span key={s} className="ms-tag">
              <span className="ms-tag-label">{s}</span>
              <button
                type="button"
                className="ms-tag-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(s);
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : "Cari..."}
            className="ms-input"
          />
        </div>
        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          className={`ms-chevron ${open ? "ms-chevron--open" : ""}`}
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </div>

      {/* ── Dropdown ── */}
      {open && (filtered.length > 0 || (allowCustom && search)) && (
        <div className="ms-dropdown">
          <div className="ms-dropdown-list">
            {filtered.slice(0, 30).map((option) => (
              <button
                key={option}
                type="button"
                className="ms-option"
                onClick={() => addItem(option)}
              >
                {option}
              </button>
            ))}
            {filtered.length > 30 && (
              <div className="ms-more">
                +{filtered.length - 30} lainnya, ketik untuk filter...
              </div>
            )}
            {allowCustom &&
              search &&
              !options.includes(search) &&
              !selected.includes(search) && (
                <button
                  type="button"
                  className="ms-option ms-option--custom"
                  onClick={() => addItem(search)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Tambahkan &ldquo;{search}&rdquo;
                </button>
              )}
          </div>
        </div>
      )}

      {/* ── No results hint ── */}
      {open && filtered.length === 0 && search && !allowCustom && (
        <div className="ms-dropdown">
          <div className="ms-empty">Tidak ditemukan &ldquo;{search}&rdquo;</div>
        </div>
      )}
    </div>
  );
}
