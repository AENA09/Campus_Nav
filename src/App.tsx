import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react';
import {
  CAMPUS_LOCATIONS,
  type CampusLocation,
  type LocationCategory,
} from './data/campusData';
import { findShortestPath, type RouteStep } from './utils/pathfinding';
import { CampusMap } from './components/CampusMap';
import { NavigationPanel } from './components/NavigationPanel';
import { LocationDrawer } from './components/LocationDrawer';

export default function App() {
  // Theme state synced with <html class="dark">
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('medicaps-nav-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      window.localStorage.setItem('medicaps-nav-theme', 'dark');
    } else {
      root.classList.remove('dark');
      window.localStorage.setItem('medicaps-nav-theme', 'light');
    }
  }, [isDark]);

  // Routing & interaction state
  const [startId, setStartId] = useState<string>('main-gate');
  const [endId, setEndId] = useState<string>('b-block');
  const [accessibleOnly, setAccessibleOnly] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<'All' | LocationCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [focusedPoint, setFocusedPoint] = useState<{ x: number; y: number } | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Compute live shortest path via Dijkstra
  const route = useMemo(
    () => findShortestPath(startId, endId, accessibleOnly),
    [startId, endId, accessibleOnly]
  );

  // Live search across building names, codes, departments, floors, and keywords
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return CAMPUS_LOCATIONS.filter((loc) => {
      const haystack = [
        loc.name,
        loc.shortName,
        loc.code,
        loc.category,
        loc.summary,
        ...loc.departments,
        ...loc.keywords,
        ...loc.floors.map((f) => f.details),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [searchQuery]);

  const searchMatchedIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return new Set(searchMatches.map((m) => m.id));
  }, [searchQuery, searchMatches]);

  // Close search dropdown on outside click & bind "/" focus shortcut
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'SELECT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSelectedLocation(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectLocation = useCallback((loc: CampusLocation) => {
    setSelectedLocation(loc);
    setFocusedPoint({ x: loc.x, y: loc.y });
    setIsSearchOpen(false);
  }, []);

  const handleNavigateHere = useCallback(
    (locationId: string) => {
      if (locationId === startId) {
        setStartId(locationId === 'main-gate' ? 'admin-block' : 'main-gate');
      }
      setEndId(locationId);
      setActiveStepId(null);
      setSelectedLocation(null);
      setIsMobileSheetOpen(true);
    },
    [startId]
  );

  const handleSetAsStart = useCallback(
    (locationId: string) => {
      if (locationId === endId) {
        setEndId(locationId === 'b-block' ? 'central-library' : 'b-block');
      }
      setStartId(locationId);
      setActiveStepId(null);
      setSelectedLocation(null);
    },
    [endId]
  );

  const handleSwap = useCallback(() => {
    setStartId(endId);
    setEndId(startId);
    setActiveStepId(null);
  }, [startId, endId]);

  const handleStartFromMainGate = useCallback(() => {
    setStartId('main-gate');
    if (endId === 'main-gate') {
      setEndId('admin-block');
    }
    setActiveStepId(null);
  }, [endId]);

  const handleSelectStep = useCallback((step: RouteStep) => {
    setActiveStepId(step.id);
    setFocusedPoint({ ...step.focusPoint });
  }, []);

  const startLoc = CAMPUS_LOCATIONS.find((l) => l.id === startId);
  const endLoc = CAMPUS_LOCATIONS.find((l) => l.id === endId);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Navigation Bar — Clean 3-zone header */}
      <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-4 sm:gap-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-5">
        {/* Zone 1: Single-line Brand Mark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setSearchQuery('');
            setActiveCategory('All');
            setSelectedLocation(null);
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800 rounded"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-800 dark:bg-red-700 text-white">
            <MapPin className="w-4 h-4" />
          </span>
          <span className="font-display text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Medi-Caps Campus Nav
          </span>
        </a>

        {/* Zone 2: Live Department & Building Search */}
        <div ref={searchBoxRef} className="relative flex-1 max-w-md min-w-0">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              placeholder="Search blocks or departments (e.g. CSE, Library, MBA)..."
              aria-label="Search campus buildings or departments"
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700/90 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-8 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-red-800 dark:focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-800/15 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Live Search Results Dropdown */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-11 z-50 max-h-80 overflow-y-auto campus-scroll rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              {searchMatches.length === 0 ? (
                <div className="px-4 py-5 text-center text-sm text-slate-500 dark:text-slate-400">
                  No campus blocks or departments matched &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {searchMatches.map((loc) => (
                    <li key={loc.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {loc.name}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                            {loc.code}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                          {loc.category} · {loc.departments.slice(0, 2).join(', ')}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Zone 3: Theme Toggle Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Application Workspace */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Left Navigation Sidebar */}
        <aside className="hidden lg:flex lg:w-[376px] shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
          <NavigationPanel
            startId={startId}
            endId={endId}
            onStartChange={(id) => {
              setStartId(id);
              setActiveStepId(null);
            }}
            onEndChange={(id) => {
              setEndId(id);
              setActiveStepId(null);
            }}
            onSwap={handleSwap}
            onStartFromMainGate={handleStartFromMainGate}
            accessibleOnly={accessibleOnly}
            onToggleAccessible={() => setAccessibleOnly((v) => !v)}
            route={route}
            activeStepId={activeStepId}
            onSelectStep={handleSelectStep}
          />
        </aside>

        {/* Interactive Campus Map Viewport */}
        <main className="relative flex-1 min-w-0 h-full">
          <CampusMap
            route={route}
            startId={startId}
            endId={endId}
            selectedLocationId={selectedLocation?.id ?? null}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            searchMatchedIds={searchMatchedIds}
            accessibleOnly={accessibleOnly}
            focusedPoint={focusedPoint}
            onSelectLocation={handleSelectLocation}
            isDark={isDark}
          />

          {/* Slide-Over Location Details Drawer */}
          <LocationDrawer
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
            onNavigateHere={handleNavigateHere}
            onSetAsStart={handleSetAsStart}
            isCurrentStart={selectedLocation?.id === startId}
            isCurrentEnd={selectedLocation?.id === endId}
          />
        </main>

        {/* Mobile Bottom Sheet for Route Planner & Directions */}
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30">
          {/* Backdrop when sheet is expanded */}
          {isMobileSheetOpen && (
            <div
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] -z-10"
              onClick={() => setIsMobileSheetOpen(false)}
              aria-hidden="true"
            />
          )}

          <div
            className={`flex flex-col border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl transition-[max-height] duration-200 ease-out rounded-t-2xl overflow-hidden ${
              isMobileSheetOpen ? 'h-[76vh]' : 'h-14'
            }`}
          >
            {/* Compact Peek Bar / Sheet Handle */}
            <button
              type="button"
              onClick={() => setIsMobileSheetOpen((v) => !v)}
              className="flex h-14 shrink-0 w-full items-center justify-between gap-3 px-4 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              aria-expanded={isMobileSheetOpen}
              aria-label={isMobileSheetOpen ? 'Collapse directions panel' : 'Expand directions panel'}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {startLoc?.shortName} → {endLoc?.shortName}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {route.totalDistanceMeters} m ·{' '}
                  {startId === endId
                    ? '0 min'
                    : route.exactWalkingMinutes < 1
                      ? '< 1 min walk'
                      : `${route.walkingTimeMinutes} min walk`}
                  {accessibleOnly ? ' · Step-free' : ''}
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-800 dark:text-red-400 whitespace-nowrap shrink-0">
                {isMobileSheetOpen ? 'Map' : 'Directions'}
                {isMobileSheetOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </span>
            </button>

            {/* Full Navigation Panel inside expanded mobile sheet */}
            {isMobileSheetOpen && (
              <div className="flex-1 min-h-0 overflow-hidden border-t border-slate-200 dark:border-slate-800">
                <NavigationPanel
                  startId={startId}
                  endId={endId}
                  onStartChange={(id) => {
                    setStartId(id);
                    setActiveStepId(null);
                  }}
                  onEndChange={(id) => {
                    setEndId(id);
                    setActiveStepId(null);
                  }}
                  onSwap={handleSwap}
                  onStartFromMainGate={handleStartFromMainGate}
                  accessibleOnly={accessibleOnly}
                  onToggleAccessible={() => setAccessibleOnly((v) => !v)}
                  route={route}
                  activeStepId={activeStepId}
                  onSelectStep={(step) => {
                    handleSelectStep(step);
                    setIsMobileSheetOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
