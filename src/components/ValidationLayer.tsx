import React, { useState } from "react";
import { ThumbsUp, AlertTriangle, Image as ImageIcon, CheckCircle, Sparkles, AlertCircle } from "lucide-react";
import { CivicReport } from "../types";
import { motion } from "motion/react";

interface ValidationLayerProps {
  reports: CivicReport[];
  onValidate: (id: string) => void;
}

export default function ValidationLayer({ reports, onValidate }: ValidationLayerProps) {
  const [photoAddedReportId, setPhotoAddedReportId] = useState<string | null>(null);

  // Filter reports that need confirmation
  const unconfirmed = reports.filter((r) => r.status === "needs_confirmation").slice(0, 4);

  const handleAddPhotoSimulate = (reportId: string) => {
    setPhotoAddedReportId(reportId);
    setTimeout(() => {
      setPhotoAddedReportId(null);
      // Automatically triggers a validation citation as well
      onValidate(reportId);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-[10px] font-bold tracking-widest text-civic-teal uppercase bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          Citizen Verification Layer
        </span>
        <h2 className="font-header text-3xl font-extrabold text-slate-900 mt-3">
          Validate <span className="text-civic-teal">Community Shadow Issues</span>
        </h2>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          These issues have high social signal online but require physical citations from local citizens to verify them for official department SLAs.
        </p>
      </div>

      {unconfirmed.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 max-w-md mx-auto shadow-sm">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h4 className="font-semibold text-slate-800">All Shadow Issues Verified!</h4>
          <p className="text-xs mt-1">Every active report has been formally cataloged. Good work, community!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {unconfirmed.map((report) => {
            const citationsNeeded = 3;
            const progressPercent = Math.min((report.citations / citationsNeeded) * 100, 100);

            return (
              <div
                key={report.id}
                className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-civic-teal flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {report.socialSignalCount}+ Social Mentions
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono">#{report.id}</span>
                  </div>

                  <h3 className="font-header text-lg font-bold text-civic-teal mt-3">
                    {report.issueType} near {report.landmark}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 italic leading-relaxed">
                    "{report.englishTranslation}"
                  </p>
                  <p className="text-slate-400 text-[10px] font-medium mt-2">
                    Location context: {report.locationContext}
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Validation Progress</span>
                      <span>
                        {report.citations} / {citationsNeeded} Citations
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                      <div
                        className="h-full bg-electric-amber transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {report.citations >= citationsNeeded ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Escalated to Active SLA Department
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        Needs {citationsNeeded - report.citations} more verified citizen citations to lock SLA.
                      </span>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => onValidate(report.id)}
                      className="flex-1 bg-slate-100 hover:bg-civic-teal hover:text-white border border-slate-200 text-slate-700 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Confirm Issue
                    </button>

                    <button
                      onClick={() => handleAddPhotoSimulate(report.id)}
                      disabled={photoAddedReportId === report.id}
                      className="flex-1 border border-civic-teal hover:bg-teal-50 text-civic-teal py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      {photoAddedReportId === report.id ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3.5 h-3.5" />
                          Upload Photo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
