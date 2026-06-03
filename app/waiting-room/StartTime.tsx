"use client";

import { useEffect, useState } from "react";

// Immediate jams start as soon as they're created, so the "start time" is simply
// when the room was created — shown in the viewer's local timezone. Formatted on
// the client because the waiting-room page is a server component (server-side it
// would render in UTC, not the user's zone). Replaces the old hardcoded "3:30pm".
export function StartTime({ createdAt }: { createdAt: number }) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    setTime(
      new Date(createdAt)
        .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        .replace(/\s+/g, "")
        .toLowerCase()
    );
  }, [createdAt]);
  return <>Start time{time ? ` ${time}` : ""}</>;
}
