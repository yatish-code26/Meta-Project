import * as React from "react";
import { cn } from "../../lib/utils";

export interface SliderProps {
  value: number | number[];
  min: number;
  max: number;
  step?: number;
  onChange?: (val: number) => void;
  onValueChange?: (val: number[]) => void;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  onValueChange,
  className,
  disabled = false,
  "aria-label": ariaLabel,
}) => {
  const numericVal = Array.isArray(value) ? value[0] ?? min : value;
  const percentage = Math.min(100, Math.max(0, ((numericVal - min) / (max - min)) * 100));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Number(e.target.value);
    onChange?.(newVal);
    onValueChange?.([newVal]);
  };

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center py-2", className)}>
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numericVal}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={handleChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <div
        className="pointer-events-none absolute h-4 w-4 rounded-full border-2 border-blue-600 bg-background shadow-md transition-all"
        style={{ left: `calc(${percentage}% - 8px)` }}
      />
    </div>
  );
};
