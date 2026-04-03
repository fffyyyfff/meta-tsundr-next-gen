'use client';

/**
 * Skip navigation link for keyboard / screen-reader users.
 * Place <SkipNav /> at the very top of <body> and add
 * id="main-content" to the main landmark element.
 */
export function SkipNav({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring focus:outline-none"
    >
      Skip to main content
    </a>
  );
}
