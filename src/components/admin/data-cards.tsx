import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Wrapper: visible only on mobile (<md). Put stacked record cards inside. */
export function MobileList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-3 md:hidden", className)}>{children}</div>;
}

/** Wrapper: the desktop table, hidden on mobile. */
export function DesktopOnly({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("hidden md:block", className)}>{children}</div>;
}

/** A single record rendered as a card on mobile. */
export function RecordCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border bg-card p-4 shadow-sm", className)}>{children}</div>;
}

/** label : value row inside a RecordCard. */
export function Field({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-1 text-sm", className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
