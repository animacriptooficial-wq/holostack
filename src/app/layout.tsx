import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth"
import { ThemeProvider } from "@/lib/theme"
import { getSiteTheme } from "@/lib/theme-store"
import { BackToTop } from "@/components/BackToTop"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "HoloStack",
  description: "Ecosystemo unificado de desenvolvimento com IA",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const siteTheme = await getSiteTheme()
  return (
    <html lang="pt-BR" data-theme={siteTheme ?? "carbon"}>
      <body className={inter.className}>
        <ThemeProvider initialTheme={siteTheme}>
          <AuthProvider>{children}</AuthProvider>
          <BackToTop />
        </ThemeProvider>
      </body>
    </html>
  )
}
