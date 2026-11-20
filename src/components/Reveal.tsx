"use client";

export default function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
