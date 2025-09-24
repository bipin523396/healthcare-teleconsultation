import React, { InputHTMLAttributes } from "react";
import "./slider.css";

export interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  min?: number;
  max?: number;
  step?: number;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ min = 0, max = 100, step = 1, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        className="ui-slider"
        {...props}
      />
    );
  }
);

Slider.displayName = "Slider";
