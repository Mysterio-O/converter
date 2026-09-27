import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-amber text-[#1A1200] font-bold hover:brightness-105 active:brightness-95 disabled:opacity-45",
  secondary:
    "bg-panel-2 text-text border border-line font-semibold hover:bg-line/40 disabled:opacity-45",
  ghost:
    "bg-transparent text-text-dim hover:text-text hover:bg-panel-2 disabled:opacity-45",
  danger:
    "bg-danger text-white font-semibold hover:brightness-110 disabled:opacity-45",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-5 py-3 text-[14.5px] rounded-lg gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap transition-all cursor-pointer disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
