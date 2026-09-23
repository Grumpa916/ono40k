import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function RuleFold({
  kicker,
  title,
  text,
  badges,
  defaultOpen = false,
  className,
  children,
}: {
  kicker?: string;
  title: string;
  text?: string;
  badges?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left sm:px-4"
      >
        <div className="min-w-0 flex-1">
          {kicker ? <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">{kicker}</p> : null}
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <p className="min-w-0 truncate font-medium">{title}</p>
            {badges}
          </div>
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="space-y-3 px-3 pb-3 sm:px-4">
          {text ? <p className="text-sm leading-relaxed text-muted-foreground">{text}</p> : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}
