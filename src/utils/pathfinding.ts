import {
  ALL_NODES_MAP,
  CAMPUS_EDGES,
  type CampusEdge,
  type GraphNode,
} from '../data/campusData';

export type TurnType =
  | 'start'
  | 'straight'
  | 'slight-left'
  | 'left'
  | 'slight-right'
  | 'right'
  | 'arrive';

export interface RouteStep {
  id: string;
  stepNumber: number;
  turnType: TurnType;
  instruction: string;
  detail: string;
  distanceMeters: number;
  fromNodeId: string;
  toNodeId: string;
  hasStairs: boolean;
  focusPoint: { x: number; y: number };
}

export interface RouteResult {
  found: boolean;
  startId: string;
  endId: string;
  accessibleOnly: boolean;
  nodeIds: string[];
  edges: CampusEdge[];
  totalDistanceMeters: number;
  walkingTimeMinutes: number;
  exactWalkingMinutes: number;
  steps: RouteStep[];
  svgPathD: string;
  usedAccessibleDetour: boolean;
  detourDeltaMeters: number;
  includesStairs: boolean;
}

interface AdjacencyEntry {
  to: string;
  edge: CampusEdge;
}

function buildAdjacency(accessibleOnly: boolean): Record<string, AdjacencyEntry[]> {
  const graph: Record<string, AdjacencyEntry[]> = {};
  for (const nodeId of Object.keys(ALL_NODES_MAP)) {
    graph[nodeId] = [];
  }
  for (const edge of CAMPUS_EDGES) {
    if (accessibleOnly && !edge.accessible) continue;
    if (!graph[edge.from]) graph[edge.from] = [];
    if (!graph[edge.to]) graph[edge.to] = [];
    graph[edge.from].push({ to: edge.to, edge });
    graph[edge.to].push({ to: edge.from, edge });
  }
  return graph;
}

/**
 * Pure Dijkstra shortest-path solver on the campus graph.
 */
function runDijkstra(
  startId: string,
  endId: string,
  accessibleOnly: boolean
): { nodeIds: string[]; edges: CampusEdge[]; totalDistance: number } | null {
  if (!ALL_NODES_MAP[startId] || !ALL_NODES_MAP[endId]) return null;
  if (startId === endId) {
    return { nodeIds: [startId], edges: [], totalDistance: 0 };
  }

  const graph = buildAdjacency(accessibleOnly);
  const distances: Record<string, number> = {};
  const previousNode: Record<string, string | null> = {};
  const previousEdge: Record<string, CampusEdge | null> = {};
  const unvisited = new Set<string>(Object.keys(graph));

  for (const id of unvisited) {
    distances[id] = Infinity;
    previousNode[id] = null;
    previousEdge[id] = null;
  }
  distances[startId] = 0;

  while (unvisited.size > 0) {
    let current: string | null = null;
    let smallest = Infinity;
    for (const candidate of unvisited) {
      if (distances[candidate] < smallest) {
        smallest = distances[candidate];
        current = candidate;
      }
    }

    if (current === null || smallest === Infinity) break;
    if (current === endId) break;

    unvisited.delete(current);

    for (const neighbor of graph[current] ?? []) {
      if (!unvisited.has(neighbor.to)) continue;
      const alt = distances[current] + neighbor.edge.distance;
      if (alt < distances[neighbor.to]) {
        distances[neighbor.to] = alt;
        previousNode[neighbor.to] = current;
        previousEdge[neighbor.to] = neighbor.edge;
      }
    }
  }

  if (distances[endId] === Infinity) return null;

  const nodeIds: string[] = [];
  const edges: CampusEdge[] = [];
  let cursor: string | null = endId;

  while (cursor !== null) {
    nodeIds.unshift(cursor);
    const edgeUsed = previousEdge[cursor];
    if (edgeUsed) edges.unshift(edgeUsed);
    cursor = previousNode[cursor];
  }

  return {
    nodeIds,
    edges,
    totalDistance: distances[endId],
  };
}

/**
 * Returns compass direction from node A to node B in SVG screen coordinates (y increases southward).
 */
