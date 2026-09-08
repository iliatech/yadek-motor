export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-border pb-5">
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && (
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
