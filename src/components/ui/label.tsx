import React, { LabelHTMLAttributes } from "react";
import "./label.css";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, ...props }, ref) => {
    return (
      <label ref={ref} className="ui-label" {...props}>
        {children}
      </label>
    );
  }
);

Label.displayName = "Label";