function getCompassDirection(a: GraphNode, b: GraphNode): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Angle in degrees where 0 = East, 90 = South, -90 = North
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle >= -22.5 && angle < 22.5) return 'east';
  if (angle >= 22.5 && angle < 67.5) return 'southeast';
  if (angle >= 67.5 && angle < 112.5) return 'south';
  if (angle >= 112.5 && angle < 157.5) return 'southwest';
  if (angle >= 157.5 || angle < -157.5) return 'west';
  if (angle >= -157.5 && angle < -112.5) return 'northwest';
  if (angle >= -112.5 && angle < -67.5) return 'north';
  return 'northeast';
}

/**
 * Determines relative turn direction between incoming vector (p1 -> p2) and outgoing vector (p2 -> p3).
 */
function getRelativeTurn(p1: GraphNode, p2: GraphNode, p3: GraphNode): TurnType {
  const v1x = p2.x - p1.x;
  const v1y = p2.y - p1.y;
  const v2x = p3.x - p2.x;
  const v2y = p3.y - p2.y;

  const angle1 = Math.atan2(v1y, v1x);
  const angle2 = Math.atan2(v2y, v2x);
  let delta = ((angle2 - angle1) * 180) / Math.PI;

  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;

  // In SVG coordinates (y-down), positive delta is clockwise = right turn; negative is counter-clockwise = left turn
  if (Math.abs(delta) < 24) return 'straight';
  if (delta >= 24 && delta < 58) return 'slight-right';
  if (delta >= 58) return 'right';
  if (delta <= -24 && delta > -58) return 'slight-left';
  return 'left';
}

function getDisplayLabel(node: GraphNode): string {
  return node.isLandmark ? node.shortName : node.name;
}

function buildTurnByTurnSteps(nodeIds: string[], edges: CampusEdge[]): RouteStep[] {
  if (nodeIds.length === 0) return [];

  const startNode = ALL_NODES_MAP[nodeIds[0]];
  const endNode = ALL_NODES_MAP[nodeIds[nodeIds.length - 1]];

  if (nodeIds.length === 1) {
    return [
      {
        id: 'step-same',
        stepNumber: 1,
        turnType: 'arrive',
        instruction: `You are already at ${startNode.name}`,
        detail: 'Select a different start or destination to plan a route.',
        distanceMeters: 0,
        fromNodeId: startNode.id,
        toNodeId: endNode.id,
        hasStairs: false,
        focusPoint: { x: startNode.x, y: startNode.y },
      },
    ];
  }

  const steps: RouteStep[] = [];
  let stepNum = 1;

  // Step 1: Start
  steps.push({
    id: `step-start-${startNode.id}`,
    stepNumber: stepNum++,
    turnType: 'start',
    instruction: `Start at ${startNode.name}`,
    detail: `Head ${getCompassDirection(startNode, ALL_NODES_MAP[nodeIds[1]])} along ${edges[0].pathName}`,
    distanceMeters: 0,
    fromNodeId: startNode.id,
    toNodeId: startNode.id,
    hasStairs: false,
    focusPoint: { x: startNode.x, y: startNode.y },
  });

  // Walk segments
  for (let i = 0; i < edges.length; i++) {
    const fromNode = ALL_NODES_MAP[nodeIds[i]];
    const toNode = ALL_NODES_MAP[nodeIds[i + 1]];
    const edge = edges[i];
    const compass = getCompassDirection(fromNode, toNode);
    const isFinalLeg = i === edges.length - 1;

    let turnType: TurnType = 'straight';
    let turnPhrase = 'Walk';

    if (i > 0) {
      const prevNode = ALL_NODES_MAP[nodeIds[i - 1]];
      turnType = getRelativeTurn(prevNode, fromNode, toNode);
      if (turnType === 'left') turnPhrase = 'Turn left and walk';
      else if (turnType === 'right') turnPhrase = 'Turn right and walk';
      else if (turnType === 'slight-left') turnPhrase = 'Keep slight left and walk';
      else if (turnType === 'slight-right') turnPhrase = 'Keep slight right and walk';
      else turnPhrase = 'Continue';
    }

    const targetPhrase = isFinalLeg
      ? `to ${toNode.name}`
      : toNode.isLandmark
        ? `past ${toNode.shortName}`
        : `toward ${getDisplayLabel(toNode)}`;

    const stairsHint = edge.hasStairs ? ' (via stairs)' : '';

    steps.push({
      id: `step-leg-${i}-${edge.id}`,
      stepNumber: stepNum++,
      turnType,
      instruction: `${turnPhrase} ${edge.distance}m ${compass} ${targetPhrase}${stairsHint}`,
      detail: edge.hasStairs
        ? `${edge.pathName} · Includes outdoor steps`
        : `${edge.pathName} · Paved walkway`,
      distanceMeters: edge.distance,
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      hasStairs: Boolean(edge.hasStairs),
      focusPoint: {
        x: Math.round((fromNode.x + toNode.x) / 2),
        y: Math.round((fromNode.y + toNode.y) / 2),
      },
    });
  }

  // Final Arrival step
  steps.push({
    id: `step-arrive-${endNode.id}`,
    stepNumber: stepNum++,
    turnType: 'arrive',
    instruction: `Arrive at ${endNode.name}`,
    detail: endNode.isLandmark ? endNode.accessibilityNote : 'Destination reached.',
    distanceMeters: 0,
    fromNodeId: endNode.id,
    toNodeId: endNode.id,
    hasStairs: false,
    focusPoint: { x: endNode.x, y: endNode.y },
  });

  return steps;
}

