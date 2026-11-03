import React, { useMemo } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';
import { motion, useReducedMotion } from 'framer-motion';
import worldData from 'world-atlas/countries-110m.json';

// Real airport coordinates [lon, lat]
const AIRPORTS: Record<string, [number, number]> = {
  LHR: [-0.4543, 51.4700],  // London Heathrow
  FRA: [8.5706, 50.0379],   // Frankfurt
  HND: [139.7811, 35.5494], // Tokyo Haneda
};

interface RouteMapProps {
  isDisrupted: boolean;
  isApproved: boolean;
  width?: number;
  height?: number;
}

export function RouteMap({ isDisrupted, isApproved, width = 700, height = 280 }: RouteMapProps) {
  const shouldReduceMotion = useReducedMotion();

  const { lhr, fra, hnd, pathLHR_FRA, pathFRA_HND, landPath } = useMemo(() => {
    const proj = geoNaturalEarth1()
      .scale(width / 5.2)
      .center([65, 42])
      .translate([width / 2, height / 2]);

    const pathGenerator = geoPath(proj);

    // Extract real landmass from world-atlas
    const landFeature = topojson.feature(
      worldData as any,
      (worldData as any).objects.land
    );
    const landPath = pathGenerator(landFeature) || '';

    const lhr = proj(AIRPORTS.LHR) || [0, 0];
    const fra = proj(AIRPORTS.FRA) || [0, 0];
    const hnd = proj(AIRPORTS.HND) || [0, 0];

    // Great-circle arc approximation with control point lifted above midpoint
    const midLHR_FRA: [number, number] = [(lhr[0] + fra[0]) / 2, (lhr[1] + fra[1]) / 2 - 18];
    const midFRA_HND: [number, number] = [(fra[0] + hnd[0]) / 2, (fra[1] + hnd[1]) / 2 - 45];

    const pathLHR_FRA = `M ${lhr[0]},${lhr[1]} Q ${midLHR_FRA[0]},${midLHR_FRA[1]} ${fra[0]},${fra[1]}`;
    const pathFRA_HND = `M ${fra[0]},${fra[1]} Q ${midFRA_HND[0]},${midFRA_HND[1]} ${hnd[0]},${hnd[1]}`;

    return { lhr, fra, hnd, pathLHR_FRA, pathFRA_HND, landPath };
  }, [width, height]);

  const arcTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 1.2, ease: 'easeOut' as const };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-[#F2F5F8] border border-border">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        aria-label="Route map with real coastlines showing LHR → FRA → HND"
      >
        {/* Ocean fill */}
        <rect width={width} height={height} fill="#F2F5F8" />

        {/* Real coastlines rendered from world-atlas 110m */}
        <path
          d={landPath}
          fill="#DFE6ED"
          stroke="#CED8E2"
          strokeWidth="0.75"
        />

        {/* Segment 1: LHR → FRA (dashed amber when delayed) */}
        <motion.path
          d={pathLHR_FRA}
          stroke={isDisrupted ? '#D97706' : '#147870'}
          strokeWidth="2.5"
          strokeDasharray={isDisrupted ? '6 4' : 'none'}
          fill="none"
          initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={arcTransition}
        />

        {/* Segment 2: FRA → HND (original route — red dashed if missed) */}
        {!isApproved && (
          <motion.path
            d={pathFRA_HND}
            stroke={isDisrupted ? '#E11D48' : '#147870'}
            strokeWidth="2.5"
            strokeDasharray={isDisrupted ? '4 6' : 'none'}
            fill="none"
            opacity={isDisrupted ? 0.6 : 1}
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ ...arcTransition, delay: shouldReduceMotion ? 0 : 0.3 }}
          />
        )}

        {/* Rebooked Route: FRA → HND (solid teal when approved) */}
        {isApproved && (
          <motion.path
            d={pathFRA_HND}
            stroke="#147870"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ ...arcTransition, delay: shouldReduceMotion ? 0 : 0.2 }}
          />
        )}

        {/* Airport nodes */}
        {([
          { pt: lhr, code: 'LHR', label: 'London' },
          { pt: fra, code: 'FRA', label: 'Frankfurt' },
          { pt: hnd, code: 'HND', label: 'Tokyo' },
        ] as { pt: [number, number]; code: string; label: string }[]).map(({ pt, code, label }) => (
          <g key={code}>
            <circle cx={pt[0]} cy={pt[1]} r="5" fill="#147870" />
            <circle cx={pt[0]} cy={pt[1]} r="9" fill="#147870" opacity="0.18" />
            <text
              x={pt[0] + 10}
              y={pt[1] - 5}
              fontSize="12"
              fontWeight="600"
              fill="#14171F"
              fontFamily="Inter, sans-serif"
            >
              {code}
            </text>
            <text
              x={pt[0] + 10}
              y={pt[1] + 9}
              fontSize="12"
              fill="#4B5563"
              fontFamily="Inter, sans-serif"
            >
              {label}
            </text>
          </g>
        ))}

        {/* Disruption / Rebooking Badge on Map */}
        {isDisrupted && !isApproved && (
          <g>
            <rect
              x={fra[0] - 75}
              y={fra[1] + 16}
              width="150"
              height="24"
              rx="6"
              fill="#FEF3C7"
              stroke="#D97706"
              strokeWidth="1"
            />
            <text
              x={fra[0]}
              y={fra[1] + 32}
              fontSize="12"
              fill="#92400E"
              textAnchor="middle"
              fontWeight="600"
              fontFamily="Inter, sans-serif"
            >
              Connection missed · +75m
            </text>
          </g>
        )}
        {isApproved && (
          <g>
            <rect
              x={fra[0] - 70}
              y={fra[1] + 16}
              width="140"
              height="24"
              rx="6"
              fill="#DCFCE7"
              stroke="#16A34A"
              strokeWidth="1"
            />
            <text
              x={fra[0]}
              y={fra[1] + 32}
              fontSize="12"
              fill="#15803D"
              textAnchor="middle"
              fontWeight="600"
              fontFamily="Inter, sans-serif"
            >
              LH 714 · Confirmed
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
