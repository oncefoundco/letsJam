"use client";

import { useRef, useState } from "react";

const INITIAL_FILES = ["2026-CRM-deals.csv", "Q2-ProductRoadmap.pdf"];

export function UploadContext() {
  const [files, setFiles] = useState<string[]>(INITIAL_FILES);
  const inputRef = useRef<HTMLInputElement>(null);

  function handlePickClick() {
    inputRef.current?.click();
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files).map((f) => f.name);
    if (picked.length > 0) {
      setFiles((prev) => [...prev, ...picked]);
    }
    e.target.value = "";
  }

  function handleRemove(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={handleFilesChange}
        aria-label="Select context files"
      />
      <button
        type="button"
        onClick={handlePickClick}
        className="inline-flex items-center gap-3 rounded-full bg-[#f5f5f5] p-3 text-[14px] leading-none text-black transition-colors hover:bg-neutral-200"
        style={{ fontFamily: "var(--font-public-sans)" }}
      >
        <PaperclipIcon />
        Select Files
      </button>
      {files.map((name, idx) => (
        <FileChip
          key={`${name}-${idx}`}
          name={name}
          onRemove={() => handleRemove(idx)}
        />
      ))}
    </div>
  );
}

function FileChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-3 rounded-full bg-[#3c5bcb]/10 p-3 text-[14px] leading-none text-[#3c5bcb]"
      style={{ fontFamily: "var(--font-public-sans)" }}
    >
      <DocIcon />
      {name}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="grid h-4 w-4 place-items-center rounded-full text-[#3c5bcb] transition-colors hover:bg-[#3c5bcb]/15"
      >
        <XIcon />
      </button>
    </span>
  );
}

function PaperclipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 11.5l-8.5 8.5a5 5 0 11-7-7l9-9a3.5 3.5 0 014.95 4.95L10.5 18a2 2 0 11-2.83-2.83L16 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
