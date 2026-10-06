import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth"
import { ThemeProvider } from "@/lib/theme"
import { BackToTop } from "@/components/BackToTop"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HoloStack",
  description: "Ecosystemo unificado de desenvolvimento com IA",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" data-theme="carbon">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
          <BackToTop />
        </ThemeProvider>
      </body>
    </html>
  )
}
