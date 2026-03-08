import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, ScanFace, Users, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Scan', path: '/scan', icon: ScanFace },
    { name: 'Visitors', path: '/visitors', icon: Users },
    { name: 'Logs', path: '/logs', icon: Clock },
  ];

  return (
    <div className="flex flex-col h-screen bg-zinc-50 text-zinc-900 font-sans">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ScanFace className="w-6 h-6 text-emerald-600" />
          <h1 className="text-lg font-semibold tracking-tight">FaceScan Security</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-zinc-200 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <Icon className={cn("w-6 h-6", isActive && "fill-emerald-50")} />
                <span className="text-[10px] font-medium uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
