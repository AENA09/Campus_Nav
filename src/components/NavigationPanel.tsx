import React, { useMemo } from 'react';
import {
  Accessibility,
  ArrowUp,
  ArrowUpDown,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  Footprints,
  MapPin,
  Navigation,
  Route as RouteIcon,
} from 'lucide-react';
import {
  CAMPUS_LOCATIONS,
  type LocationCategory,
} from '../data/campusData';
import type { RouteResult, RouteStep, TurnType } from '../utils/pathfinding';

interface NavigationPanelProps {
  startId: string;
  endId: string;
  onStartChange: (id: string) => void;
  onEndChange: (id: string) => void;
  onSwap: () => void;
  onStartFromMainGate: () => void;
  accessibleOnly: boolean;
  onToggleAccessible: () => void;
  route: RouteResult | null;
  activeStepId: string | null;
  onSelectStep: (step: RouteStep) => void;
}

const CATEGORY_ORDER: LocationCategory[] = [
  'Academics',
  'Food',
  'Sports',
  'Hostels',
  'Utilities',
];

function TurnIcon({ type }: { type: TurnType }) {
  switch (type) {
    case 'start':
      return <Navigation className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />;
    case 'arrive':
      return <Flag className="w-3.5 h-3.5 text-red-800 dark:text-red-400" />;
    case 'left':
    case 'slight-left':
      return <CornerUpLeft className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />;
    case 'right':
    case 'slight-right':
      return <CornerUpRight className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />;
    default:
      return <ArrowUp className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />;
  }
}

export const NavigationPanel: React.FC<NavigationPanelProps> = ({
  startId,
  endId,
  onStartChange,
  onEndChange,
  onSwap,
  onStartFromMainGate,
  accessibleOnly,
  onToggleAccessible,
  route,
  activeStepId,
  onSelectStep,
}) => {
  const groupedLocations = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: CAMPUS_LOCATIONS.filter((l) => l.category === category),
    })).filter((g) => g.items.length > 0);
  }, []);

  const isSameNode = startId === endId;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Route Selector Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Campus Route Planner
          </h2>
          <button
            type="button"
            onClick={onStartFromMainGate}
            disabled={startId === 'main-gate'}
            className="text-xs font-medium text-red-800 dark:text-red-400 hover:underline disabled:opacity-45 disabled:no-underline cursor-pointer disabled:cursor-default whitespace-nowrap shrink-0"
          >
            Start from Main Gate
          </button>
        </div>

        {/* Start & Destination Inputs with Swap */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1 space-y-2.5 min-w-0">
            {/* Start Location */}
            <div>
              <label
                htmlFor="campus-start-select"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-700 text-[10px] font-mono font-bold text-white">
                  A
                </span>
                Starting Point
              </label>
              <select
                id="campus-start-select"
                value={startId}
                onChange={(e) => onStartChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-red-800 dark:focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-800/15 transition-colors cursor-pointer"
              >
                {groupedLocations.map((group) => (
                  <optgroup key={group.category} label={group.category}>
                    {group.items.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.shortName} — {loc.code}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Destination Location */}
            <div>
              <label
                htmlFor="campus-dest-select"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-800 dark:bg-red-600 text-[10px] font-mono font-bold text-white">
                  B
                </span>
                Destination
              </label>
              <select
                id="campus-dest-select"
                value={endId}
                onChange={(e) => onEndChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 text-sm text-slate-900 dark:text-slate-100 focus:border-red-800 dark:focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-800/15 transition-colors cursor-pointer"
              >
                {groupedLocations.map((group) => (
                  <optgroup key={group.category} label={group.category}>
                    {group.items.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.shortName} — {loc.code}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={onSwap}
            className="mt-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-red-800/40 hover:text-red-800 dark:hover:text-red-400 transition-colors cursor-pointer"
            aria-label="Swap start and destination"
            title="Swap start and destination"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Wheelchair Accessible Toggle */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <Accessibility
              className={`w-4 h-4 shrink-0 ${
                accessibleOnly
                  ? 'text-teal-700 dark:text-teal-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                Wheelchair Accessible
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Avoids outdoor stairs &amp; stepped terraces
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={accessibleOnly}
            aria-label="Toggle wheelchair accessible step-free routes"
            onClick={onToggleAccessible}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800 ${
              accessibleOnly
                ? 'bg-teal-700 dark:bg-teal-600'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                accessibleOnly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Route Summary Metrics Bar */}
      {route && route.found && (
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800">
            <div className="pr-3">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Distance
              </p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                {route.totalDistanceMeters}
                <span className="ml-0.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                  m
                </span>
              </p>
            </div>

            <div className="px-3">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Walk Time
              </p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-red-800 dark:text-red-400">
                {isSameNode
                  ? '0'
                  : route.exactWalkingMinutes < 1
                    ? '< 1'
                    : route.walkingTimeMinutes}
                <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                  min
                </span>
              </p>
            </div>

            <div className="pl-3">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Pathway
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {isSameNode
                  ? 'Same Spot'
                  : route.includesStairs
                    ? 'Has Stairs'
                    : 'Step-Free'}
              </p>
            </div>
          </div>

          {/* Contextual accessible routing note */}
          {accessibleOnly && !isSameNode && (
            <p className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs text-teal-800 dark:text-teal-400">
              {route.usedAccessibleDetour
                ? `Accessible ramp detour active (+${route.detourDeltaMeters}m to bypass stairs).`
                : 'Shortest path is already 100% step-free and wheelchair accessible.'}
            </p>
          )}
          {!accessibleOnly && route.includesStairs && (
            <p className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs text-amber-800 dark:text-amber-400">
              Includes outdoor stairs. Enable Wheelchair Accessible mode for a paved ramp route.
            </p>
          )}
        </div>
      )}

      {/* Turn-by-Turn Directions List */}
      <div className="flex-1 overflow-y-auto campus-scroll px-4 sm:px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-red-800 dark:text-red-400" />
            Turn-by-Turn Directions
          </h3>
          {route && route.found && !isSameNode && (
            <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
              80 m/min pace
            </span>
          )}
        </div>

        {!route || !route.found ? (
          <div className="py-10 text-center">
            <RouteIcon className="w-7 h-7 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No route available
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Choose a starting point and destination on the Medi-Caps campus map.
            </p>
          </div>
        ) : (
          <ol className="space-y-1">
            {route.steps.map((step, idx) => {
              const isSelected = activeStepId === step.id;
              const isLast = idx === route.steps.length - 1;
              return (
                <li key={step.id} className="relative">
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200 dark:bg-slate-800"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectStep(step)}
                    className={`w-full text-left flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/90 dark:bg-red-950/35'
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        step.turnType === 'start'
                          ? 'border-teal-700/30 bg-teal-50 dark:bg-teal-950/50'
                          : step.turnType === 'arrive'
                            ? 'border-red-800/30 bg-red-50 dark:bg-red-950/50'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <TurnIcon type={step.turnType} />
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500 mr-1.5 tabular-nums">
                          {step.stepNumber}.
                        </span>
                        {step.instruction}
                      </p>
                      <div className="mt-1 flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{step.detail}</span>
                        {step.distanceMeters > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
                              {step.distanceMeters} m
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <MapPin
                      className={`w-3.5 h-3.5 mt-1 shrink-0 transition-opacity ${
                        isSelected
                          ? 'opacity-100 text-red-800 dark:text-red-400'
                          : 'opacity-0 group-hover:opacity-60 text-slate-400'
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};
