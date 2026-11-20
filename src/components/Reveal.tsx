"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

/** Layout wrapper kept for semantic section grouping without hiding content at rest. */
export default function Reveal({ children, className = "" }: Props) {
  return <div className={className}>{children}</div>;
}
