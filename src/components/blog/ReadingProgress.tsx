"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Article reading progress — thin bar pinned to the viewport top.
 * Reuses the existing `.scroll-progress` token (globals.css); the admin
 * shell has its own copy scoped to its scroll container, this one tracks
 * window scroll for public article pages. Decorative: screen readers get
 * the article structure itself, so this is aria-hidden.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const update = () => {
      ticking.current = false;
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="scroll-progress"
      style={{ width: `${progress}%` }}
    />
  );
}
