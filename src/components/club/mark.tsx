export function ClubMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M24 8c3 6 4 10 4 14 4-2 8-2 12 0-4 4-8 6-12 7 1 5 3 9 8 13-7-1-12-4-16-8-4 4-9 7-16 8 5-4 7-8 8-13-4-1-8-3-12-7 4-2 8-2 12 0 0-4 1-8 4-14z"
        fill="currentColor"
        fillOpacity="0.92"
      />
    </svg>
  );
}
