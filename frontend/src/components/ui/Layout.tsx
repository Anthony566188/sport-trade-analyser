import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calendar, Target, Settings } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '../../utils/cn'

const NAV = [
  { path: '/',         label: 'Partidas',  icon: <Calendar  className="w-4 h-4" /> },
  { path: '/criteria', label: 'Critérios', icon: <Target    className="w-4 h-4" /> },
  { path: '/settings', label: 'Métodos',   icon: <Settings  className="w-4 h-4" /> },
]

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-turf-50 dark:bg-turf-950 transition-colors duration-200">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-turf-200 dark:border-turf-800 bg-white/80 dark:bg-turf-900/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 font-bold text-turf-900 dark:text-turf-100 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-pitch-600 flex items-center justify-center">
              <span className="text-white text-xs font-black tracking-tight">SC</span>
            </div>
            <span className="hidden sm:inline text-sm font-semibold tracking-tight">Scout</span>
          </Link>

          {/* Nav */}
          <nav className="flex-1 flex items-center gap-1 overflow-x-auto">
            {NAV.map(item => {
              const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150',
                    active
                      ? 'bg-pitch-600 text-white shadow-sm'
                      : 'text-turf-500 dark:text-turf-400 hover:bg-turf-100 dark:hover:bg-turf-800',
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <ThemeToggle />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-turf-200 dark:border-turf-800 py-3 px-4 text-center text-xs text-turf-400 dark:text-turf-600">
        Scout — Análise de Partidas em Tempo Real
      </footer>
    </div>
  )
}
