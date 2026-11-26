import React from 'react';
import {
  Accessibility,
  Building2,
  Clock,
  Navigation,
  X,
} from 'lucide-react';
import { CATEGORY_COLORS, type CampusLocation } from '../data/campusData';

interface LocationDrawerProps {
  location: CampusLocation | null;
  onClose: () => void;
  onNavigateHere: (locationId: string) => void;
  onSetAsStart: (locationId: string) => void;
  isCurrentStart: boolean;
  isCurrentEnd: boolean;
}

export const LocationDrawer: React.FC<LocationDrawerProps> = ({
  location,
  onClose,
  onNavigateHere,
  onSetAsStart,
  isCurrentStart,
  isCurrentEnd,
}) => {
  if (!location) return null;

  const catStyle = CATEGORY_COLORS[location.category];

  return (
    <aside
      aria-label={`${location.name} details`}
      className="fixed lg:absolute top-14 lg:top-0 right-0 bottom-0 z-40 w-full sm:w-[370px] flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              {location.code}
            </span>
            <span aria-hidden="true">·</span>
            <span className={`font-medium ${catStyle.badgeText}`}>
              {location.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>{location.wheelchairAccessible ? 'Step-Free' : 'Stairs'}</span>
          </div>
          <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            {location.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close location details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Building Info Body */}
      <div className="flex-1 overflow-y-auto campus-scroll px-5 py-5 space-y-6">
        {/* Overview */}
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {location.summary}
        </p>

        {/* Timings & Accessibility */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Operating Hours
              </p>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                {location.timings}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Accessibility className="w-4 h-4 mt-0.5 shrink-0 text-teal-700 dark:text-teal-400" />
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Accessibility
              </p>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                {location.accessibilityNote}
              </p>
            </div>
          </div>
        </div>

        {/* Departments & Key Facilities */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-3">
            <Building2 className="w-3.5 h-3.5 text-red-800 dark:text-red-400" />
            Departments &amp; Facilities
          </h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {location.departments.map((dept) => (
              <li
                key={dept}
                className="py-2 text-sm text-slate-700 dark:text-slate-300"
              >
                {dept}
              </li>
            ))}
          </ul>
        </div>

        {/* Floor Directory */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Floor Directory
          </h3>
          <dl className="space-y-3">
            {location.floors.map((floor) => (
              <div
                key={floor.level}
                className="pb-3 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 last:pb-0"
              >
                <dt className="font-mono text-xs font-semibold text-red-800 dark:text-red-400">
                  {floor.level}
                </dt>
                <dd className="mt-0.5 text-sm text-slate-600 dark:text-slate-300 leading-snug">
                  {floor.details}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onNavigateHere(location.id)}
          className="flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-red-800 hover:bg-red-900 dark:bg-red-700 dark:hover:bg-red-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          <Navigation className="w-4 h-4" />
          {isCurrentEnd ? 'Active Destination' : 'Navigate Here'}
        </button>

        <button
          type="button"
          onClick={() => onSetAsStart(location.id)}
          className="h-10 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {isCurrentStart ? 'Start Point' : 'Set Start'}
        </button>
      </div>
    </aside>
  );
};
