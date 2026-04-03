import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/shared/lib/trpc-provider";
import { HeaderActions } from "@/shared/components/header-actions";
import { Sidebar } from "@/shared/components/sidebar";
import { SkipNav } from "@/shared/components/skip-nav";
import { KeyboardShortcutsHelp } from "@/shared/components/keyboard-shortcuts-help";
import { PageThemeProvider } from "@/shared/components/page-theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meta-tsundr Next Gen - AI Agent Platform",
  description: "Next-generation development platform with AI agents, Figma MCP, and automated testing",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meta-tsundr",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex" suppressHydrationWarning>
        <SkipNav />
        <TRPCProvider>
          <PageThemeProvider>
            <Sidebar />
            <div className="flex flex-1 flex-col min-w-0">
              <header className="flex items-center justify-end border-b border-border px-6 py-3 md:pl-4" role="banner">
                <HeaderActions />
              </header>
              <main id="main-content" className="flex-1">
                {children}
              </main>
            </div>
            <KeyboardShortcutsHelp />
          </PageThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
