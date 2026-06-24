import React from "react";
import { Trophy, Clock, CheckSquare, AlertTriangle } from "lucide-react";
import { LeaderboardStats } from "../types";

interface LeaderboardProps {
  stats: LeaderboardStats[];
}

export default function Leaderboard({ stats }: LeaderboardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
      {/* Decorative cyber backdrop glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-civic-teal/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h3 className="font-header text-lg text-white font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-electric-amber" />
              Public Ward Leaderboard
            </h3>
            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
              Real-time resolve performance indexing of regional municipal departments.
            </p>
          </div>
          <div className="text-[9px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono tracking-wider shrink-0">
            LIVE INDEX
          </div>
        </div>

        <div className="space-y-3">
          {stats.map((dept, index) => {
            // Determine color scheme based on rank/index
            const rankBg = index === 0 
              ? "bg-electric-amber/10 text-electric-amber border-electric-amber/20" 
              : index === 1 
              ? "bg-slate-800 text-slate-300 border-slate-700/60" 
              : "bg-amber-950/20 text-amber-600 border-amber-950/40";
            
            return (
              <div
                key={dept.assigned_dept}
                className="group bg-slate-950/40 border border-slate-800/80 hover:border-civic-teal/50 hover:bg-slate-900/60 p-3.5 rounded-xl flex flex-col gap-2.5 transition-all duration-300"
              >
                {/* Row 1: Rank, Name & Score */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${rankBg} shrink-0`}>
                      #{index + 1}
                    </span>
                    <h4 className="text-white font-header text-xs font-bold truncate group-hover:text-electric-amber transition-colors">
                      {dept.assigned_dept}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-mono font-bold text-electric-amber">
                      {dept.performance_rank} <span className="text-[9px] text-slate-400 font-normal">pts</span>
                    </span>
                  </div>
                </div>

                {/* Row 2: Performance Progress Bar */}
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-civic-teal rounded-full transition-all duration-500"
                    style={{ width: `${dept.performance_rank}%` }}
                  />
                </div>

                {/* Row 3: SLA & Resolution Badges */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  <div className="bg-slate-900/60 border border-slate-800/40 px-2 py-1 rounded flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider block">SLA</span>
                    <span className="text-[10px] text-slate-300 font-mono font-bold mt-0.5">
                      {dept.avg_resolve_time_hours}h
                    </span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/40 px-2 py-1 rounded flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider block">SOLVED</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5">
                      {dept.total_resolved}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/40 px-2 py-1 rounded flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider block">OVERDUE</span>
                    <span className={`text-[10px] font-mono font-bold mt-0.5 ${dept.total_overdue > 0 ? "text-red-400" : "text-slate-400"}`}>
                      {dept.total_overdue}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-950/10 border border-amber-500/10 rounded-xl text-center">
        <p className="text-[10px] text-amber-200/90 italic font-medium">
          "Visibility drives accountability without friction."
        </p>
        <span className="text-[8px] text-slate-500 block mt-0.5 uppercase font-bold tracking-widest font-mono">
          Civic-Sense Soft Mandate
        </span>
      </div>
    </div>
  );
}
