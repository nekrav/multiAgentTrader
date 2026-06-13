"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

function getBrowserTime() {
  return formatter.format(new Date());
}

export function BrowserClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    let timeoutId: number | undefined;
    let intervalId: number | undefined;

    function update() {
      setTime(getBrowserTime());
    }

    update();
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    timeoutId = window.setTimeout(() => {
      update();
      intervalId = window.setInterval(update, 60_000);
    }, msUntilNextMinute);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <strong aria-live="polite" suppressHydrationWarning>
      {time || "Local Time"}
    </strong>
  );
}
