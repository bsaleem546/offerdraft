export function StatusBadge({ status }: { status: string }) {
  const isComplete = status === "Complete";
  const isDraft = status === "Draft";
  const color = isComplete
    ? "var(--color-success)"
    : isDraft
    ? "var(--color-accent)"
    : "var(--color-text-sec)";
  return (
    <span
      className="inline-flex items-center gap-1.5 label-xs px-2 py-1 rounded-sm"
      style={{ color, background: "transparent" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {status}
    </span>
  );
}
