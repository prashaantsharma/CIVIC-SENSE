import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Users, Heart, MessageCircle, AlertTriangle, Crosshair, HelpCircle, Layers } from "lucide-react";
import { CivicReport } from "../types";

interface ShadowMapProps {
  reports: CivicReport[];
  selectedReportId: string | null;
  onSelectReport: (reportId: string | null) => void;
  onValidateReport: (reportId: string) => void;
}

// Highly stylized SVG vector definitions of municipal wards of Mumbai
const WARDS = [
  { id: "h-west", name: "H-West (Bandra, Khar, Santacruz)", path: "M 80 180 Q 70 240 110 300 L 220 310 Q 230 240 180 180 Z", color: "rgba(0, 77, 64, 0.15)", hoverColor: "rgba(0, 105, 92, 0.3)" },
  { id: "g-north", name: "G-North (Dadar West, Dharavi, Mahim)", path: "M 110 300 Q 120 380 180 400 L 290 380 Q 280 320 220 310 Z", color: "rgba(0, 77, 64, 0.2)", hoverColor: "rgba(0, 105, 92, 0.35)" },
  { id: "k-west", name: "K-West (Andheri West, Juhu, Versova)", path: "M 90 40 Q 60 110 80 180 L 180 180 Q 200 110 160 40 Z", color: "rgba(0, 77, 64, 0.1)", hoverColor: "rgba(0, 105, 92, 0.25)" },
  { id: "f-north", name: "F-North (Sion, Wadala, Matunga)", path: "M 220 310 Q 280 320 290 380 L 390 350 Q 380 270 300 250 Z", color: "rgba(0, 77, 64, 0.25)", hoverColor: "rgba(0, 105, 92, 0.4)" },
  { id: "m-west", name: "M-West (Chembur, Tilak Nagar)", path: "M 300 250 Q 380 270 390 350 L 480 310 Q 430 200 320 200 Z", color: "rgba(0, 77, 64, 0.15)", hoverColor: "rgba(0, 105, 92, 0.3)" },
];