/**
 * Generates an SVG path string with gently rounded corners at intermediate junctions.
 */
function buildSmoothSvgPath(nodeIds: string[]): string {
  if (nodeIds.length < 2) return '';
  const pts = nodeIds.map((id) => ALL_NODES_MAP[id]).filter(Boolean);
  if (pts.length < 2) return '';

  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  const cornerRadius = 14;

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const len1 = Math.hypot(v1x, v1y);

    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len2 = Math.hypot(v2x, v2y);

    const r = Math.min(cornerRadius, len1 * 0.35, len2 * 0.35);
    const startX = curr.x + (v1x / len1) * r;
    const startY = curr.y + (v1y / len1) * r;
    const endX = curr.x + (v2x / len2) * r;
    const endY = curr.y + (v2y / len2) * r;

    d += ` L ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${curr.x} ${curr.y} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
  }

  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Computes shortest route between two campus locations using Dijkstra's algorithm.
 * Walking speed: 80 meters/minute.
 */
export function findShortestPath(
  startId: string,
  endId: string,
  accessibleOnly = false
): RouteResult {
  const result = runDijkstra(startId, endId, accessibleOnly);

  if (!result) {
    return {
      found: false,
      startId,
      endId,
      accessibleOnly,
      nodeIds: [],
      edges: [],
      totalDistanceMeters: 0,
      walkingTimeMinutes: 0,
      exactWalkingMinutes: 0,
      steps: [],
      svgPathD: '',
      usedAccessibleDetour: false,
      detourDeltaMeters: 0,
      includesStairs: false,
    };
  }

  let usedAccessibleDetour = false;
  let detourDeltaMeters = 0;

  if (accessibleOnly && startId !== endId) {
    const standardResult = runDijkstra(startId, endId, false);
    if (standardResult && result.totalDistance > standardResult.totalDistance) {
      usedAccessibleDetour = true;
      detourDeltaMeters = result.totalDistance - standardResult.totalDistance;
    }
  }

  const exactMinutes = result.totalDistance / 80;
  const walkingTimeMinutes =
    result.totalDistance === 0 ? 0 : Math.max(1, Math.ceil(exactMinutes));

  return {
    found: true,
    startId,
    endId,
    accessibleOnly,
    nodeIds: result.nodeIds,
    edges: result.edges,
    totalDistanceMeters: result.totalDistance,
    walkingTimeMinutes,
    exactWalkingMinutes: Number(exactMinutes.toFixed(1)),
    steps: buildTurnByTurnSteps(result.nodeIds, result.edges),
    svgPathD: buildSmoothSvgPath(result.nodeIds),
    usedAccessibleDetour,
    detourDeltaMeters,
    includesStairs: result.edges.some((e) => Boolean(e.hasStairs)),
  };
}
