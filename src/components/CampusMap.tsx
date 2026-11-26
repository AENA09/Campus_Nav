import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  Crosshair,
  Layers,
  Minus,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  ALL_NODES_MAP,
  CAMPUS_EDGES,
  CAMPUS_LOCATIONS,
  CATEGORIES,
  CATEGORY_COLORS,
  type CampusLocation,
  type LocationCategory,
} from '../data/campusData';
import type { RouteResult } from '../utils/pathfinding';

interface CampusMapProps {
  route: RouteResult | null;
  startId: string;
  endId: string;
  selectedLocationId: string | null;
  activeCategory: 'All' | LocationCategory;
  onCategoryChange: (category: 'All' | LocationCategory) => void;
  searchMatchedIds: Set<string> | null;
  accessibleOnly: boolean;
  focusedPoint: { x: number; y: number } | null;
  onSelectLocation: (location: CampusLocation) => void;
  isDark: boolean;
}

const VIEWBOX_W = 1000;
const VIEWBOX_H = 700;
const MIN_ZOOM = 0.85;
const MAX_ZOOM = 3.2;

/**
 * Custom label offsets (dx, dy) carefully tuned so zero building labels collide on the 1000x700 map.
 */
const LABEL_OFFSETS: Record<string, { dx: number; dy: number; anchor?: 'start' | 'middle' | 'end' }> = {
  'main-gate': { dx: 0, dy: 24, anchor: 'middle' },
  'parking-area': { dx: 0, dy: 24, anchor: 'middle' },
  'medical-room': { dx: -8, dy: -16, anchor: 'end' },
  'admin-block': { dx: 0, dy: 25, anchor: 'middle' },
  auditorium: { dx: -14, dy: -15, anchor: 'end' },
  'a-block': { dx: 0, dy: -17, anchor: 'middle' },
  'b-block': { dx: 14, dy: 4, anchor: 'start' },
  'c-block': { dx: 0, dy: 24, anchor: 'middle' },
  'central-library': { dx: 0, dy: -18, anchor: 'middle' },
  canteen: { dx: -12, dy: -14, anchor: 'end' },
  'm-block': { dx: 0, dy: -18, anchor: 'middle' },
  'v-block': { dx: 16, dy: -14, anchor: 'start' },
  'sports-complex': { dx: 0, dy: 24, anchor: 'middle' },
  's-block': { dx: 0, dy: 24, anchor: 'middle' },
  'boys-hostel': { dx: 0, dy: -22, anchor: 'middle' },
  'girls-hostel': { dx: 0, dy: -20, anchor: 'middle' },
};