export default function ShadowMap({ reports, selectedReportId, onSelectReport, onValidateReport }: ShadowMapProps) {
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [showSocialRings, setShowSocialRings] = useState(true);

  // Map latitude/longitude to SVG coordinate space (roughly 500x480 box)
  const getCoordinates = (lat: number, lng: number) => {
    // Mumbai center roughly: Lat 19.05, Lng 72.85
    // Map latitude range [19.00 to 19.12] -> Y [440 to 40]
    // Map longitude range [72.80 to 72.90] -> X [40 to 460]
    const latMin = 19.00;
    const latMax = 19.12;
    const lngMin = 72.80;
    const lngMax = 72.90;

    const x = 40 + ((lng - lngMin) / (lngMax - lngMin)) * 420;
    const y = 440 - ((lat - latMin) / (latMax - latMin)) * 400;

    // keep within bounds
    return {
      x: Math.max(30, Math.min(470, x)),
      y: Math.max(30, Math.min(450, y))
    };
  };

  const selectedReport = reports.find((r) => r.id === selectedReportId);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-header text-xl text-civic-teal font-bold flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-electric-amber" />
            Live Shadow-Issue Geospatial Grid
          </h3>
          <p className="text-slate-500 text-xs">
            Interactive control map correlating formal citizen reports with unregistered social listening alerts.
          </p>
        </div>

        {/* Map options */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setShowSocialRings(!showSocialRings)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium transition-all ${
              showSocialRings
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showSocialRings ? "Social Pressure Rings: ON" : "Pressure Rings: OFF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Vector SVG Map Display */}
        <div className="lg:col-span-7 bg-slate-950 p-6 flex items-center justify-center relative overflow-hidden min-h-[460px]">
          {/* Cybernetic grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

          {/* Compass / Scale */}
          <div className="absolute bottom-4 left-4 text-slate-500 text-[10px] font-mono flex flex-col gap-1 pointer-events-none z-10 bg-slate-900/60 p-2 rounded border border-slate-800">
            <div>MUMBAI GEOSPATIAL NODE</div>
            <div>SCALE: 1px = ~35 METERS</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-civic-teal-light inline-block" /> Formal Report
              <span className="w-2.5 h-2.5 rounded-full bg-electric-amber inline-block" /> Shadow Complaint
            </div>
          </div>

          <svg
            viewBox="0 0 500 480"
            className="w-full max-w-[450px] h-auto z-10"
            style={{ filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.5))" }}
          >
            {/* Render Wards */}
            {WARDS.map((ward) => {
              const isSelected = selectedWard === ward.id;
              return (
                <path
                  key={ward.id}
                  d={ward.path}
                  fill={isSelected ? ward.hoverColor : ward.color}
                  stroke={isSelected ? "#ffbf00" : "rgba(0, 105, 92, 0.4)"}
                  strokeWidth={isSelected ? 1.5 : 1}
                  className="transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedWard(isSelected ? null : ward.id)}
                >
                  <title>{ward.name}</title>
                </path>
              );
            })}

            {/* Pulsing Issue Beacons */}
            {reports.map((report) => {
              const { x, y } = getCoordinates(report.latitude, report.longitude);
              const isSelected = selectedReportId === report.id;
              const isShadow = report.source === "social_listening";

              // Scale ring size based on social pressure score (max score 100)
              const ringRadius = showSocialRings ? 10 + (report.socialPressureScore / 100) * 28 : 0;

              return (
                <g key={report.id} className="cursor-pointer">
                  {/* Outer glowing pulsing circle representing Social Pressure */}
                  {showSocialRings && !report.status.includes("resolved") && (
                    <circle
                      cx={x}
                      cy={y}
                      r={ringRadius}
                      fill="none"
                      stroke={isShadow ? "rgba(255, 191, 0, 0.3)" : "rgba(0, 105, 92, 0.25)"}
                      strokeWidth={1.5}
                      strokeDasharray={isShadow ? "4, 4" : "0"}
                      className={isShadow ? "animate-pulse" : ""}
                    >
                      <animate
                        attributeName="r"
                        values={`${ringRadius - 5};${ringRadius + 8};${ringRadius - 5}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Intersect / Radar effect for hovered/selected issue */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="45"
                      fill="none"
                      stroke="rgba(255, 191, 0, 0.4)"
                      strokeWidth="0.5"
                      className="animate-ping"
                    />
                  )}

                  {/* Base beacon pin */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 8 : 5}
                    fill={report.status === "resolved" ? "#10b981" : isShadow ? "#ffbf00" : "#00897b"}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-all duration-200"
                    onClick={() => onSelectReport(report.id)}
                  />

                  {/* Hotspot Hover Target */}
                  <circle
                    cx={x}
                    cy={y}
                    r="15"
                    fill="transparent"
                    onClick={() => onSelectReport(report.id)}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Issue Meta Card Side Panel */}
        <div className="lg:col-span-5 bg-slate-50 p-6 flex flex-col justify-between border-l border-slate-100 min-h-[460px]">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div
                key={selectedReport.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 h-full flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        selectedReport.source === "social_listening"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-teal-100 text-teal-800 border border-teal-200"
                      }`}
                    >
                      {selectedReport.source === "social_listening" ? "Shadow Issue" : "Formal Report"}
                    </span>
                    <span className="text-slate-400 text-[10px] font-semibold font-mono">
                      #{selectedReport.id}
                    </span>
                  </div>

                  <h4 className="font-header text-xl text-civic-teal font-bold mt-2">
                    {selectedReport.issueType}
                  </h4>
                  <p className="text-slate-500 text-xs flex items-center gap-1 mt-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    {selectedReport.locationContext}
                  </p>

                  {/* Landmark Alert */}
                  <div className="mt-3 p-2.5 bg-slate-100/60 rounded border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold">
                      LANDMARK
                    </span>
                    <span>"{selectedReport.landmark}"</span>
                  </div>

                  {/* Speech to Translation Block */}
                  <div className="mt-4 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Original Regional Input
                    </div>
                    <blockquote className="p-3 bg-white border-l-4 border-slate-300 rounded-r-lg text-slate-600 text-xs italic font-medium leading-relaxed shadow-sm">
                      "{selectedReport.rawTranscript}"
                    </blockquote>

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                      Gemini English Translation
                    </div>
                    <p className="text-slate-800 text-xs leading-relaxed font-semibold">
                      {selectedReport.englishTranslation}
                    </p>
                  </div>

                  {/* Social stats block */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Social signals
                      </span>
                      <div className="flex items-center gap-1 text-slate-700 mt-1">
                        <MessageCircle className="w-4 h-4 text-amber-500 fill-amber-50" />
                        <span className="font-bold text-sm">
                          {selectedReport.socialSignalCount} verified posts
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Social Pressure
                      </span>
                      <div className="flex items-center gap-1 text-slate-700 mt-1">
                        <Users className="w-4 h-4 text-electric-amber" />
                        <span className="font-bold text-sm text-amber-600">
                          {selectedReport.socialPressureScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validate Card Actions */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-semibold">
                    <span>Validation Citations: {selectedReport.citations}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-700 uppercase font-bold">
                      {selectedReport.status}
                    </span>
                  </div>

                  {selectedReport.status === "needs_confirmation" ? (
                    <button
                      onClick={() => onValidateReport(selectedReport.id)}
                      className="w-full bg-civic-teal hover:bg-civic-teal-light text-white py-2.5 px-4 rounded-xl font-header font-bold flex items-center justify-center gap-2 shadow-md transition-all duration-200 hover:scale-[1.02]"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      Add Citizen Citation (+1 Vote)
                    </button>
                  ) : (
                    <div className="bg-teal-50 border border-teal-200 text-teal-800 p-2.5 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2">
                      <Users className="w-4 h-4" />
                      Report Verified & Assigned to Department
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-10">
                <HelpCircle className="w-12 h-12 text-slate-300 mb-2 stroke-[1.5]" />
                <h4 className="font-header text-lg font-semibold text-slate-700">
                  No Active Node Selected
                </h4>
                <p className="text-xs max-w-[200px] mt-1 leading-relaxed">
                  Click on any map beacon (Teal for formal, Amber for shadow issue) to pull up full linguistic audit trails.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
