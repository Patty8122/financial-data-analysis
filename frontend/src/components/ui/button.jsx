import React from 'react';
import clsx from 'clsx';

const Button = React.forwardRef(({ 
  className, 
  variant = "default",
  size = "default",
  children,
  disabled,
  type = "button",
  ...props 
}, ref) => {
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200",
    destructive: "bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-600",
    outline: "border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100",
    ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
    link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10"
  };

  return (
    <button
      type={type}
      className={clsx(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button };