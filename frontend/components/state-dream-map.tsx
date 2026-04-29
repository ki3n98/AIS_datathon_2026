"use client";

import { Fragment, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { scaleLinear } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import {
  ComposableMap,
  createCoordinates,
  Geographies,
  Geography,
  getGeographyCentroid,
  Marker,
  ZoomableGroup,
} from "@vnedyalk0v/react19-simple-maps";
import type { Coordinates, GeographiesProps } from "@vnedyalk0v/react19-simple-maps";
import { Car, Home, ShieldCheck, ShoppingCart, Zap } from "lucide-react";
import statesAtlas from "us-atlas/states-10m.json";

import type { StateDreamProfile } from "@/lib/dashboard-data";

const GEO_DATA = statesAtlas as GeographiesProps["geography"];
const DEFAULT_CENTER = createCoordinates(-97, 39);

const SMALL_STATE_LABEL_OFFSETS: Record<string, [number, number]> = {
  Maine: [28, -20],
  "New Hampshire": [34, -26],
  Vermont: [18, -28],
  Massachusetts: [34, -10],
  "Rhode Island": [38, 6],
  Connecticut: [32, 14],
  "New Jersey": [34, 18],
  Delaware: [40, 24],
  Maryland: [28, 28],
  "District of Columbia": [48, 30],
};

type ZoomState = {
  center: Coordinates;
  zoom: number;
};

function normalizeStateName(value: string) {
  return value.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

function getLabelPlacement(stateName: string, zoom: number) {
  const offset = SMALL_STATE_LABEL_OFFSETS[stateName] ?? [0, 0];
  const isSmallState = stateName in SMALL_STATE_LABEL_OFFSETS;
  const shouldShow = !isSmallState || zoom >= 1.9;

  return {
    offset,
    isSmallState,
    shouldShow,
  };
}

function formatMapIncome(value: number) {
  return `$${Math.round(value / 1000)}k`;
}

function BudgetIcon({ label }: { label: string }) {
  const className = "h-4 w-4 text-[#5f6978]";

  if (label === "Housing") return <Home className={className} />;
  if (label === "Transport") return <Car className={className} />;
  if (label === "Essentials") return <ShoppingCart className={className} />;
  if (label === "Savings") return <ShieldCheck className={className} />;
  return <Zap className={className} />;
}

export function StateDreamMap({ profiles }: { profiles: StateDreamProfile[] }) {
  const [hovered, setHovered] = useState<StateDreamProfile | null>(null);
  const [selectedState, setSelectedState] = useState<StateDreamProfile | null>(profiles[0] ?? null);
  const [zoomState, setZoomState] = useState<ZoomState>({ center: DEFAULT_CENTER, zoom: 1 });

  const valueByState = useMemo(() => {
    const map = new Map<string, StateDreamProfile>();
    for (const profile of profiles) {
      map.set(normalizeStateName(profile.state), profile);
    }
    return map;
  }, [profiles]);

  const maxValue = useMemo(
    () => profiles.reduce((currentMax, profile) => Math.max(currentMax, profile.actualIncomeValue), 0),
    [profiles]
  );

  const colorScale = useMemo(
    () => scaleLinear<string>().domain([0, maxValue || 1]).range([interpolateBlues(0.12), interpolateBlues(0.88)]),
    [maxValue]
  );

  const zoomIn = () => {
    setZoomState((prev) => ({ ...prev, zoom: Math.min(prev.zoom * 1.4, 8) }));
  };

  const zoomOut = () => {
    setZoomState((prev) => ({ ...prev, zoom: Math.max(prev.zoom / 1.4, 1) }));
  };

  const resetZoom = () => {
    setZoomState({ center: DEFAULT_CENTER, zoom: 1 });
  };

  return (
    <div className="state-dream-map relative overflow-visible rounded-xl border border-[#d9dde3] bg-white p-4">
      {hovered ? (
        <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl bg-[#041627]/95 px-3 py-2 text-sm text-white shadow-lg">
          <div className="font-semibold">{hovered.state}</div>
          <div className="text-[#d6e3f3]">{hovered.actualIncome}</div>
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-4 left-4 z-20 w-64 max-w-[42%] rounded-xl border border-[#d9dde3] bg-white/92 p-3 shadow-lg backdrop-blur-sm"
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Legend</div>
        <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-blue-100 via-blue-300 to-blue-900" />
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#5f6978]">
          <span>Lower income</span>
          <span>Higher income</span>
        </div>
        <div className="mt-2 text-[11px] leading-4 text-[#5f6978]">
          Color shows {`2024`} per-capita personal income. Click a state to open its Dream note card.
        </div>
      </motion.div>

      {zoomState.zoom < 1.9 ? (
        <div className="pointer-events-none absolute bottom-4 left-72 z-10 rounded-xl bg-white/90 px-3 py-2 text-[11px] text-[#5f6978] shadow-sm backdrop-blur-sm">
          Zoom in to reveal more East Coast labels.
        </div>
      ) : null}

      {selectedState ? (
        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-4 right-4 z-20 w-80 rounded-xl border border-[#d9dde3] bg-white/96 p-4 shadow-xl backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#1b1c1d]">{selectedState.state}</div>
              <div className="mt-1 text-xs text-[#5f6978]">
                {selectedState.actualIncome} · {selectedState.tierLabel}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedState(null)}
              className="rounded-md px-2 py-1 text-xs font-medium text-[#5f6978] hover:bg-[#f7f8fa] hover:text-[#243447]"
            >
              Close
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-[#f2f7fb] p-3 ring-1 ring-[#d9e5f2]">
            <div className="text-xs uppercase tracking-wide text-[#335b86]">Comfortable income target</div>
            <div className="mt-1 text-2xl font-semibold text-[#041627]">{selectedState.comfortableIncome}/yr</div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {selectedState.monthlyBudget.map((item) => (
              <div key={item.label} className="rounded-xl bg-[#f7f8fa] p-3 text-xs text-[#5f6978]">
                <div className="flex items-center gap-2 text-[#44505f]">
                  <BudgetIcon label={item.label} />
                  {item.label}
                </div>
                <div className="mt-1 font-semibold text-[#1b1c1d]">{item.value}/mo</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-[#041627] p-3 text-sm leading-6 text-[#eef5ff]">
            <span className="font-semibold">Dream vibe: </span>
            {selectedState.message}
          </div>
        </motion.div>
      ) : null}

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={zoomOut}
          className="rounded-lg border border-[#d9dde3] bg-white px-3 py-1 text-sm font-medium text-[#243447] shadow-sm hover:bg-[#f7f8fa]"
        >
          -
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="rounded-lg border border-[#d9dde3] bg-white px-3 py-1 text-sm font-medium text-[#243447] shadow-sm hover:bg-[#f7f8fa]"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={zoomIn}
          className="rounded-lg border border-[#d9dde3] bg-white px-3 py-1 text-sm font-medium text-[#243447] shadow-sm hover:bg-[#f7f8fa]"
        >
          +
        </button>
      </div>

      <ComposableMap projection="geoAlbersUsa" width={980} height={600}>
        <ZoomableGroup center={zoomState.center} zoom={zoomState.zoom}>
          <Geographies geography={GEO_DATA}>
            {({ geographies }) => (
              <>
                {geographies.map((geo, index) => {
                  const properties = geo.properties ?? {};
                  const stateName = String(properties.name ?? properties.NAME ?? "");
                  const profile = valueByState.get(normalizeStateName(stateName));
                  const value = profile?.actualIncomeValue ?? 0;
                  const isSelected = selectedState?.state === stateName;
                  const isHovered = hovered?.state === stateName;
                  const centroid = getGeographyCentroid(geo);
                  const labelPlacement = getLabelPlacement(stateName, zoomState.zoom);
                  const labelCoordinates = centroid
                    ? createCoordinates(centroid[0] + labelPlacement.offset[0], centroid[1] + labelPlacement.offset[1])
                    : null;

                  return (
                    <Fragment key={`${stateName || "state"}-${geo.id ?? index}`}>
                      <Geography
                        geography={geo}
                        tabIndex={-1}
                        stroke="#cbd5e1"
                        strokeWidth={0.75}
                        fill={isSelected || isHovered ? interpolateBlues(0.96) : value > 0 ? colorScale(value) : "#f8fafc"}
                        onMouseEnter={() => profile && setHovered(profile)}
                        onMouseLeave={() => setHovered(null)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => profile && setSelectedState(profile)}
                        style={{
                          default: {
                            outline: "none",
                            cursor: profile ? "pointer" : "default",
                            filter: "none",
                          },
                          hover: {
                            outline: "none",
                            fill: value > 0 ? interpolateBlues(0.96) : "#e2e8f0",
                            cursor: profile ? "pointer" : "default",
                            filter: "none",
                          },
                          pressed: { outline: "none" },
                        }}
                      />

                      {profile && centroid && labelCoordinates && labelPlacement.shouldShow ? (
                        <Marker
                          coordinates={labelCoordinates}
                          tabIndex={-1}
                          onMouseEnter={() => setHovered(profile)}
                          onMouseLeave={() => setHovered(null)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setSelectedState(profile)}
                        >
                          <g className="cursor-pointer">
                            {labelPlacement.isSmallState ? (
                              <line
                                x1={-labelPlacement.offset[0]}
                                y1={-labelPlacement.offset[1]}
                                x2={0}
                                y2={0}
                                stroke="#64748b"
                                strokeWidth={1}
                              />
                            ) : null}
                            <text
                              x={0}
                              y={0}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={10}
                              fontWeight={700}
                              fill="#0f172a"
                              paintOrder="stroke fill"
                              stroke="#ffffff"
                              strokeWidth={3}
                            >
                              {formatMapIncome(value)}
                            </text>
                          </g>
                        </Marker>
                      ) : null}
                    </Fragment>
                  );
                })}
              </>
            )}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <style jsx>{`
        .state-dream-map :global(svg),
        .state-dream-map :global(svg *),
        .state-dream-map :global(path),
        .state-dream-map :global(g) {
          outline: none !important;
        }

        .state-dream-map :global(*:focus),
        .state-dream-map :global(*:focus-visible) {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
