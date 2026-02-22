import { Bell, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  apiConnected?: boolean;
}

export const Header = ({ apiConnected = false }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      {/* Title Placeholder */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-foreground">Analytics Platform</h2>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* API Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
          {apiConnected ? (
            <Wifi className="w-4 h-4 text-green" />
          ) : (
            <WifiOff className="w-4 h-4 text-destructive" />
          )}
          <span className="text-sm text-muted-foreground">
            {apiConnected ? 'API Connected' : 'API Offline'}
          </span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </Button>

        {/* User Avatar - Simplified */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary" />
        </div>
      </div>
    </header>
  );
};