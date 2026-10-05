"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Globe, Key, ChevronDown, Menu, X, LogOut, User as UserIcon } from "lucide-react"

interface HeaderProps {
  title?: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const [language, setLanguage] = useState("BR PT")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { name: "Recursos", href: "/#recursos" },
    { name: "Preços", href: "/#precos" },
    { name: "Documentação", href: "#" },
    { name: "Blog", href: "#" },
  ]

  return (
    <header className="fixed top-0 left-64 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center shadow-glow-gold">
              <span className="text-black font-bold text-xl">H</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-text">HoloStack</h1>
              {subtitle && <p className="text-xs text-textSecondary">{subtitle}</p>}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-textSecondary hover:text-accent transition-colors font-medium"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <button className="flex items-center gap-1 px-3 py-2 text-sm text-textSecondary hover:text-accent transition-colors">
              <Globe className="w-4 h-4" />
              <span>{language}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* API Button */}
            <button
              onClick={() => router.push("/settings")}
              className="flex items-center gap-2 px-4 py-2 bg-surface2 hover:bg-surface3 border border-border rounded-lg text-sm text-text transition-colors"
            >
              <Key className="w-4 h-4" />
              <span>API</span>
            </button>

            {/* User */}
            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout()
                    router.push("/login")
                  }}
                  className="p-2 text-textSecondary hover:text-error transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primaryDark rounded-lg text-sm text-black font-semibold transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>Entrar</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-text"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block py-2 text-sm text-textSecondary hover:text-accent transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
