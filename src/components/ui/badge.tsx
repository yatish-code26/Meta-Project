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
          "border-destructive/30 bg-destructive/10 text-destructive font-semibold",
        outline: "text-foreground border-border bg-card",
        success: "border-success/30 bg-success/10 text-success font-semibold",
        warning: "border-warning/40 bg-warning/10 text-warning font-semibold",
        telemetry: "border-primary/30 bg-primary/10 text-primary font-mono text-xs",
        synthetic: "border-border bg-muted text-muted-foreground font-mono text-xs tracking-wide",
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
