import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 tabular-nums",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-border/60 bg-secondary/80 text-secondary-foreground",
        destructive:
          "border-rose-500/30 bg-rose-950/40 text-rose-300 font-semibold",
        outline: "text-zinc-300 border-border bg-card/60",
        success: "border-emerald-500/30 bg-emerald-950/40 text-emerald-300 font-semibold",
        warning: "border-amber-500/40 bg-amber-950/40 text-amber-300 font-semibold",
        telemetry: "border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-mono text-[11px]",
        synthetic: "border-indigo-500/30 bg-indigo-950/50 text-indigo-300 font-mono text-[11px] tracking-wide",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
