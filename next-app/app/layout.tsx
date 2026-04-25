import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Grandmaster Council",
  description: "A multi-agent chess engine that turns move selection into strategic debate.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="antialiased font-sans"
    >
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
