import React, { useState } from 'react';
import {
  Plane,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building,
  Calendar,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';

interface NodeDetails {
  id: string;
  label: string;
  sublabel: string;
  status: 'SAFE' | 'COMPRESSED' | 'BREACHED' | 'CANCELLED';
  timeInfo: string;
  marginInfo: string;
  description: string;
}

export function DelayPropagationGraph() {
  const { state, disruptionCalc, currentConfig } = useRouteXStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('hub');

  const delay = state.params.delayMinutes;
  const mct = state.params.mctBufferMinutes;
  const scheduledLayover = currentConfig.scheduledLayoverMinutes;
  const effectiveLayover = disruptionCalc.effectiveLayoverMinutes;
  const isCancelled = state.customUserTripInput?.disruption.type === 'CANCELLATION';
  const isMissed = disruptionCalc.isConnectionMissed;

  // Build the nodes
  const nodes: NodeDetails[] = [
    {
      id: 'leg1',
      label: 'Inbound Leg 1',
      sublabel: `${state.trip.origin.split(' ')[0]} → ${state.trip.destination.split(' ')[0]} Hub`,
      status: isCancelled ? 'CANCELLED' : delay === 0 ? 'SAFE' : delay < 45 ? 'COMPRESSED' : 'BREACHED',
      timeInfo: delay === 0 ? 'On Time' : `+${delay}m Touchdown Delay`,
      marginInfo: delay === 0 ? 'Nominal schedule' : `${delay}m pushed into connection buffer`,
      description: `Inbound flight departure. Delay of +${delay}m directly compresses the arrival window at the hub airport.`,
    },
    {
      id: 'hub',
      label: 'Hub Connection',
      sublabel: `MCT Gate (${mct}m required)`,
      status: isCancelled
        ? 'CANCELLED'
        : disruptionCalc.statusCategory === 'ON_SCHEDULE'
        ? 'SAFE'
        : disruptionCalc.statusCategory === 'TIGHT_BUFFER'
        ? 'COMPRESSED'
        : 'BREACHED',
      timeInfo: `${effectiveLayover}m Available Window`,
      marginInfo:
        disruptionCalc.connectionMarginMinutes >= 0
          ? `+${disruptionCalc.connectionMarginMinutes}m above MCT`
          : `${disruptionCalc.connectionMarginMinutes}m below MCT (FATAL)`,
      description: `Hub transfer gate at ${currentConfig.trip.destination.split(' ')[0]}. Inbound touchdown must leave at least ${mct}m physical MCT before onward boarding doors lock.`,
    },
    {
      id: 'leg2',
      label: 'Onward Connection',
      sublabel: 'Long-haul Segment',
      status: isMissed ? 'BREACHED' : 'SAFE',
      timeInfo: isMissed ? 'Boarding Lockout' : 'On-Time Departure',
      marginInfo: isMissed ? 'Missed connection' : 'Seats and baggage intact',
      description: isMissed
        ? 'Traveler cannot board onward flight due to arrival past boarding cutoff. Airline rebooking or RouteX recovery required.'
        : 'Connection executed safely within required buffer.',
    },
    {
      id: 'hotel',
      label: 'Hotel & Rest',
      sublabel: 'Accommodations',
      status: isMissed ? 'COMPRESSED' : 'SAFE',
      timeInfo: isMissed ? 'Late Check-in Risk' : 'Standard Check-in',
      marginInfo: isMissed ? 'Overnight rest compressed' : 'Full rest cycle',
      description: 'Destination hotel reservation. Delay cascades into check-in window and sleep opportunity before morning business commitments.',
    },
    {
      id: 'commitment',
      label: 'Partner Keynote',
      sublabel: 'Hard Business Deadline',
      status: isMissed ? 'COMPRESSED' : 'SAFE',
      timeInfo: '12:00 Local Deadline',
      marginInfo: isMissed ? 'Contingency recovery needed' : 'Nominal arrival 4h before event',
      description: 'The mandatory commitment that must not be missed. The deterministic engine evaluates all recovery options strictly against this deadline.',
    },
  ];

  const getStatusColor = (status: NodeDetails['status']) => {
    switch (status) {
      case 'SAFE':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-100 text-emerald-800',
        };
      case 'COMPRESSED':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-700',
          dot: 'bg-amber-500',
          badge: 'bg-amber-100 text-amber-800',
        };
      case 'BREACHED':
      case 'CANCELLED':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-700',
          dot: 'bg-rose-500',
          badge: 'bg-rose-100 text-rose-800',
        };
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[1];
  const selectedStyle = getStatusColor(selectedNode.status);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Delay Propagation Graph (Digital Twin)
          </h4>
        </div>
        <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
          Dynamic Graph Propagation
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Live topology of your journey. An upstream disruption cascades downstream through each node, dynamically
        recoloring buffers and triggering recovery gates.
      </p>

      {/* Nodes Pipeline */}
      <div className="overflow-x-auto pb-2 no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-[580px]">
          {nodes.map((node, idx) => {
            const style = getStatusColor(node.status);
            const isSelected = selectedNodeId === node.id;

            return (
              <React.Fragment key={node.id}>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`flex-1 p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'ring-2 ring-primary shadow-sm bg-card'
                      : 'hover:bg-secondary/60 bg-secondary/20'
                  } ${style.bg}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-foreground truncate block">
                      {node.label}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  </div>
                  <div className="text-[12px] font-semibold truncate text-muted-foreground">
                    {node.timeInfo}
                  </div>
                  <div className="text-[12px] font-bold truncate mt-0.5">{node.marginInfo}</div>
                </button>

                {idx < nodes.length - 1 && (
                  <ArrowRight
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      nodes[idx].status === 'BREACHED' || nodes[idx].status === 'CANCELLED'
                        ? 'text-rose-500'
                        : nodes[idx].status === 'COMPRESSED'
                        ? 'text-amber-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details Card */}
      <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-foreground flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${selectedStyle.dot}`} />
            {selectedNode.label} — {selectedNode.sublabel}
          </span>
          <span className={`px-2 py-0.5 rounded text-[12px] font-bold uppercase ${selectedStyle.badge}`}>
            {selectedNode.status}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {selectedNode.description}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60 text-[12px]">
          <div>
            <span className="text-muted-foreground block font-medium">Timing Impact</span>
            <span className="font-bold text-foreground">{selectedNode.timeInfo}</span>
          </div>
          <div>
            <span className="text-muted-foreground block font-medium">Operational State</span>
            <span className="font-bold text-foreground">{selectedNode.marginInfo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
