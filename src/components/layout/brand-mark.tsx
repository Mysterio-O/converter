import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-8 w-8", className)}
    >
      <rect width="100" height="100" rx="20" fill="#1A1E25" />
      <rect
        x="18"
        y="30"
        width="64"
        height="40"
        rx="4"
        fill="none"
        stroke="#F5A623"
        strokeWidth="5"
      />
      <circle cx="34" cy="50" r="7" fill="#F5A623" />
      <circle cx="66" cy="50" r="7" fill="#4FD1C5" />
    </svg>
  );
}
