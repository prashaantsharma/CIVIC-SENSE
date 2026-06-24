import React, { useState, useEffect } from "react";
import { Building2, Globe, Sparkles, Megaphone, ShieldCheck, Heart, AlertCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CivicReport, LeaderboardStats } from "./types";
import VoiceRecorder from "./components/VoiceRecorder";
import ShadowMap from "./components/ShadowMap";
import ValidationLayer from "./components/ValidationLayer";
import Leaderboard from "./components/Leaderboard";
import AuthorityConsole from "./components/AuthorityConsole";

export default function App() {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardStats[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [userCity, setUserCity] = useState("Mumbai");
  const [isLoading, setIsLoading] = useState(true);
  const [isScanningSocial, setIsScanningSocial] = useState(false);
  const [socialAlert, setSocialAlert] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const reportsRes = await fetch("/api/reports");
      const reportsData = await reportsRes.json();
      setReports(reportsData);

      const statsRes = await fetch("/api/leaderboard");
      const statsData = await statsRes.json();
      setLeaderboard(statsData);

      // Default selected report to the first one
      if (reportsData.length > 0 && !selectedReportId) {
        setSelectedReportId(reportsData[0].id);
      }
    } catch (error) {
      console.error("Error loading full-stack data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Callback when a citizen creates/triggers a report
  const handleReportCreated = (newReport: CivicReport, isDuplicate: boolean) => {
    fetchData(); // reload
    if (isDuplicate) {
      triggerToast("Linguistic NLU matched duplicate active report. Citations increased!");
      setSelectedReportId(newReport.id);
    } else {
      triggerToast("AI Triage successful! Voice report converted to structured civic ticket.");
      setSelectedReportId(newReport.id);
    }
  };

  // Callback for citizen citations/upvotes
  const handleValidateReport = async (id: string) => {
    try {
      const response = await fetch("/api/report/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        triggerToast("Citations recorded. SLA prioritizations updated.");
        fetchData();
      }
    } catch (error) {
      console.error("Failed to upvote citation:", error);
    }
  };

  // Callback to resolve a report (Authority Console)
  const handleResolveReport = async (id: string) => {
    try {
      const response = await fetch("/api/report/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        triggerToast("Ticket successfully resolved. Leaderboard scores recalculated!");
        fetchData();
      }
    } catch (error) {
      console.error("Failed to resolve ticket:", error);
    }
  };

  // Trigger social media feed scanning
  const handleScanSocial = async () => {
    setIsScanningSocial(true);
    setSocialAlert(null);

    try {
      const response = await fetch("/api/social/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const result = await response.json();
        setSocialAlert(result.text);
        if (result.isDuplicate) {
          triggerToast("Social scanner matched complaint with active issue. Social Pressure score boosted!");
          setSelectedReportId(result.mergedId);
        } else {
          triggerToast("Social listening captured a new unregistered 'Shadow Issue'!");
          setSelectedReportId(result.report.id);
        }
        fetchData();
      }
    } catch (error) {
      console.error("Failed to scan social:", error);
    } finally {
      setIsScanningSocial(false);
    }
  };

  // Calculate dynamic stats for the Bento widgets
  const totalReports = reports.length;
  const totalResolved = reports.filter((r) => r.status === "resolved").length;
  const totalPending = reports.filter((r) => r.status === "assigned" || r.status === "needs_confirmation").length;
  const totalCitations = reports.reduce((acc, curr) => acc + curr.citations, 0);

  const avgResolveTime = leaderboard.length > 0
    ? (leaderboard.reduce((acc, curr) => acc + curr.avg_resolve_time_hours, 0) / leaderboard.length).toFixed(1)
    : "14.2";

  const overallScore = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((acc, curr) => acc + curr.performance_rank, 0) / leaderboard.length)
    : 82;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col relative">
      
      {/* Toast Notification HUD */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-electric-amber/40 text-white px-6 py-3 rounded-full flex items-center gap-2.5 shadow-2xl"
            style={{ boxShadow: "0 10px 30px rgba(255, 191, 0, 0.15)" }}
          >
            <Sparkles className="w-4 h-4 text-electric-amber animate-pulse" />
            <span className="text-xs font-semibold tracking-wide uppercase">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          TOP SANDWICH: DARK CAP HEADER
          ========================================================================= */}
      <header className="bg-civic-teal border-b-4 border-electric-amber relative overflow-hidden py-8 px-6 sm:px-10 shadow-lg shrink-0">
        <div className="absolute inset-0 bg-radial-gradient from-teal-900/40 to-transparent opacity-60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-800/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          
          {/* Logo & Platform Info */}
          <div className="flex flex-col">
            <h1 className="font-header text-4xl font-bold text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-8 h-8 text-electric-amber" />
              CIVIC SENSE
            </h1>
            <span className="text-teal-100/70 text-xs font-semibold uppercase tracking-widest mt-1">
              Vernacular AI Governance Engine
            </span>
          </div>

          {/* System Metrics and Quick Controls */}
          <div className="flex flex-wrap gap-6 items-center w-full md:w-auto justify-between md:justify-end">
            
            {/* System Status */}
            <div className="text-left md:text-right">
              <p className="text-teal-200 text-[10px] uppercase font-mono font-bold tracking-wider">System Status</p>
              <p className="text-white font-bold flex items-center gap-1.5 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active • Regional NLU v2.4
              </p>
            </div>

            <div className="h-10 w-[1px] bg-teal-700 hidden sm:block"></div>

            {/* Quick Metrics Bento Boxes */}
            <div className="flex gap-3">
              <div className="bg-teal-950/50 p-2.5 rounded-xl border border-teal-700/60 shadow-inner flex flex-col justify-center min-w-[100px]">
                <p className="text-[10px] text-teal-300 uppercase font-mono tracking-wider">Total Active</p>
                <p className="text-xl font-bold text-white leading-none mt-1">{totalReports}</p>
              </div>
              <div className="bg-teal-950/50 p-2.5 rounded-xl border border-teal-700/60 shadow-inner flex flex-col justify-center min-w-[100px]">
                <p className="text-[10px] text-teal-300 uppercase font-mono tracking-wider">Citations</p>
                <p className="text-xl font-bold text-teal-200 leading-none mt-1">{totalCitations}</p>
              </div>
              <div className="bg-teal-950/50 p-2.5 rounded-xl border border-teal-700/60 shadow-inner flex flex-col justify-center min-w-[100px]">
                <p className="text-[10px] text-teal-300 uppercase font-mono tracking-wider">Resolved</p>
                <p className="text-xl font-bold text-electric-amber leading-none mt-1">{totalResolved}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MIDDLE SANDWICH: LIGHT BENTO GRID WORKSPACE
          ========================================================================= */}
      <main className="bg-slate-100 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 flex-1 relative">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Controls inside Light Workspace */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
            <div>
              <span className="text-[10px] text-civic-teal font-extrabold uppercase tracking-widest font-mono bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/50">
                Linguistic Control Center
              </span>
              <p className="text-slate-500 text-xs mt-1.5">
                Connecting multi-dialect voices with verified geolocation mapping nodes.
              </p>
            </div>

            {/* City selection context */}
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="px-3 py-1.5 font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <Globe className="w-3.5 h-3.5 text-civic-teal" /> Region Focus:
              </span>
              {(["Mumbai", "Chennai", "Kolkata"] as const).map((city) => (
                <button
                  key={city}
                  onClick={() => setUserCity(city)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    userCity === city
                      ? "bg-civic-teal text-white shadow font-extrabold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Core Bento Grid (12-Columns) */}
          <div className="grid grid-cols-12 gap-6">

            {/* Bento Cell 1: Narrative & AI Triage Overview (col-span-12 lg:col-span-4) */}
            <div className="col-span-12 lg:col-span-4 bg-civic-teal text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden border-2 border-slate-200/15">
              {/* Subtle background art */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-800/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-electric-amber/10 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <span className="bg-electric-amber text-civic-teal-dark text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider font-mono">
                  GEMINI NLU CAPABILITY
                </span>
                <h2 className="font-header text-3xl font-extrabold leading-tight text-white mt-2">
                  No English? <br />
                  <span className="text-electric-amber">Just Hold & Speak.</span>
                </h2>
                <p className="text-teal-100/80 text-xs leading-relaxed">
                  Over 80% of Indian citizens cannot comfortably file written civic complaints in English. Civic-Sense bridges this gap, translating regional voices into structured digital governance.
                </p>
              </div>

              <div className="space-y-3 pt-6 border-t border-teal-800/50 mt-6 relative z-10">
                <div className="flex items-center gap-2.5 text-xs text-teal-200 font-semibold">
                  <ShieldCheck className="w-4.5 h-4.5 text-electric-amber shrink-0" />
                  <span>Multilingual Speech Translation</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-teal-200 font-semibold">
                  <Heart className="w-4.5 h-4.5 text-electric-amber shrink-0" />
                  <span>AI Geolocation Triangulation</span>
                </div>
              </div>
            </div>

            {/* Bento Cell 2: Voice Input Hub (col-span-12 lg:col-span-8) */}
            <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden flex flex-col justify-center">
              <VoiceRecorder onReportCreated={handleReportCreated} userCity={userCity} />
            </div>

            {/* Bento Cell 3: Live Shadow-Issue Map (col-span-12 lg:col-span-8) */}
            <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
              <ShadowMap
                reports={reports}
                selectedReportId={selectedReportId}
                onSelectReport={setSelectedReportId}
                onValidateReport={handleValidateReport}
              />
            </div>

            {/* Bento Cell 4: Accountability Performance Rating (col-span-12 lg:col-span-4) */}
            <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl shadow-lg border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-civic-teal font-extrabold uppercase tracking-widest font-mono bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/50">
                  Accountability Stats
                </span>
                
                <h3 className="font-header text-2xl font-bold text-civic-teal mt-4 mb-3">
                  Accountability Score
                </h3>
                
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-electric-amber leading-none">
                    {overallScore}
                  </span>
                  <span className="text-xs text-slate-400 font-bold pb-1 uppercase tracking-wider">
                    / 100 Performance
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                      <span className="text-slate-400">Resolve Time</span>
                      <span className="text-slate-900 font-mono font-bold">{avgResolveTime} Hours</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                      <div className="h-full bg-civic-teal rounded-full" style={{ width: "75%" }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                      <span className="text-slate-400">Citizen Satisfaction</span>
                      <span className="text-slate-900 font-bold">High (4.8/5)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                      <div className="h-full bg-electric-amber rounded-full" style={{ width: "90%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
                Reflected index aggregates regional resolve efficiency, ticket duplicates, and citizen voting verification counts in real-time.
              </div>
            </div>

            {/* Bento Cell 5: Validation Cards (col-span-12) */}
            <div className="col-span-12 bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
              <ValidationLayer reports={reports} onValidate={handleValidateReport} />
            </div>

          </div>
        </div>
      </main>

      {/* =========================================================================
          BOTTOM SANDWICH: DARK COMMANDS AND LEADERBOARDS
          ========================================================================= */}
      <footer className="bg-slate-950 border-t-2 border-slate-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-12 gap-6">
            
            {/* Bento Cell 6: Authority Control Command Center (col-span-12 lg:col-span-8) */}
            <div className="col-span-12 lg:col-span-8">
              <AuthorityConsole
                reports={reports}
                selectedReportId={selectedReportId}
                onSelectReport={setSelectedReportId}
                onResolveReport={handleResolveReport}
                onScanSocial={handleScanSocial}
                isScanning={isScanningSocial}
                socialAlert={socialAlert}
              />
            </div>

            {/* Bento Cell 7: Public Ward Leaderboard (col-span-12 lg:col-span-4) */}
            <div className="col-span-12 lg:col-span-4">
              <Leaderboard stats={leaderboard} />
            </div>

          </div>

          {/* Footnotes */}
          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Civic-Sense Platform. Built with Google Gemini AI Studio for Indian Urban Reform.
            </div>
            <div className="flex gap-4 font-mono">
              <span>MODEL: GEMINI-3.5-FLASH</span>
              <span>•</span>
              <span>ARCHITECTURE: NODE + REACT BENTO GRID</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
