"use client";

import { useState, type ComponentPropsWithoutRef } from "react";

export default function PasswordInput({ className = "", ...props }: Omit<ComponentPropsWithoutRef<"input">, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-1.5">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`min-h-11 w-full rounded border border-dusk/30 bg-fog py-2 pl-3 pr-12 text-sm text-ink placeholder:text-ink/50 ${className}`}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 grid min-w-11 place-items-center rounded text-dusk hover:bg-dusk/10 focus-visible:outline focus-visible:outline-dusk"
        onClick={() => setVisible(!visible)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5">
          {visible ? (
            <>
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a13 13 0 0 1-2.2 3M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7a9.3 9.3 0 0 0 4-.9" />
            </>
          ) : (
            <>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="2.5" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
