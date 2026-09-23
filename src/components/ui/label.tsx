import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground", className)}
      {...props}
    />
  );
}
