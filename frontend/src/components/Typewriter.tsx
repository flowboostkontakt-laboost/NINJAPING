"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Types the AI report out character-by-character ("live intelligence" feel),
 * then bolds any keyword phrases once fully revealed. New cards animate; older
 * cards (animate=false) render instantly.
 */
export function Typewriter({
  text,
  keywords,
  animate,
  speed = 12,
}: {
  text: string;
  keywords: string[];
  animate: boolean;
  speed?: number;
}) {
  const [count, setCount] = useState(animate ? 0 : text.length);
  const done = count >= text.length;

  useEffect(() => {
    if (!animate) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, animate, speed]);

  const shown = text.slice(0, count);

  const rendered = useMemo(() => {
    if (!done) return shown;
    return highlight(text, keywords);
  }, [done, shown, text, keywords]);

  return (
    <span>
      {rendered}
      {animate && !done && <span className="caret text-cyan-400">▋</span>}
    </span>
  );
}

function highlight(text: string, keywords: string[]) {
  const valid = keywords.filter((k) => k && k.trim().length > 1);
  if (valid.length === 0) return text;
  const escaped = valid
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length);
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(re);
  return parts.map((part, i) =>
    valid.some((k) => k.toLowerCase() === part.toLowerCase()) ? (
      <strong key={i} className="font-semibold text-white">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
