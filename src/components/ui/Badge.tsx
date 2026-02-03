import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "info" | "success";
};

const tones = {
  neutral: "border-slate-200 text-slate-500",
  info: "border-blue-200 text-blue-600",
  success: "border-emerald-200 text-emerald-600",
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
