import React, { InputHTMLAttributes } from "react";
import "./input.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ ...props }, ref) => {
    return (
      <input
        ref={ref}
        className="ui-input"
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
