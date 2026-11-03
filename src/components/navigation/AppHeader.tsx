import React from 'react';
import { Plane } from 'lucide-react';

export type Screen = 'trips' | 'trip' | 'recovery' | 'confirmed';

interface AppHeaderProps {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onRestart: () => void;
  isDisrupted: boolean;
}

export function AppHeader({ screen, onNavigate, isDisrupted }: AppHeaderProps) {
  const links: { id: Screen; label: string }[] = [
    { id: 'trips', label: 'Trips' },
    { id: 'trip', label: 'Itinerary' },
    { id: 'recovery', label: 'Recovery' },
    { id: 'confirmed', label: 'Confirmed' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <button
          onClick={() => onNavigate('trips')}
          className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
        >
          <Plane className="w-4 h-4 text-primary" strokeWidth={2} />
          <span className="font-['Fraunces'] text-lg tracking-tight">RouteX</span>
          {isDisrupted && (
            <span className="ml-1 text-xs font-['Inter'] font-medium bg-warning/15 text-warning border border-warning/30 rounded-full px-2 py-0.5">
              Disrupted
            </span>
          )}
        </button>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => onNavigate(l.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                screen === l.id
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

