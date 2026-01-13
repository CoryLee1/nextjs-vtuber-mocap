"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, value, onValueChange, min = 0, max = 1, step = 0.01, showValue = true, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      onValueChange(newValue);
    };

    return (
      <div className="space-y-1">
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">{label}</label>
            {showValue && (
              <span className="text-xs text-muted-foreground font-mono">
                {value.toFixed(2)}
              </span>
            )}
          </div>
        )}
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className={cn(
            "w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb",
            className
          )}
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((value - min) / (max - min)) * 100}%, hsl(var(--muted)) ${((value - min) / (max - min)) * 100}%, hsl(var(--muted)) 100%)`,
          }}
          {...props}
        />
      </div>
    );
  }
)
Slider.displayName = "Slider"

export { Slider }

