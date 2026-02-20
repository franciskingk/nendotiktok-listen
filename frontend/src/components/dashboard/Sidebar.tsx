import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Search,
  TrendingUp,
  Users,
  Hash,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const navItems: { icon: any, label: string }[] = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar = ({ currentView, onNavigate }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div
        onClick={() => onNavigate('Dashboard')}
        className="flex items-center gap-3 p-6 border-b border-sidebar-border cursor-pointer group"
      >
        <div className="flex items-center justify-center transition-transform group-hover:scale-110 duration-300 w-10 h-10 text-primary">
          <img
            src="/logo-icon.svg"
            alt="Nendo"
            className="w-full h-full"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-foreground tracking-tighter text-lg leading-none">NENDO</span>
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-80">Intelligence</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.label)}
            className={cn(
              'flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200',
              currentView === item.label
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
            )}
          >
            <item.icon className={cn('w-5 h-5', currentView === item.label && 'text-primary')} />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse Toggle Only */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>
    </aside>
  );
};