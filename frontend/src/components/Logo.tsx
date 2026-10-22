export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display-lg text-headline-lg tracking-wide text-primary ${className}`}>
      go<span className="italic">Drinking</span>
    </span>
  );
}
