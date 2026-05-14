import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "pre_order" | "sale" | "sold_out" | "draft" | "winner";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
  pre_order: "bg-amber-50 text-amber-800 border-amber-200",
  sale: "bg-green-50 text-green-800 border-green-200",
  sold_out: "bg-neutral-100 text-neutral-700 border-neutral-300",
  draft: "bg-neutral-50 text-neutral-500 border-neutral-200",
  winner: "bg-violet-50 text-violet-800 border-violet-200",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
