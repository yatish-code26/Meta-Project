import React, { useState, useEffect } from 'react';
import {
  Search,
  Compass,
  Calendar,
  Sliders,
  Users,
  FileCheck2,
  Sparkles,
  Receipt,
  Download,
  Settings,
  HelpCircle,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { ExportService } from '../../services/export/ExportService';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onOpenTripBuilder: () => void;
  onOpenAddOption: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Tools';
  title: string;
  shortcut?: string;
  icon: any;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOpenTripBuilder,
  onOpenAddOption,
  onOpenSettings,
  onOpenHelp,
}: CommandPaletteProps) {
  const { state, dispatch } = useRouteXStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-canvas',
      category: 'Navigation',
      title: 'Recovery Canvas & Paths',
      shortcut: 'G P',
      icon: Compass,
      action: () => {
        onNavigate('canvas');
        dispatch({ type: 'SET_PANEL_TAB', tab: 'options' });
      },
    },
    {
      id: 'nav-twin',
      category: 'Navigation',
      title: 'Digital Twin Simulation Lab',
      shortcut: 'G T',
      icon: Sliders,
      action: () => {
        onNavigate('canvas');
        dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' });
      },
    },
    {
      id: 'nav-team',
      category: 'Navigation',
      title: 'Team Quorum Digital Twin',
      shortcut: 'G Q',
      icon: Users,
      action: () => onNavigate('team'),
    },
    {
      id: 'nav-trips',
      category: 'Navigation',
      title: 'My Trips Portfolio',
      shortcut: 'G M',
      icon: Calendar,
      action: () => onNavigate('trips'),
    },
    {
      id: 'nav-certs',
      category: 'Navigation',
      title: 'Recovery Evidence Certificates',
      shortcut: 'G E',
      icon: FileCheck2,
      action: () => onNavigate('certificates'),
    },
    {
      id: 'nav-itinerary',
      category: 'Navigation',
      title: 'Itinerary Schedule View',
      shortcut: 'G I',
      icon: Calendar,
      action: () => {
        onNavigate('canvas');
        dispatch({ type: 'SET_PANEL_TAB', tab: 'itinerary' });
      },
    },
    {
      id: 'nav-expenses',
      category: 'Navigation',
      title: 'Expense Ledger & Claims',
      shortcut: 'G X',
      icon: Receipt,
      action: () => {
        onNavigate('canvas');
        dispatch({ type: 'SET_PANEL_TAB', tab: 'expenses' });
      },
    },
    {
      id: 'nav-assistant',
      category: 'Navigation',
      title: 'AI Travel Recovery Assistant',
      shortcut: 'G A',
      icon: Sparkles,
      action: () => {
        onNavigate('canvas');
        dispatch({ type: 'SET_PANEL_TAB', tab: 'assistant' });
      },
    },

    // Actions
    {
      id: 'act-new-trip',
      category: 'Actions',
      title: 'Configure New Trip (Builder Wizard)',
      shortcut: 'N',
      icon: Plus,
      action: () => onOpenTripBuilder(),
    },
    {
      id: 'act-add-option',
      category: 'Actions',
      title: 'Add Manual Route Alternative',
      shortcut: 'A',
      icon: Plus,
      action: () => onOpenAddOption(),
    },
    {
      id: 'act-export-ics',
      category: 'Actions',
      title: 'Export Itinerary to iCalendar (.ics)',
      shortcut: 'E I',
      icon: Download,
      action: () => {
        const ics = ExportService.generateIcs(state.trip.itinerary, state.trip.title);
        ExportService.downloadFile(ics, `RouteX-${state.trip.id}.ics`, 'text/calendar');
      },
    },
    {
      id: 'act-export-csv',
      category: 'Actions',
      title: 'Export Expenses to CSV',
      shortcut: 'E C',
      icon: Download,
      action: () => {
        const csv = ExportService.generateExpensesCsv(state.expenses);
        ExportService.downloadFile(csv, `RouteX-Expenses-${state.trip.id}.csv`, 'text/csv');
      },
    },

    // Tools
    {
      id: 'tool-settings',
      category: 'Tools',
      title: 'System Settings & Data Portability',
      shortcut: 'S',
      icon: Settings,
      action: () => onOpenSettings(),
    },
    {
      id: 'tool-help',
      category: 'Tools',
      title: 'Guided Tour & Coach Marks',
      shortcut: 'H',
      icon: HelpCircle,
      action: () => onOpenHelp(),
    },
    {
      id: 'tool-clock-toggle',
      category: 'Tools',
      title: state.clockMode === 'demo' ? 'Switch to Live Real-Time Clock' : 'Switch to Demo Time (13:30 CET)',
      shortcut: 'C',
      icon: Clock,
      action: () =>
        dispatch({
          type: 'SET_CLOCK_MODE',
          mode: state.clockMode === 'demo' ? 'real' : 'demo',
        }),
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Key navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[75vh]">
        {/* Search Input */}
        <div className="p-3.5 border-b border-border flex items-center gap-3 bg-secondary/30">
          <Search className="w-5 h-5 text-muted-foreground ml-1" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to screen... (ESC to exit)"
            className="w-full bg-transparent border-none text-sm font-medium text-foreground focus:outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-card border border-border text-[11px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors text-xs font-semibold ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-primary'}`} />
                    <span>{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] uppercase tracking-wider font-medium ${
                        isSelected ? 'text-white/80' : 'text-muted-foreground'
                      }`}
                    >
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground border border-border'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No matching commands or destinations found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

