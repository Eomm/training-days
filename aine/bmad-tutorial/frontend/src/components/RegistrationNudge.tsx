// frontend/src/components/RegistrationNudge.tsx
import { useState } from "react";

const SESSION_KEY = "nudge-dismissed";

interface RegistrationNudgeProps {
  todoCount: number;
}

export function RegistrationNudge({ todoCount }: RegistrationNudgeProps) {
  const [dismissed, setDismissed] = useState<boolean>(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );

  if (dismissed || todoCount < 5) return null;

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "true");
    setDismissed(true);
  }

  return (
    <div
      role="status"
      className="w-full rounded-md bg-zinc-50 border border-zinc-200 p-3 flex items-center justify-between gap-3"
    >
      <p className="text-sm text-zinc-700">
        💾 Register to keep your tasks forever — it&rsquo;s free.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss registration prompt"
        className="text-zinc-400 hover:text-zinc-600 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  );
}
