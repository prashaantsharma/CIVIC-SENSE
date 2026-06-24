import React, { useState } from "react";
import { AlertTriangle, Clock, Landmark, MessageSquare, Sparkles, CheckSquare, Search, ArrowRight, CornerDownRight, RefreshCw, Smartphone } from "lucide-react";
import { CivicReport } from "../types";

interface AuthorityConsoleProps {
  reports: CivicReport[];
  selectedReportId: string | null;
  onSelectReport: (id: string | null) => void;
  onResolveReport: (id: string) => void;
  onScanSocial: () => void;
  isScanning: boolean;
  socialAlert: string | null;
}

export default function AuthorityConsole({ reports, selectedReportId, onSelectReport, onResolveReport, onScanSocial, isScanning, socialAlert }: AuthorityConsoleProps) {
  const [activeTab, setActiveTab] = useState<"all" | "assigned" | "overdue" | "resolved">("all");

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const selectedReport = reports.find((r) => r.id === (selectedReportId || (filteredReports[0]?.id)));

  const formatDeadline = (isoString: string) => {
    const deadline = new Date(isoString);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHrs = Math.round(diffMs / (3600 * 1000));

    if (diffHrs < 0) {
      return { text: `SLA BREACHED (${Math.abs(diffHrs)}h ago)`, color: "text-red-400 font-bold" };
    }
    return { text: `${diffHrs} hours remaining`, color: "text-amber-400 font-medium" };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800 pb-5">
        <div>
          <span className="text-[10px] bg-electric-amber/10 border border-electric-amber/30 text-electric-amber px-2.5 py-0.5 rounded font-bold font-mono">
            PORTAL: MUNICIPAL COMMAND CENTER
          </span>
          <h3 className="font-header text-2xl text-white font-bold mt-1.5">
            AI-Driven Governance Console
          </h3>
        </div>

        {/* Real social scraper trigger */}
        <button
          onClick={onScanSocial}
          disabled={isScanning}
          className="bg-civic-teal hover:bg-civic-teal-light border border-electric-amber text-electric-amber font-header font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
          {isScanning ? "Scanning Twitter/X Feed..." : "Scan Public Social Feed"}
        </button>
      </div>

      {socialAlert && (
        <div className="mb-6 bg-amber-950/40 border border-electric-amber/30 p-4 rounded-xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-electric-amber shrink-0 mt-0.5 animate-bounce" />
          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">Social Complaint Captured!</h5>
            <p className="text-slate-300 text-xs mt-1 italic">"{socialAlert}"</p>
            <p className="text-[10px] text-amber-500 font-bold mt-1.5 uppercase">
              Processed through Gemini NLU & Deduplicated in real-time.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Ticket feed queue list */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80 text-xs text-slate-400">
            {(["all", "assigned", "overdue", "resolved"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  onSelectReport(null);
                }}
                className={`flex-1 py-1.5 text-center rounded-lg font-bold uppercase transition-all ${
                  activeTab === tab
                    ? "bg-civic-teal text-white shadow"
                    : "hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Queue Queue items */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredReports.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-10 font-mono">
                NO ACTIVE ISSUES IN THIS FILTER.
              </div>
            ) : (
              filteredReports.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                const sla = formatDeadline(report.slaDeadline);

                return (
                  <button
                    key={report.id}
                    onClick={() => onSelectReport(report.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2 relative overflow-hidden ${
                      isSelected
                        ? "bg-slate-800 border-electric-amber/60 text-white shadow-lg"
                        : "bg-slate-950/30 border-slate-800 text-slate-300 hover:bg-slate-800/40 hover:border-slate-700"
                    }`}
                  >
                    {/* Urgency border glow */}
                    {report.status === "overdue" && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-500 animate-pulse" />
                    )}

                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="font-bold uppercase tracking-wider text-electric-amber">
                        {report.issueType}
                      </span>
                      <span className="text-slate-500">#{report.id}</span>
                    </div>

                    <h4 className="font-header text-sm font-bold truncate">
                      {report.landmark}
                    </h4>
                    <p className="text-slate-400 text-xs line-clamp-1 italic">
                      "{report.englishTranslation}"
                    </p>

                    <div className="flex justify-between items-center text-[10px] mt-1 text-slate-500">
                      <span className="font-medium">City: {report.city}</span>
                      <span className={sla.color}>{sla.text}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected Ticket Evidence Bundle View */}
        <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between min-h-[440px]">
          {selectedReport ? (
            <div className="space-y-5 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400 bg-teal-950/60 border border-teal-800/50 px-2.5 py-0.5 rounded">
                      Evidence Bundle
                    </span>
                    <h3 className="font-header text-xl text-white font-bold mt-1">
                      {selectedReport.issueType}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      selectedReport.status === "resolved"
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                        : selectedReport.status === "overdue"
                        ? "bg-red-950/80 text-red-400 border border-red-800/50 animate-pulse"
                        : "bg-amber-950/80 text-amber-400 border border-amber-800/50"
                    }`}
                  >
                    {selectedReport.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Assigned Division</span>
                    <span className="text-white font-medium block mt-1">{selectedReport.assignedDept}</span>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Location coordinates</span>
                    <span className="text-electric-amber font-semibold block mt-1">
                      {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Speech transcript audits */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
                    Audit Trail: Original Regional Citizen Speech
                  </div>
                  <blockquote className="p-3 bg-slate-900/40 border-l-4 border-slate-600 rounded-r-xl text-slate-400 text-xs italic">
                    "{selectedReport.rawTranscript}"
                  </blockquote>

                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono pt-1">
                    Structured English Transcription (NLU)
                  </div>
                  <p className="text-slate-200 text-xs font-medium">
                    {selectedReport.englishTranslation}
                  </p>
                </div>

                {/* Social listening correlations */}
                {selectedReport.socialPosts && selectedReport.socialPosts.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-electric-amber" />
                      Social Media Shadow Signals Checked ({selectedReport.socialPosts.length})
                    </div>
                    <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                      {selectedReport.socialPosts.map((post, i) => (
                        <div key={i} className="bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-lg text-xs">
                          <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                            <span className="text-electric-amber font-semibold">{post.handle}</span>
                            <span>{post.date}</span>
                          </div>
                          <p className="text-slate-400 italic">"{post.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3">
                {selectedReport.status !== "resolved" ? (
                  <>
                    <button
                      onClick={() => onResolveReport(selectedReport.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-header font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Mark Issue as RESOLVED
                    </button>
                    <button className="flex-1 bg-transparent border border-slate-700 text-slate-400 font-header font-bold text-xs py-2.5 px-4 rounded-xl hover:text-white hover:border-slate-500 active:scale-95 transition-all">
                      Request Field Verification
                    </button>
                  </>
                ) : (
                  <div className="w-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 py-3 px-4 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Issue Successfully Resolved. Notification Sent to Citizens.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 text-center">
              <Landmark className="w-12 h-12 text-slate-700 mb-2 stroke-[1.5]" />
              <h4 className="font-header text-base text-slate-400 font-bold">
                Select a Ticket from the Queue
              </h4>
              <p className="text-xs max-w-[200px] mt-1 leading-relaxed">
                Review complete digital dossiers including speech records, AI landmarks, and social proof.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
