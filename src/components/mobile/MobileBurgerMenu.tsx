"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, Users, Trophy, FileText, User, BarChart3, Calendar, BookOpen, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  requiresAuth?: boolean
}

const allNavItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Start' },
  { href: '/rwk-tabellen', icon: Trophy, label: 'Tabellen' },
  { href: '/statistiken', icon: BarChart3, label: 'Statistiken' },
  { href: '/termine', icon: Calendar, label: 'Termine' },
  { href: '/dokumente', icon: FileText, label: 'Dateien' },
  { href: '/handbuch', icon: BookOpen, label: 'Handbuch' },
  { href: '/support', icon: MessageSquare, label: 'Support' },
  { href: '/dashboard-auswahl', icon: Users, label: 'Verein', requiresAuth: true },
  { href: '/login', icon: User, label: 'Login' },
]

export function MobileBurgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredItems = allNavItems.filter(item => {
    if (item.requiresAuth && !user) return false
    if (item.href === '/login' && user) return false
    return true
  })

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Burger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="relative z-50"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Menu Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-background border-l shadow-lg z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menü</h2>
            <Button variant="ghost" size="icon" onClick={closeMenu}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 pb-safe-area-bottom">
            <nav className="space-y-2">
              {filteredItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                      "text-sm font-medium",
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Footer with safe area */}
          <div className="p-4 border-t pb-safe-area-bottom">
            <p className="text-xs text-muted-foreground text-center">
              RWK Einbeck App v0.12.2
            </p>
          </div>
        </div>
      </div>
    </>
  )
}