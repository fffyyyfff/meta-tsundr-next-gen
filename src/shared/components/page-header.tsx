'use client';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="border-l-4 border-[var(--page-accent)] pl-4">
        <h1 className="text-page-title">{title}</h1>
        {description && (
          <p className="mt-1 text-lg text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
