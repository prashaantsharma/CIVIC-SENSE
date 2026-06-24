import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, AlertCircle, Sparkles, Languages, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CivicReport } from "../types";

interface VoiceRecorderProps {
  onReportCreated: (report: CivicReport, isDuplicate: boolean) => void;
  userCity: string;
}

const PRESETS = [
  {
    id: "hindi",
    label: "Hindi (हिंदी)",
    text: "बांद्रा स्टेशन के बाहर जो लाल मंदिर है, वहाँ कचरा पड़ा है तीन दिन से और बहुत बुरी बदबू आ रही है।",
    translation: "There is garbage outside Bandra station near the red temple for three days and it's smelling very bad.",
    meaning: "Solid Waste near Bandra Station"
  },
  {
    id: "marathi",
    label: "Marathi (मराठी)",
    text: "दादर पश्चिमच्या शिवाजी पार्कजवळ रस्ता पूर्णपणे खचला आहे, खूप मोठा खड्डा पडला आहे.",
    translation: "The road near Shivaji Park in Dadar West has completely sunk, and there is a very large pothole.",
    meaning: "Pothole at Shivaji Park, Dadar"
  },
  {
    id: "tamil",
    label: "Tamil (தமிழ்)",
    text: "சென்னை அண்ணா நகர் மெயின் ரோட்டில் குடிநீர் குழாய் உடைந்து தண்ணீர் வீணாக ஓடுகிறது.",
    translation: "In Chennai Anna Nagar Main Road, the drinking water pipe has burst and water is running to waste.",
    meaning: "Water Pipe Burst in Chennai"
  },
  {
    id: "bengali",
    label: "Bengali (বাংলা)",
    text: "হাওড়া ব্রিজের কাছে ল্যাম্পপোস্টটা কাজ করছে না, রাতে খুব অন্ধকার থাকে।",
    translation: "The lamppost near Howrah Bridge is not working, it's very dark at night.",
    meaning: "Broken Streetlight near Howrah Bridge"
  }
];

export default function VoiceRecorder({ onReportCreated, userCity }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check mic permission on mount
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setMicPermission(true))
      .catch(() => setMicPermission(false));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    setRecordTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        await uploadAudio(audioBlob);
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Failed to access microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Audio = base64data.split(",")[1];

        const response = await fetch("/api/report/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Audio,
            userCity,
          }),
        });

        if (!response.ok) throw new Error("Server error parsing audio");

        const result = await response.json();
        if (result.success) {
          if (result.isDuplicate) {
            onReportCreated({ id: result.mergedId } as CivicReport, true);
          } else {
            onReportCreated(result.report, false);
          }
        } else {
          throw new Error("Failed to extract civic data");
        }
      };
    } catch (err: any) {
      setError(err.message || "An error occurred during audio processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePresetClick = async (preset: typeof PRESETS[0]) => {
    setIsProcessing(true);
    setError(null);
    setActivePreset(preset.id);

    try {
      const response = await fetch("/api/report/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: preset.text,
          isPreset: true,
          presetLanguage: preset.id,
          userCity: preset.id === "bengali" ? "Kolkata" : preset.id === "tamil" ? "Chennai" : "Mumbai",
        }),
      });

      if (!response.ok) throw new Error("Server failed to parse preset NLU");

      const result = await response.json();
      if (result.success) {
        if (result.isDuplicate) {
          onReportCreated({ id: result.mergedId } as CivicReport, true);
        } else {
          onReportCreated(result.report, false);
        }
      } else {
        throw new Error("Failed to process NLU for preset");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred processing the preset.");
    } finally {
      setIsProcessing(false);
      setActivePreset(null);
    }
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Left: Active mic interaction area */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-xl border border-slate-700/50 relative overflow-hidden min-h-[280px]">
          {/* Subtle background waves if recording */}
          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <span className="w-32 h-32 rounded-full bg-red-500 animate-ping absolute" />
              <span className="w-48 h-48 rounded-full bg-red-500 animate-pulse absolute" />
            </div>
          )}

          <h3 className="font-header text-xl text-white font-semibold mb-2">
            Speak to File a Report
          </h3>
          <p className="text-slate-400 text-xs text-center mb-6 max-w-xs">
            Hold/Press to record your issue. Speak naturally in Hindi, Marathi, Tamil, Bengali, or English.
          </p>

          <div className="relative z-10 flex flex-col items-center">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative border-4 ${
                isRecording
                  ? "bg-red-600 border-white text-white shadow-red-500/50 shadow-2xl scale-110"
                  : isProcessing
                  ? "bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-civic-teal hover:bg-civic-teal-light border-electric-amber text-electric-amber hover:scale-105"
              }`}
              disabled={isProcessing}
            >
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div
                    key="recording"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    className="flex flex-col items-center"
                  >
                    <Square className="w-8 h-8 fill-white mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Release</span>
                  </motion.div>
                ) : isProcessing ? (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <Sparkles className="w-8 h-8 animate-spin text-electric-amber mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Parsing AI</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    className="flex flex-col items-center"
                  >
                    <Mic className="w-10 h-10 mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Hold & Speak</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {isRecording && (
              <div className="mt-4 text-red-400 font-mono text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                Recording: {formatTime(recordTime)}
              </div>
            )}

            {isProcessing && (
              <div className="mt-4 text-slate-300 text-xs flex items-center gap-2 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-electric-amber animate-bounce" />
                Gemini NLU converting regional speech...
              </div>
            )}
          </div>

          {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-950/40 border border-red-500/30 rounded-lg p-2 flex items-start gap-2 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right: Vernacular preset simulations */}
        <div className="w-full md:w-1/2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Languages className="w-5 h-5 text-electric-amber" />
              <h4 className="text-white font-header text-lg font-medium">
                No Mic? Try Vernacular Presets
              </h4>
            </div>
            <p className="text-slate-400 text-xs mb-4">
              Click any regional voice input below to simulate a real citizen speaking to our Gemini multilingual NLU engine.
            </p>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {PRESETS.map((preset) => {
                const isPresetProcessing = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset)}
                    disabled={isProcessing}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs relative overflow-hidden ${
                      isPresetProcessing
                        ? "bg-civic-teal border-electric-amber text-white"
                        : "bg-slate-900/40 border-slate-700/60 text-slate-300 hover:border-slate-500 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-electric-amber">{preset.label}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {preset.meaning}
                      </span>
                    </div>
                    <p className="font-medium text-white italic truncate pr-8">
                      "{preset.text}"
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      Translation: {preset.translation}
                    </p>

                    {isPresetProcessing && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Sparkles className="w-4 h-4 text-electric-amber animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Microphone Permission: {micPermission === true ? "Granted" : micPermission === false ? "Denied" : "Checking..."}
            </span>
            <span className="text-electric-amber font-mono">Gemini 3.5 Triage Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
