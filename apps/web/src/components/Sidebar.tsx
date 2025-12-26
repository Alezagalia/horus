/**
 * Sidebar Navigation Component - Glassmorphism Design
 * Sprint 11 - US-096
 * Sprint 13 - US-124 (Navigation update)
 * UX Redesign: Professional Glassmorphism Theme
 */

import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: string;
  gradient?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  collapsible?: boolean;
}

const menuSections: MenuSection[] = [
  {
    title: 'Principal',
    items: [{ name: 'Dashboard', path: '/', icon: '🏠', gradient: 'from-indigo-500 to-purple-500' }],
  },
  {
    title: 'Productividad',
    items: [
      { name: 'Tareas', path: '/tasks', icon: '✅', gradient: 'from-amber-500 to-orange-500' },
      { name: 'Hábitos', path: '/habits', icon: '🎯', gradient: 'from-blue-500 to-cyan-500' },
      { name: 'Calendario', path: '/calendar', icon: '📅', gradient: 'from-pink-500 to-rose-500' },
      { name: 'Conocimiento', path: '/resources', icon: '📚', gradient: 'from-violet-500 to-purple-500' },
    ],
  },
  {
    title: 'Dinero',
    items: [
      { name: 'Cuentas', path: '/accounts', icon: '💳', gradient: 'from-emerald-500 to-teal-500' },
      { name: 'Movimientos', path: '/transactions', icon: '💸', gradient: 'from-green-500 to-emerald-500' },
      { name: 'Gastos Mensuales', path: '/monthly-expenses', icon: '📆', gradient: 'from-indigo-500 to-violet-500' },
    ],
    collapsible: true,
  },
  {
    title: 'Fitness',
    items: [
      { name: 'Ejercicios', path: '/exercises', icon: '💪', gradient: 'from-orange-500 to-red-500' },
      { name: 'Rutinas', path: '/routines', icon: '🏋️', gradient: 'from-fuchsia-500 to-pink-500' },
      { name: 'Mi Progreso', path: '/workouts', icon: '📈', gradient: 'from-purple-500 to-indigo-500' },
    ],
    collapsible: true,
  },
  {
    title: 'Configuración',
    items: [
      { name: 'Categorías', path: '/categories', icon: '🏷️', gradient: 'from-gray-500 to-slate-500' },
    ],
    collapsible: true,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  return (
    <>
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-72 glass-sidebar
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center h-20 px-6 border-b border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white text-xl font-bold">H</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Horus</h1>
              <p className="text-xs text-gray-500 -mt-1">Productivity Suite</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={`${sectionIndex > 0 ? 'mt-6' : ''}`}>
              {/* Section Header */}
              {section.collapsible ? (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors group"
                >
                  <span>{section.title}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      collapsedSections[section.title] ? '-rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}

              {/* Section Items */}
              <div
                className={`space-y-1 mt-1 overflow-hidden transition-all duration-300 ${
                  collapsedSections[section.title] ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
                }`}
              >
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm border border-indigo-100'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`text-xl transition-transform duration-200 ${
                            isActive ? 'scale-110' : 'group-hover:scale-110'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.name}</span>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200/50 p-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 mb-3">
            {/* Avatar with gradient */}
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
                {user ? getInitials(user.name) : 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 hover:shadow-md transition-all duration-200 group"
          >
            <svg
              className="w-5 h-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