export const CampusMap: React.FC<CampusMapProps> = ({
  route,
  startId,
  endId,
  selectedLocationId,
  activeCategory,
  onCategoryChange,
  searchMatchedIds,
  accessibleOnly,
  focusedPoint,
  onSelectLocation,
  isDark,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1.06);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [referenceTab, setReferenceTab] = useState<'satellite' | 'blueprint'>('satellite');

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(z.toFixed(2))));

  const handleResetView = useCallback(() => {
    setZoom(1.06);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleFitRoute = useCallback(() => {
    if (!route || !route.found || route.nodeIds.length === 0) {
      handleResetView();
      return;
    }
    const pts = route.nodeIds.map((id) => ALL_NODES_MAP[id]).filter(Boolean);
    if (pts.length === 0) return;

    const minX = Math.min(...pts.map((p) => p.x));
    const maxX = Math.max(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxY = Math.max(...pts.map((p) => p.y));

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const spanX = Math.max(220, maxX - minX + 180);
    const spanY = Math.max(180, maxY - minY + 160);

    const targetZoom = clampZoom(Math.min(VIEWBOX_W / spanX, VIEWBOX_H / spanY, 2.0));
    const container = containerRef.current;
    if (!container) {
      setZoom(targetZoom);
      return;
    }

    const rect = container.getBoundingClientRect();
    const scaleX = rect.width / VIEWBOX_W;
    const scaleY = rect.height / VIEWBOX_H;
    const baseScale = Math.min(scaleX, scaleY);

    const offsetX = (VIEWBOX_W / 2 - cx) * baseScale * targetZoom;
    const offsetY = (VIEWBOX_H / 2 - cy) * baseScale * targetZoom;

    setZoom(targetZoom);
    setPan({ x: offsetX, y: offsetY });
  }, [route, handleResetView]);

  // Center on a specific point when a user clicks a step or picks a search match
  useEffect(() => {
    if (!focusedPoint || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const baseScale = Math.min(rect.width / VIEWBOX_W, rect.height / VIEWBOX_H);
    const targetZoom = Math.max(zoom, 1.5);
    const offsetX = (VIEWBOX_W / 2 - focusedPoint.x) * baseScale * targetZoom;
    const offsetY = (VIEWBOX_H / 2 - focusedPoint.y) * baseScale * targetZoom;
    setZoom(clampZoom(targetZoom));
    setPan({ x: offsetX, y: offsetY });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedPoint]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.14 : -0.14;
    setZoom((prev) => clampZoom(prev + delta));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('[data-map-interactive="true"]')) {
        return;
      }
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [pan]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: Math.max(-520, Math.min(520, dragStartRef.current.panX + dx)),
      y: Math.max(-380, Math.min(380, dragStartRef.current.panY + dy)),
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current) {
      dragStartRef.current = null;
      setIsDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  }, []);

  // Determine which buildings are highlighted or dimmed based on search & category
  const locationStates = useMemo(() => {
    const map: Record<string, { matches: boolean; isEndpoint: boolean }> = {};
    for (const loc of CAMPUS_LOCATIONS) {
      const catMatch = activeCategory === 'All' || loc.category === activeCategory;
      const searchMatch = searchMatchedIds === null || searchMatchedIds.has(loc.id);
      const isEndpoint = loc.id === startId || loc.id === endId;
      map[loc.id] = {
        matches: catMatch && searchMatch,
        isEndpoint,
      };
    }
    return map;
  }, [activeCategory, searchMatchedIds, startId, endId]);

  const startNode = ALL_NODES_MAP[startId];
  const endNode = ALL_NODES_MAP[endId];

  // Theme-adaptive cartographic palette
  const palette = useMemo(
    () =>
      isDark
        ? {
            canvasBg: '#0B1220',
            campusGround: '#111B2E',
            campusBorder: '#334155',
            abRoad: '#1E293B',
            abRoadStripe: '#F59E0B',
            grass: '#132A23',
            grassStroke: '#1E4638',
            courtFill: '#1B2D45',
            courtStroke: '#38BDF8',
            walkway: '#29384D',
            walkwayCore: '#1E293B',
            stairs: '#D97706',
            buildingFill: '#1E293B',
            buildingFillHover: '#28364C',
            buildingStroke: '#475569',
            buildingRoofDetail: '#2D3C53',
            labelBg: '#0F172A',
            labelText: '#F1F5F9',
            labelBorder: '#334155',
            routeColor: '#EF4444',
            routeGlow: 'rgba(239, 68, 68, 0.28)',
            gridDot: '#1E293B',
          }
        : {
            canvasBg: '#EDF2F7',
            campusGround: '#F8FAFC',
            campusBorder: '#CBD5E1',
            abRoad: '#E2E8F0',
            abRoadStripe: '#D97706',
            grass: '#DCFCE7',
            grassStroke: '#86EFAC',
            courtFill: '#DBEAFE',
            courtStroke: '#60A5FA',
            walkway: '#CBD5E1',
            walkwayCore: '#FFFFFF',
            stairs: '#B45309',
            buildingFill: '#FFFFFF',
            buildingFillHover: '#FEF2F2',
            buildingStroke: '#94A3B8',
            buildingRoofDetail: '#E2E8F0',
            labelBg: '#FFFFFF',
            labelText: '#0F172A',
            labelBorder: '#CBD5E1',
            routeColor: '#991B1B',
            routeGlow: 'rgba(153, 27, 27, 0.22)',
            gridDot: '#CBD5E1',
          },
    [isDark]
  );

  const hoveredLoc = hoveredId
    ? CAMPUS_LOCATIONS.find((l) => l.id === hoveredId) ?? null
    : null;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative h-full w-full overflow-hidden select-none touch-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ backgroundColor: palette.canvasBg }}
      aria-label="Interactive Medi-Caps University Campus Map"
    >
      {/* Top-Left Category Filter Bar */}
      <div
        data-map-interactive="true"
        className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex items-center gap-1 overflow-x-auto max-w-full rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 p-1 shadow-sm backdrop-blur-sm"
        role="tablist"
        aria-label="Filter campus locations by category"
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(category)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-700 ${
                isActive
                  ? 'bg-red-800 text-white dark:bg-red-700'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Top-Right Reference Map Trigger */}
      <div
        data-map-interactive="true"
        className="hidden sm:flex absolute top-3 right-3 z-20 items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setShowReferenceModal((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm backdrop-blur-sm ${
            showReferenceModal
              ? 'bg-red-800 text-white border-red-800 dark:bg-red-700 dark:border-red-700'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="View real campus satellite & convocation reference maps"
        >
          <Layers className="w-3.5 h-3.5" />
          Campus Reference
        </button>
      </div>

      {/* Floating Campus Reference Preview Card */}
      {showReferenceModal && (
        <div
          data-map-interactive="true"
          className="absolute top-14 right-3 z-30 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setReferenceTab('satellite')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  referenceTab === 'satellite'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Satellite View
              </button>
              <button
                type="button"
                onClick={() => setReferenceTab('blueprint')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  referenceTab === 'blueprint'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Campus Blueprint
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowReferenceModal(false)}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md cursor-pointer"
              aria-label="Close reference map"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950">
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-900">
              {referenceTab === 'satellite' ? (
                <img
                  src="/assets/aistudio/Screenshot_2026-11-27_010427_3edc1360.png"
                  alt="Medi-Caps University Indore aerial satellite reference"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src="/assets/aistudio/map_medi_7483a7f9.jpeg"
                  alt="Medi-Caps University Indore campus layout blueprint"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain bg-white"
                />
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Medi-Caps University, Pigdamber, Rau, Indore (AB Road / NH-52)
            </p>
          </div>
        </div>
      )}

      {/* Interactive SVG Campus Map Canvas */}
      <div
        className="h-full w-full flex items-center justify-center transition-transform duration-150 ease-out"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transitionDuration: isDragging ? '0ms' : '180ms',
        }}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          className="w-full h-full max-w-[1180px] max-h-[820px]"
          role="img"
          aria-label="Medi-Caps University, Indore interactive map"
        >
          <defs>
            <pattern id="campus-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill={palette.gridDot} opacity="0.55" />
            </pattern>
            <pattern id="grass-stripes" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
              <rect width="12" height="12" fill={palette.grass} />
              <line x1="0" y1="0" x2="0" y2="12" stroke={palette.grassStroke} strokeWidth="1.5" opacity="0.35" />
            </pattern>
            <filter id="pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#0F172A" floodOpacity="0.28" />
            </filter>
          </defs>

          {/* Architectural background grid */}
          <rect x="0" y="0" width={VIEWBOX_W} height={VIEWBOX_H} fill="url(#campus-dot-grid)" />

          {/* AB Road (NH-52 Agra-Bombay Highway) along the Western Edge */}
          <g aria-label="AB Road Highway">
            <path
              d="M 28 700 L 235 0 L 292 0 L 85 700 Z"
              fill={palette.abRoad}
              stroke={palette.campusBorder}
              strokeWidth="1.5"
            />
            <line
              x1="57"
              y1="700"
              x2="264"
              y2="0"
              stroke={palette.abRoadStripe}
              strokeWidth="2"
              strokeDasharray="12 10"
              opacity="0.7"
            />
            <text
              x="130"
              y="320"
              transform="rotate(-73.5 130 320)"
              fill={isDark ? '#94A3B8' : '#64748B'}
              fontSize="13"
              fontWeight="700"
              letterSpacing="2.4"
              textAnchor="middle"
            >
              AB ROAD · NH-52 (TO INDORE / RAU)
            </text>
            {/* Approach road from AB Road into Main Gate */}
            <path
              d="M 102 644 L 348 644 L 348 618"
              fill="none"
              stroke={palette.abRoad}
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 102 644 L 348 644"
              fill="none"
              stroke={palette.abRoadStripe}
              strokeWidth="1.5"
              strokeDasharray="8 8"
              opacity="0.65"
            />
          </g>

          {/* Medi-Caps University Campus Perimeter Boundary */}
          <polygon
            points="162,606 184,358 308,210 475,58 790,56 908,224 912,596 742,658 552,638 418,622 332,622"
            fill={palette.campusGround}
            stroke={palette.campusBorder}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Landscaped Grounds, Cricket Pitch, Courts & Central Quadrangle */}
          <g>
            {/* Cricket & Football Playground (West, matching satellite & blueprint) */}
            <path
              d="M 176 544 L 194 356 L 288 342 L 306 518 Z"
              fill="url(#grass-stripes)"
              stroke={palette.grassStroke}
              strokeWidth="1.5"
            />
            <ellipse
              cx="239"
              cy="446"
              rx="42"
              ry="68"
              fill="none"
              stroke={isDark ? '#4ADE80' : '#16A34A'}
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.65"
            />
            <rect
              x="234"
              y="428"
              width="10"
              height="36"
              rx="2"
              fill={isDark ? '#854D0E' : '#FDE68A'}
              opacity="0.7"
            />
            <text
              x="239"
              y="495"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="600"
              fill={isDark ? '#86EFAC' : '#166534'}
            >
              CRICKET &amp; FOOTBALL GROUND
            </text>

            {/* Basketball & Volleyball Courts */}
            <g transform="translate(296, 338)">
              <rect
                x="0"
                y="0"
                width="34"
                height="58"
                rx="3"
                fill={palette.courtFill}
                stroke={palette.courtStroke}
                strokeWidth="1.2"
              />
              <line x1="0" y1="29" x2="34" y2="29" stroke={palette.courtStroke} strokeWidth="0.9" />
              <circle cx="17" cy="29" r="6" fill="none" stroke={palette.courtStroke} strokeWidth="0.9" />

              <rect
                x="40"
                y="0"
                width="30"
                height="58"
                rx="3"
                fill={palette.courtFill}
                stroke={palette.courtStroke}
                strokeWidth="1.2"
              />
              <line x1="40" y1="29" x2="70" y2="29" stroke={palette.courtStroke} strokeWidth="0.9" />
            </g>

            {/* North Lawn & Central Garden beside Canteen */}
            <path
              d="M 454 114 Q 520 74 584 106 L 584 152 L 454 152 Z"
              fill="url(#grass-stripes)"
              stroke={palette.grassStroke}
              strokeWidth="1.2"
            />
            <rect
              x="382"
              y="324"
              width="58"
              height="68"
              rx="8"
              fill="url(#grass-stripes)"
              stroke={palette.grassStroke}
              strokeWidth="1.2"
            />

            {/* Central Quadrangle Lawn (between Library & Boys Hostel) */}
            <rect
              x="644"
              y="314"
              width="104"
              height="126"
              rx="8"
              fill="url(#grass-stripes)"
              stroke={palette.grassStroke}
              strokeWidth="1.5"
            />
            <rect
              x="656"
              y="326"
              width="80"
              height="102"
              rx="5"
              fill="none"
              stroke={isDark ? '#4ADE80' : '#16A34A'}
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity="0.55"
            />
            <text
              x="696"
              y="381"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="600"
              fill={isDark ? '#86EFAC' : '#166534'}
            >
              CENTRAL QUAD
            </text>
          </g>

          {/* Walkway Graph Network Layer */}
          <g aria-label="Campus Walkways">
            {CAMPUS_EDGES.map((edge) => {
              const a = ALL_NODES_MAP[edge.from];
              const b = ALL_NODES_MAP[edge.to];
              if (!a || !b) return null;

              const isStairs = Boolean(edge.hasStairs);
              const disabledStairs = isStairs && accessibleOnly;

              return (
                <g key={edge.id}>
                  {/* Road casing */}
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={isStairs ? palette.stairs : palette.walkway}
                    strokeWidth={isStairs ? 4 : 8.5}
                    strokeLinecap="round"
                    strokeDasharray={isStairs ? '4 4' : undefined}
                    opacity={disabledStairs ? 0.25 : isStairs ? 0.72 : 0.9}
                  />
                  {/* Paved road inner surface */}
                  {!isStairs && (
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={palette.walkwayCore}
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      opacity="0.88"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Architectural Building Footprints (Clickable) */}
          <g aria-label="Campus Buildings">
            {/* Central Parking Bays */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'parking-area')!)}
              onMouseEnter={() => setHoveredId('parking-area')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="182"
                y="554"
                width="102"
                height="48"
                rx="6"
                fill={selectedLocationId === 'parking-area' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'parking-area' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'parking-area' ? 2.2 : 1.4}
              />
              <line x1="196" y1="564" x2="196" y2="592" stroke={palette.buildingStroke} strokeWidth="1" opacity="0.6" />
              <line x1="214" y1="564" x2="214" y2="592" stroke={palette.buildingStroke} strokeWidth="1" opacity="0.6" />
              <line x1="232" y1="564" x2="232" y2="592" stroke={palette.buildingStroke} strokeWidth="1" opacity="0.6" />
              <line x1="250" y1="564" x2="250" y2="592" stroke={palette.buildingStroke} strokeWidth="1" opacity="0.6" />
              <line x1="268" y1="564" x2="268" y2="592" stroke={palette.buildingStroke} strokeWidth="1" opacity="0.6" />
            </g>

            {/* Main Gate Security Checkpost Arch */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'main-gate')!)}
              onMouseEnter={() => setHoveredId('main-gate')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="318"
                y="608"
                width="54"
                height="20"
                rx="4"
                fill={selectedLocationId === 'main-gate' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'main-gate' ? palette.routeColor : palette.buildingStroke}
                strokeWidth="1.8"
              />
            </g>

            {/* Medical & First-Aid Room */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'medical-room')!)}
              onMouseEnter={() => setHoveredId('medical-room')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="384"
                y="518"
                width="42"
                height="34"
                rx="5"
                fill={selectedLocationId === 'medical-room' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'medical-room' ? palette.routeColor : palette.buildingStroke}
                strokeWidth="1.5"
              />
            </g>

            {/* Admin Block (L-shaped main entrance building) */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'admin-block')!)}
              onMouseEnter={() => setHoveredId('admin-block')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <path
                d="M 438 528 L 534 528 L 534 574 L 494 574 L 494 596 L 438 596 Z"
                fill={selectedLocationId === 'admin-block' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'admin-block' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'admin-block' ? 2.2 : 1.6}
                strokeLinejoin="round"
              />
              <rect x="448" y="538" width="76" height="16" rx="2" fill={palette.buildingRoofDetail} />
            </g>

            {/* Main Auditorium & Seminar Complex */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'auditorium')!)}
              onMouseEnter={() => setHoveredId('auditorium')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <path
                d="M 426 444 L 498 444 L 506 492 L 418 492 Z"
                fill={selectedLocationId === 'auditorium' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'auditorium' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'auditorium' ? 2.2 : 1.6}
                strokeLinejoin="round"
              />
              <path d="M 436 456 L 488 456" stroke={palette.buildingRoofDetail} strokeWidth="5" strokeLinecap="round" />
            </g>

            {/* Central Canteen & Nescafé Food Court */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'canteen')!)}
              onMouseEnter={() => setHoveredId('canteen')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="452"
                y="310"
                width="54"
                height="44"
                rx="7"
                fill={selectedLocationId === 'canteen' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'canteen' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'canteen' ? 2.2 : 1.6}
              />
              <rect x="460" y="318" width="38" height="10" rx="2" fill={palette.buildingRoofDetail} />
            </g>

            {/* Central Library & E-Resource Center (Q-Block / New Building spine) */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'central-library')!)}
              onMouseEnter={() => setHoveredId('central-library')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="544"
                y="328"
                width="58"
                height="104"
                rx="7"
                fill={selectedLocationId === 'central-library' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'central-library' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'central-library' ? 2.2 : 1.6}
              />
              <rect x="554" y="340" width="38" height="78" rx="3" fill={palette.buildingRoofDetail} />
            </g>

            {/* A-Block (First Year & Basic Sciences) */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'a-block')!)}
              onMouseEnter={() => setHoveredId('a-block')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="634"
                y="514"
                width="68"
                height="48"
                rx="6"
                fill={selectedLocationId === 'a-block' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'a-block' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'a-block' ? 2.2 : 1.6}
              />
              <rect x="644" y="524" width="48" height="28" rx="3" fill={palette.buildingRoofDetail} />
            </g>

            {/* B-Block (CSE & IT Labs) */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'b-block')!)}
              onMouseEnter={() => setHoveredId('b-block')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="764"
                y="516"
                width="60"
                height="86"
                rx="7"
                fill={selectedLocationId === 'b-block' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'b-block' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'b-block' ? 2.2 : 1.6}
              />
              <rect x="774" y="528" width="40" height="62" rx="3" fill={palette.buildingRoofDetail} />
            </g>

            {/* C-Block (ECE, EE & Mechanical) */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'c-block')!)}
              onMouseEnter={() => setHoveredId('c-block')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="676"
                y="594"
                width="84"
                height="44"
                rx="6"
                fill={selectedLocationId === 'c-block' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'c-block' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'c-block' ? 2.2 : 1.6}
              />
              <rect x="688" y="604" width="60" height="24" rx="3" fill={palette.buildingRoofDetail} />
            </g>

            {/* M-Block (Management & Commerce — courtyard architecture) */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'm-block')!)}
              onMouseEnter={() => setHoveredId('m-block')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="546"
                y="178"
                width="84"
                height="68"
                rx="8"
                fill={selectedLocationId === 'm-block' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'm-block' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'm-block' ? 2.2 : 1.6}
              />
              <rect x="572" y="198" width="32" height="28" rx="4" fill={palette.grass} stroke={palette.grassStroke} strokeWidth="1" />
            </g>

            {/* V-Block (Iconic triple-drum circular Pharmacy & Forensic Science complex) */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'v-block')!)}
              onMouseEnter={() => setHoveredId('v-block')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <circle
                cx="756"
                cy="112"
                r="30"
                fill={selectedLocationId === 'v-block' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'v-block' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'v-block' ? 2.2 : 1.6}
              />
              <circle
                cx="742"
                cy="160"
                r="32"
                fill={selectedLocationId === 'v-block' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'v-block' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'v-block' ? 2.2 : 1.6}
              />
              <circle
                cx="774"
                cy="202"
                r="26"
                fill={selectedLocationId === 'v-block' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'v-block' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'v-block' ? 2.2 : 1.6}
              />
              <circle cx="756" cy="112" r="10" fill={palette.campusGround} stroke={palette.buildingStroke} strokeWidth="1" />
              <circle cx="742" cy="160" r="11" fill={palette.campusGround} stroke={palette.buildingStroke} strokeWidth="1" />
              <circle cx="774" cy="202" r="8" fill={palette.campusGround} stroke={palette.buildingStroke} strokeWidth="1" />
            </g>

            {/* S-Block (Eastern wing) */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 's-block')!)}
              onMouseEnter={() => setHoveredId('s-block')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="814"
                y="314"
                width="74"
                height="116"
                rx="8"
                fill={selectedLocationId === 's-block' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 's-block' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 's-block' ? 2.2 : 1.6}
              />
              <rect x="826" y="328" width="50" height="88" rx="4" fill={palette.buildingRoofDetail} />
            </g>

            {/* Boys Hostel (Near Central Canteen) */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'boys-hostel')!)}
              onMouseEnter={() => setHoveredId('boys-hostel')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="378"
                y="242"
                width="76"
                height="48"
                rx="8"
                fill={selectedLocationId === 'boys-hostel' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'boys-hostel' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'boys-hostel' ? 2.2 : 1.6}
              />
              <rect x="388" y="252" width="56" height="28" rx="3" fill={palette.buildingRoofDetail} />
            </g>

            {/* Girls Hostel (Between V-Block and S-Block) */}
            <g
              data-map-interactive="true"
              onClick={() => onSelectLocation(CAMPUS_LOCATIONS.find((l) => l.id === 'girls-hostel')!)}
              onMouseEnter={() => setHoveredId('girls-hostel')}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x="806"
                y="236"
                width="76"
                height="54"
                rx="8"
                fill={selectedLocationId === 'girls-hostel' ? palette.buildingFillHover : palette.buildingFill}
                stroke={selectedLocationId === 'girls-hostel' ? palette.routeColor : palette.buildingStroke}
                strokeWidth={selectedLocationId === 'girls-hostel' ? 2.2 : 1.6}
              />
              <rect x="816" y="246" width="56" height="34" rx="3" fill={palette.buildingRoofDetail} />
            </g>
          </g>

          {/* Animated Shortest-Path Route Overlay */}
          {route && route.found && route.svgPathD && (
            <g aria-label="Active Walking Route">
              {/* Soft outer route halo */}
              <path
                d={route.svgPathD}
                fill="none"
                stroke={palette.routeGlow}
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Solid crisp base stroke */}
              <path
                d={route.svgPathD}
                fill="none"
                stroke={isDark ? '#1E293B' : '#FFFFFF'}
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Animated crimson marching dashed path */}
              <path
                d={route.svgPathD}
                fill="none"
                stroke={palette.routeColor}
                strokeWidth="4.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="route-path-animated"
              />
              {/* Intermediate route junction dots */}
              {route.nodeIds.slice(1, -1).map((nodeId) => {
                const n = ALL_NODES_MAP[nodeId];
                if (!n || n.isLandmark) return null;
                return (
                  <circle
                    key={nodeId}
                    cx={n.x}
                    cy={n.y}
                    r="3.2"
                    fill="#FFFFFF"
                    stroke={palette.routeColor}
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}

          {/* Focused Step Highlight Ring */}
          {focusedPoint && (
            <g pointerEvents="none">
              <circle
                cx={focusedPoint.x}
                cy={focusedPoint.y}
                r="16"
                fill={palette.routeGlow}
                stroke={palette.routeColor}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* Clickable Campus Landmark Pins */}
          <g aria-label="Campus Landmark Pins">
            {CAMPUS_LOCATIONS.map((loc) => {
              const state = locationStates[loc.id];
              const isStart = loc.id === startId;
              const isEnd = loc.id === endId;
              const isSelected = loc.id === selectedLocationId;
              const isHovered = loc.id === hoveredId;
              const isSearchHit = searchMatchedIds !== null && searchMatchedIds.has(loc.id);
              const dimmed = !state.matches && !isStart && !isEnd && !isSelected;

              const catColor = CATEGORY_COLORS[loc.category];
              const offset = LABEL_OFFSETS[loc.id] ?? { dx: 0, dy: 22, anchor: 'middle' };

              return (
                <g
                  key={loc.id}
                  data-map-interactive="true"
                  onClick={() => onSelectLocation(loc)}
                  onMouseEnter={() => setHoveredId(loc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer transition-opacity duration-150"
                  opacity={dimmed ? 0.28 : 1}
                  role="button"
                  tabIndex={0}
                  aria-label={`${loc.name} (${loc.category})`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectLocation(loc);
                    }
                  }}
                >
                  {/* Selection or search highlight ring */}
                  {(isSelected || isSearchHit || isHovered) && (
                    <circle
                      cx={loc.x}
                      cy={loc.y}
                      r={isEnd ? 18 : 14}
                      fill={isSearchHit ? 'rgba(153, 27, 27, 0.16)' : 'rgba(15, 23, 42, 0.10)'}
                      stroke={isSearchHit || isSelected ? palette.routeColor : catColor.fill}
                      strokeWidth="1.6"
                    />
                  )}

                  {/* Start Marker (Origin A), Destination Pin (Teardrop B), or Standard Landmark Dot */}
                  {isEnd && startId !== endId ? (
                    <g transform={`translate(${loc.x}, ${loc.y})`} filter="url(#pin-shadow)">
                      <path
                        d="M 0 0 C -8 -10 -12 -16 -12 -22 A 12 12 0 1 1 12 -22 C 12 -16 8 -10 0 0 Z"
                        fill={palette.routeColor}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <text
                        x="0"
                        y="-18"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="800"
                        fontFamily="var(--font-mono)"
                      >
                        B
                      </text>
                    </g>
                  ) : isStart ? (
                    <g transform={`translate(${loc.x}, ${loc.y})`} filter="url(#pin-shadow)">
                      <circle cx="0" cy="0" r="10.5" fill="#0F766E" stroke="#FFFFFF" strokeWidth="2.4" />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="9.5"
                        fontWeight="800"
                        fontFamily="var(--font-mono)"
                      >
                        A
                      </text>
                    </g>
                  ) : (
                    <g transform={`translate(${loc.x}, ${loc.y})`} filter="url(#pin-shadow)">
                      <circle
                        cx="0"
                        cy="0"
                        r={isSelected || isHovered ? 8.5 : 7}
                        fill={catColor.fill}
                        stroke="#FFFFFF"
                        strokeWidth="2.2"
                      />
                      <circle cx="0" cy="0" r="2.2" fill="#FFFFFF" />
                    </g>
                  )}

                  {/* Crisp Label */}
                  <g
                    transform={`translate(${loc.x + offset.dx}, ${loc.y + offset.dy})`}
                    pointerEvents="none"
                  >
                    <text
                      x="0"
                      y="0"
                      textAnchor={offset.anchor ?? 'middle'}
                      fontSize={isStart || isEnd || isSelected ? '11' : '10'}
                      fontWeight={isStart || isEnd || isSelected || isSearchHit ? '700' : '600'}
                      fill={palette.labelBg}
                      stroke={palette.labelBg}
                      strokeWidth="4.2"
                      strokeLinejoin="round"
                      opacity="0.92"
                    >
                      {loc.shortName}
                    </text>
                    <text
                      x="0"
                      y="0"
                      textAnchor={offset.anchor ?? 'middle'}
                      fontSize={isStart || isEnd || isSelected ? '11' : '10'}
                      fontWeight={isStart || isEnd || isSelected || isSearchHit ? '700' : '600'}
                      fill={isEnd ? palette.routeColor : isStart ? '#0F766E' : palette.labelText}
                    >
                      {loc.shortName}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Route Endpoint Summary Callouts (when route is active) */}
          {startNode && endNode && startId === endId && (
            <g transform={`translate(${startNode.x}, ${startNode.y - 26})`} pointerEvents="none">
              <rect
                x="-64"
                y="-14"
                width="128"
                height="20"
                rx="4"
                fill={palette.labelBg}
                stroke={palette.labelBorder}
                strokeWidth="1"
              />
              <text
                x="0"
                y="-1"
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                fill={palette.labelText}
              >
                Start &amp; Destination
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Hover Tooltip Bar (Desktop, non-intrusive bottom-center) */}
      {hoveredLoc && (
        <div
          className="hidden sm:flex pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-20 items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-3.5 py-2 text-xs shadow-sm backdrop-blur-sm"
        >
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {hoveredLoc.name}
          </span>
          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {hoveredLoc.category}
          </span>
          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="text-red-800 dark:text-red-400 font-medium">
            Click for info
          </span>
        </div>
      )}

      {/* Bottom-Left Cartographic Legend & Compass Scale */}
      <div
        data-map-interactive="true"
        className="hidden md:flex absolute bottom-4 left-4 z-20 flex-col gap-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 px-3.5 py-2.5 text-xs shadow-sm backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-red-800 dark:text-red-400" />
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">N</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-14 h-1.5 border-x border-b border-slate-500 dark:border-slate-400" />
            <span className="font-mono text-[11px] tabular-nums">100 m</span>
          </div>
        </div>
        <div className="flex items-center gap-3.5 text-[11px] text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-red-800 dark:bg-red-500" />
            Route
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-amber-600" />
            {accessibleOnly ? 'Stairs (avoided)' : 'Stairs'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-700" />
            Start
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-800 dark:bg-red-500" />
            Dest.
          </span>
        </div>
      </div>

      {/* Bottom-Right Zoom & Viewport Controls */}
      <div
        data-map-interactive="true"
        className="absolute bottom-20 lg:bottom-4 right-3 sm:right-4 z-20 flex flex-col gap-1.5"
      >
        <div className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 shadow-sm backdrop-blur-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z + 0.25))}
            className="flex h-9 w-9 items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-800" />
          <div className="py-1 text-center font-mono text-[10px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
            {Math.round(zoom * 100)}%
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-800" />
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z - 0.25))}
            className="flex h-9 w-9 items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleFitRoute}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm backdrop-blur-sm transition-colors cursor-pointer"
          aria-label="Fit active route to view"
          title="Fit route to view"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetView}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm backdrop-blur-sm transition-colors cursor-pointer"
          aria-label="Reset map view"
          title="Reset map view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
