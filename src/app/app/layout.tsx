import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = { title: "Editor" };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
