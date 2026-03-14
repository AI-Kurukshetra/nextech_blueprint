import { cn } from "@/lib/utils";

type FormStatusProps = {
  className?: string;
  message?: string;
  tone?: "error" | "success";
};

export function FormStatus({
  className,
  message,
  tone = "error",
}: FormStatusProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
        className
      )}
      role="status"
    >
      {message}
    </div>
  );
}
