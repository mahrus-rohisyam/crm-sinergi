import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "info" | "success" | "danger" | "warning";
};

const tones = {
  neutral: "border-slate-200 text-slate-500",
  info: "border-blue-200 text-blue-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-600",
  danger: "border-rose-200 bg-rose-50 text-rose-600",
  warning: "border-amber-200 bg-amber-50 text-amber-600",
};

export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
