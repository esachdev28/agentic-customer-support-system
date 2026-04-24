import React from 'react';
import { LayoutDashboard, MessageSquare, Users, Settings, Bell, Search } from 'lucide-react';

export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-surface border-r border-border hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <MessageSquare size={24} className="text-primary" />
            <span className="text-lg font-bold text-textMain tracking-wide">SupportAnalytics</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-primary/10 text-primary rounded-lg transition-colors">
            <LayoutDashboard size={20} />
            <span className="font-medium">Overview</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-textMuted hover:bg-surface hover:text-textMain rounded-lg transition-colors">
            <MessageSquare size={20} />
            <span className="font-medium">All Messages</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-textMuted hover:bg-surface hover:text-textMain rounded-lg transition-colors">
            <Users size={20} />
            <span className="font-medium">Agents</span>
          </a>
        </nav>
        <div className="p-4 border-t border-border">
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-textMuted hover:text-textMain transition-colors">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 flex-shrink-0 bg-surface border-b border-border flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center md:hidden">
            <span className="text-lg font-bold">Analytics</span>
          </div>

          <div className="hidden md:flex items-center bg-background border border-border px-3 py-2 rounded-lg w-96 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            <Search size={18} className="text-textMuted" />
            <input
              type="text"
              placeholder="Search messages, users..."
              className="bg-transparent border-none outline-none text-sm ml-2 w-full text-textMain placeholder:text-textMuted"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-textMuted hover:text-textMain transition-colors rounded-full hover:bg-background">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sender-pending_human rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden shadow-md">
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

