"use client";

import { useEffect } from "react";

const ENABLED = process.env.NEXT_PUBLIC_DEBUG_PREVENTDEFAULT === "1";

export function DebugPreventDefault() {
  useEffect(() => {
    if (!ENABLED) return;

    const old = Event.prototype.preventDefault;
    Event.prototype.preventDefault = function () {
      if (this.type === "click") {
        const target = this.target as Element | null;
        const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
        if (anchor) {
          const href = anchor.getAttribute("href");
          const path = typeof (this as Event).composedPath === "function"
            ? (this as Event).composedPath()
            : [];
          console.group("preventDefault on anchor", href);
          console.log("target:", target);
          console.log("path:", path);
          console.trace();
          console.groupEnd();
        }
      }

      return old.call(this);
    };

    return () => {
      Event.prototype.preventDefault = old;
    };
  }, []);

  return null;
}
