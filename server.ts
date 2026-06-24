import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up large limits for base64 audio uploading
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini API client safely
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is missing.");
}

const DATA_FILE = path.join(process.cwd(), "reports.json");

interface CivicReport {
  id: string;
  source: "voice_input" | "social_listening" | "whatsapp";
  status: "needs_confirmation" | "assigned" | "overdue" | "resolved";
  issueType: "Water Supply" | "Roads & Potholes" | "Sewage & Drainage" | "Solid Waste" | "Streetlights";
  rawTranscript: string;
  englishTranslation: string;
  locationContext: string;
  landmark: string;
  city: string;
  latitude: number;
  longitude: number;
  severity: number;
  socialSignalCount: number;
  socialPressureScore: number;
  createdAt: string;
  updatedAt: string;
  assignedDept: string;
  socialPosts?: Array<{ source: string; text: string; handle: string; date: string }>;
  citations: number;
  photoUrl?: string;
  slaDeadline: string;
}

// Initial seed data for a stunning hackathon demo
const DEFAULT_REPORTS: CivicReport[] = [
  {
    id: "rep-101",
    source: "voice_input",
    status: "assigned",
    issueType: "Roads & Potholes",
    rawTranscript: "दादर पश्चिमच्या शिवाजी पार्कजवळ रस्ता पूर्णपणे खचला आहे, खूप मोठा खड्डा पडला आहे.",
    englishTranslation: "The road near Shivaji Park in Dadar West has completely sunk, and there is a very large pothole.",
    locationContext: "Shivaji Park Road, Dadar West, Mumbai",
    landmark: "Shivaji Park",
    city: "Mumbai",
    latitude: 19.0264,
    longitude: 72.8373,
    severity: 4,
    socialSignalCount: 8,
    socialPressureScore: 68,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // 36 hours ago
    updatedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    assignedDept: "Roads & Highways Department",
    citations: 5,
    slaDeadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), // 12 hours left
    socialPosts: [
      { source: "Twitter/X", handle: "@dadar_citizen", text: "Gigantic pothole near Shivaji park gateway is a deathtrap for bikers! @mybmc please fix!", date: "1 day ago" },
      { source: "Twitter/X", handle: "@mumbairains", text: "Shivaji park road cave-in worsening with today's downpour. Avoid that lane.", date: "18 hours ago" }
    ]
  },
  {
    id: "rep-102",
    source: "social_listening",
    status: "needs_confirmation",
    issueType: "Sewage & Drainage",
    rawTranscript: "The gutter near Bandra station is overflowing again, dirty water entering shops 😤 @mybmc drainage team help",
    englishTranslation: "The gutter near Bandra station is overflowing again, dirty water entering shops.",
    locationContext: "Outside Bandra West Railway Station, Mumbai",
    landmark: "Bandra West Station",
    city: "Mumbai",
    latitude: 19.0544,
    longitude: 72.8402,
    severity: 5,
    socialSignalCount: 24,
    socialPressureScore: 88,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    assignedDept: "Sewage & Drainage Division",
    citations: 1,
    slaDeadline: new Date(Date.now() + 46 * 3600 * 1000).toISOString(),
    socialPosts: [
      { source: "Twitter/X", handle: "@bandranews", text: "Unbearable smell at Bandra station west. Overflowing sewage on the walking path. BMC wake up!", date: "2 hours ago" },
      { source: "Twitter/X", handle: "@mumbaipedestrian", text: "Slipped on sewage sludge near Bandra station. This is a civic hazard!", date: "1 hour ago" }
    ]
  },
  {
    id: "rep-103",
    source: "whatsapp",
    status: "overdue",
    issueType: "Water Supply",
    rawTranscript: "हमारे इलाके लाल मन्दिर के पास एस.वी. रोड पर पिछले तीन दिनों से पानी की पाइप लाइन फटी हुई है और पानी बह रहा है।",
    englishTranslation: "The water pipeline has been burst and water is flowing for the last three days on SV Road near our area's Red Temple.",
    locationContext: "SV Road, near Red Temple, Bandra West, Mumbai",
    landmark: "Red Temple",
    city: "Mumbai",
    latitude: 19.0602,
    longitude: 72.8358,
    severity: 4,
    socialSignalCount: 15,
    socialPressureScore: 74,
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(), // 72 hours ago (SLA is 48 hours, so overdue!)
    updatedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    assignedDept: "Hydraulics & Water Supply Department",
    citations: 14,
    slaDeadline: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // SLA breached 24 hours ago
    socialPosts: [
      { source: "Twitter/X", handle: "@water_saver_in", text: "Gallons of pure drinking water wasted daily near Bandra's Red Temple due to pipe burst. Unbelievable.", date: "2 days ago" },
      { source: "Facebook", handle: "Bandra Community Group", text: "No water pressure in our taps since Monday because of the main pipeline leak on SV Road. Reported 10 times.", date: "1 day ago" }
    ]
  },
  {
    id: "rep-104",
    source: "voice_input",
    status: "resolved",
    issueType: "Streetlights",
    rawTranscript: "हावड़ा ब्रिज के पास पिछले एक हफ्ते से स्ट्रीट लाइट बंद पड़ी है, रात को बहुत अंधेरा हो जाता है जिससे दुर्घटना का डर बना रहता है।",
    englishTranslation: "The street light near Howrah Bridge has been broken for the last week, it gets very dark at night causing fear of accidents.",
    locationContext: "Howrah Bridge Approach Road, Kolkata",
    landmark: "Howrah Bridge",
    city: "Kolkata",
    latitude: 22.5851,
    longitude: 88.3416,
    severity: 3,
    socialSignalCount: 4,
    socialPressureScore: 40,
    createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    assignedDept: "Electricity & Public Lighting Division",
    citations: 2,
    slaDeadline: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    socialPosts: []
  }
];

// Load reports from JSON file or seed if empty
function readReports(): CivicReport[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading data file:", error);
  }
  // Write default seed data if file doesn't exist
  writeReports(DEFAULT_REPORTS);
  return DEFAULT_REPORTS;
}

function writeReports(reports: CivicReport[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing data file:", error);
  }
}

// Function to calculate Social Pressure Score:
// Score = (Severity * 12) + Math.min(socialSignalCount / 20, 1) * 40
function calculateScore(severity: number, socialSignals: number): number {
  const severityPart = severity * 12; // up to 60
  const socialPart = Math.min(socialSignals / 20, 1) * 40; // up to 40
  return Math.round(severityPart + socialPart);
}

// Map issue type to department
function getDepartment(issueType: string): string {
  switch (issueType) {
    case "Water Supply":
      return "Hydraulics & Water Supply Department";
    case "Roads & Potholes":
      return "Roads & Highways Department";
    case "Sewage & Drainage":
      return "Sewage & Drainage Division";
    case "Solid Waste":
      return "Solid Waste Management Ward";
    case "Streetlights":
      return "Electricity & Public Lighting Division";
    default:
      return "General Municipal Ward Office";
  }
}

// --- API ROUTES ---

// 1. Get all reports
app.get("/api/reports", (req, res) => {
  const reports = readReports();
  // Check SLAs dynamically and mark as 'overdue' if deadline has passed and not resolved
  const updatedReports = reports.map(r => {
    if (r.status !== "resolved" && r.status !== "overdue" && new Date(r.slaDeadline) < new Date()) {
      r.status = "overdue";
    }
    return r;
  });
  writeReports(updatedReports);
  res.json(updatedReports);
});

// 2. Submit voice / text report
app.post("/api/report/voice", async (req, res) => {
  const { transcript, audioBase64, isPreset, presetLanguage, userCity = "Mumbai" } = req.body;

  let finalTranscript = transcript || "";

  // 1. If audio base64 is provided (from microphone), we can let Gemini process it!
  if (audioBase64 && ai) {
    try {
      console.log("Processing base64 audio with Gemini...");
      const audioPart = {
        inlineData: {
          mimeType: "audio/webm", // WebM is recorded by browser MediaRecorder
          data: audioBase64,
        },
      };

      const modelResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          audioPart,
          {
            text: `You are the Civic Sense Voice Assistant. 
Analyze the spoken audio in regional Indian languages (Hindi, Marathi, Tamil, Bengali, etc.).
1. Transcribe the audio verbatim in its original script.
2. Translate the audio accurately into English.
3. Detect the main issue type (Must be one of: "Water Supply", "Roads & Potholes", "Sewage & Drainage", "Solid Waste", "Streetlights").
4. Extract the location cues or landmarks mentioned.
5. Rate severity from 1 (lowest) to 5 (highest, dangerous or flooding or health hazard).
6. Estimate the precise landmarks.

Return your response strictly in JSON format as follows:
{
  "transcription": "Verbatim transcript in original regional script",
  "englishTranslation": "English translation",
  "issueType": "One of the 5 categories listed",
  "locationContext": "A descriptive, clear address format using the landmarks and city",
  "landmark": "Specific landmark extracted",
  "severity": 1-5 number
}`,
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(modelResponse.text || "{}");
      console.log("Gemini parsed audio:", parsed);
      
      finalTranscript = parsed.transcription || finalTranscript;
      req.body.parsedData = parsed;
    } catch (error) {
      console.error("Gemini failed to parse raw audio, falling back to text simulation", error);
    }
  }

  // 2. Run NLU parsing using Gemini on the text transcript
  if (ai) {
    try {
      console.log("Running NLU parsing on transcript:", finalTranscript);
      const prompt = `You are the Civic-Sense AI Triage Core.
Take this regional/Indian-English civic complaint: "${finalTranscript}"
Assume the context is in the city of: ${userCity}.

Tasks:
1. Detect the Issue Category (Must be exactly one of: "Water Supply", "Roads & Potholes", "Sewage & Drainage", "Solid Waste", "Streetlights").
2. Translate accurately to professional English.
3. Extract any specific landmark (e.g., "Shivaji Park", "Red Temple", "Bandra Station", "Howrah Bridge", "Main Road").
4. Formulate a full structured location context (e.g. "near Red Temple, SV Road, Bandra West, Mumbai").
5. Gauge the severity score from 1 (minor issue) to 5 (extreme hazard like toxic overflow, major accident risk, flooding, pipe burst).
6. Provide highly realistic geographic latitude and longitude coordinates centering on Mumbai/India (roughly latitude: 19.0 to 19.15, longitude: 72.8 to 72.9) or corresponding to the city context if specified. Be extremely specific.

Output STRICTLY as JSON with this schema:
{
  "issueType": "string",
  "englishTranslation": "string",
  "locationContext": "string",
  "landmark": "string",
  "severity": number,
  "latitude": number,
  "longitude": number
}`;

      const nluResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const structuredResult = JSON.parse(nluResponse.text || "{}");
      console.log("NLU structured results:", structuredResult);

      const reports = readReports();

      // Check for semantic duplicates among active reports
      console.log("Checking for duplicates...");
      let isDuplicate = false;
      let duplicateId = "";

      // Gemini Deduplication Check
      if (reports.length > 0) {
        const activeReportsSummary = reports
          .filter(r => r.status !== "resolved")
          .map(r => `ID: ${r.id}, Type: ${r.issueType}, Landmark: ${r.landmark}, Location: ${r.locationContext}, Desc: ${r.englishTranslation}`)
          .join("\n");

        const dupPrompt = `You are a deduplication engine. We have a new civic report and a list of existing active reports.
New Report:
Type: ${structuredResult.issueType}
Landmark: ${structuredResult.landmark}
Location: ${structuredResult.locationContext}
Description: ${structuredResult.englishTranslation}

Existing Active Reports:
${activeReportsSummary}

Question: Is the new report a duplicate of or referring to the exact same issue as one of the existing reports?
(Look for similar location, landmark, and issue category. E.g. sewage overflow at the same station or pipe leak at the same temple are duplicates, even if described differently or in a different language).

Output STRICTLY as JSON:
{
  "isDuplicate": boolean,
  "duplicateId": "string or empty if no duplicate found"
}`;

        const dupResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: dupPrompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const dupResult = JSON.parse(dupResponse.text || "{}");
        if (dupResult.isDuplicate && dupResult.duplicateId) {
          isDuplicate = true;
          duplicateId = dupResult.duplicateId;
          console.log(`Duplicate found! Merging with report: ${duplicateId}`);
        }
      }

      if (isDuplicate) {
        // Increment social signals & pressure score for existing report
        const updatedReports = reports.map(r => {
          if (r.id === duplicateId) {
            r.socialSignalCount += 1;
            r.socialPressureScore = calculateScore(r.severity, r.socialSignalCount);
            r.citations += 1;
            r.updatedAt = new Date().toISOString();
            if (!r.socialPosts) r.socialPosts = [];
            r.socialPosts.push({
              source: "Citizen Voice",
              handle: "@citizen_voice",
              text: `Another verbal report received: "${structuredResult.englishTranslation}"`,
              date: "Just now"
            });
          }
          return r;
        });
        writeReports(updatedReports);
        return res.json({ success: true, isDuplicate: true, mergedId: duplicateId });
      } else {
        // Create a new report
        const newReportId = `rep-${Date.now()}`;
        const newReport: CivicReport = {
          id: newReportId,
          source: "voice_input",
          status: "needs_confirmation",
          issueType: structuredResult.issueType || "Roads & Potholes",
          rawTranscript: finalTranscript,
          englishTranslation: structuredResult.englishTranslation || finalTranscript,
          locationContext: structuredResult.locationContext || `${userCity}, India`,
          landmark: structuredResult.landmark || "General Area",
          city: userCity,
          latitude: structuredResult.latitude || (19.0760 + (Math.random() - 0.5) * 0.05),
          longitude: structuredResult.longitude || (72.8777 + (Math.random() - 0.5) * 0.05),
          severity: structuredResult.severity || 3,
          socialSignalCount: 1,
          socialPressureScore: calculateScore(structuredResult.severity || 3, 1),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedDept: getDepartment(structuredResult.issueType),
          citations: 1,
          slaDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(), // 48-hour SLA
          socialPosts: []
        };

        reports.unshift(newReport);
        writeReports(reports);
        return res.json({ success: true, isDuplicate: false, report: newReport });
      }
    } catch (error) {
      console.error("Gemini NLU parsing error:", error);
    }
  }

  // Backup offline/simulated fallback parsing in case Gemini API is not working or fails
  console.log("Using local heuristic parsing fallback...");
  const lowerTranscript = finalTranscript.toLowerCase();
  let detectedType: CivicReport["issueType"] = "Roads & Potholes";
  let fallbackSeverity = 3;
  let landmark = "Main Road";
  let location = "Bandra West, Mumbai";
  let lat = 19.0544;
  let lng = 72.8402;

  if (lowerTranscript.includes("pani") || lowerTranscript.includes("water") || lowerTranscript.includes("pipe") || lowerTranscript.includes("leak")) {
    detectedType = "Water Supply";
    fallbackSeverity = 4;
    landmark = "Red Temple";
    location = "SV Road, near Red Temple, Bandra West, Mumbai";
    lat = 19.0602;
    lng = 72.8358;
  } else if (lowerTranscript.includes("gutter") || lowerTranscript.includes("sewage") || lowerTranscript.includes("drainage") || lowerTranscript.includes("नाला")) {
    detectedType = "Sewage & Drainage";
    fallbackSeverity = 5;
    landmark = "Bandra West Station";
    location = "Station Road, Bandra West, Mumbai";
    lat = 19.0544;
    lng = 72.8402;
  } else if (lowerTranscript.includes("kachra") || lowerTranscript.includes("garbage") || lowerTranscript.includes("waste") || lowerTranscript.includes("gandagi")) {
    detectedType = "Solid Waste";
    fallbackSeverity = 3;
    landmark = "Vegetable Market";
    location = "Link Road, Bandra West, Mumbai";
    lat = 19.0625;
    lng = 72.8335;
  } else if (lowerTranscript.includes("light") || lowerTranscript.includes("andhera") || lowerTranscript.includes("dark") || lowerTranscript.includes("lamp")) {
    detectedType = "Streetlights";
    fallbackSeverity = 2;
    landmark = "Metro Station Pillar 45";
    location = "Andheri Kurla Road, Mumbai";
    lat = 19.1154;
    lng = 72.8727;
  }

  const reports = readReports();
  const newReportId = `rep-${Date.now()}`;
  const newReport: CivicReport = {
    id: newReportId,
    source: "voice_input",
    status: "needs_confirmation",
    issueType: detectedType,
    rawTranscript: finalTranscript,
    englishTranslation: `Transcribed & parsed: "${finalTranscript}"`,
    locationContext: location,
    landmark: landmark,
    city: userCity,
    latitude: lat + (Math.random() - 0.5) * 0.01,
    longitude: lng + (Math.random() - 0.5) * 0.01,
    severity: fallbackSeverity,
    socialSignalCount: 1,
    socialPressureScore: calculateScore(fallbackSeverity, 1),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedDept: getDepartment(detectedType),
    citations: 1,
    slaDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    socialPosts: []
  };

  reports.unshift(newReport);
  writeReports(reports);
  res.json({ success: true, isDuplicate: false, report: newReport, fallback: true });
});

// 3. Scan & Process Social Feed (Simulate new tweets coming in)
app.post("/api/social/scan", async (req, res) => {
  const mockTweets = [
    { text: "Bandra SV road sewage overflowing, absolutely disgusting smell near the mosque! BMC where are you?", handle: "@mumbai_clean", source: "Twitter/X" },
    { text: "Dadar Shivaji Park area pothole damaged my scooter wheel this morning 😡 Watch out guys", handle: "@biker_rahul", source: "Twitter/X" },
    { text: "Water pipe leaking in Bandra West near SV Road Red temple, fresh drinking water going down the drain! #SaveWater", handle: "@greencitizen", source: "Twitter/X" },
    { text: "Streetlights not working on Carter Road walkway, feel unsafe to walk at night @MumbaiPolice", handle: "@safetyfirst_mumbai", source: "Twitter/X" },
    { text: "Pile of rotting garbage near Hill Road market is attracting flies and stray dogs. Solid waste management failing.", handle: "@hillroad_resident", source: "Twitter/X" }
  ];

  // Pick a random tweet
  const selectedTweet = mockTweets[Math.floor(Math.random() * mockTweets.length)];

  if (ai) {
    try {
      console.log("Analyzing social post with Gemini NLU:", selectedTweet.text);
      const prompt = `You are the Civic-Sense Social Listening pipeline.
Analyze this tweet: "${selectedTweet.text}"
Assume the context is in Mumbai, India.

Extract:
1. Issue Category (One of: "Water Supply", "Roads & Potholes", "Sewage & Drainage", "Solid Waste", "Streetlights").
2. Standard english translation of issue.
3. Specific landmark and location cues.
4. Estimate logical coordinates in Mumbai (latitude: 19.0 to 19.15, longitude: 72.8 to 72.9).
5. Rate severity 1-5.

Output strictly as JSON:
{
  "issueType": "string",
  "englishTranslation": "string",
  "locationContext": "string",
  "landmark": "string",
  "severity": number,
  "latitude": number,
  "longitude": number
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const structuredResult = JSON.parse(response.text || "{}");
      console.log("Social Listening NLU result:", structuredResult);

      const reports = readReports();
      let isDuplicate = false;
      let duplicateId = "";

      // Deduplicate social complaint against existing active reports
      if (reports.length > 0) {
        const activeReportsSummary = reports
          .filter(r => r.status !== "resolved")
          .map(r => `ID: ${r.id}, Type: ${r.issueType}, Landmark: ${r.landmark}, Location: ${r.locationContext}, Desc: ${r.englishTranslation}`)
          .join("\n");

        const dupPrompt = `You are a deduplication engine. We have a new social media complaint and a list of active civic reports.
New Complaint:
Type: ${structuredResult.issueType}
Landmark: ${structuredResult.landmark}
Location: ${structuredResult.locationContext}
Description: ${structuredResult.englishTranslation}

Active Reports:
${activeReportsSummary}

Question: Is this social post talking about the exact same issue as one of the active reports?
Output strictly as JSON:
{
  "isDuplicate": boolean,
  "duplicateId": "string or empty"
}`;

        const dupResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: dupPrompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const dupResult = JSON.parse(dupResponse.text || "{}");
        if (dupResult.isDuplicate && dupResult.duplicateId) {
          isDuplicate = true;
          duplicateId = dupResult.duplicateId;
        }
      }

      if (isDuplicate) {
        // Merge! Increase social signals, which increases social pressure score
        const updatedReports = reports.map(r => {
          if (r.id === duplicateId) {
            r.socialSignalCount += 5; // Social media has multiplier effect
            r.socialPressureScore = calculateScore(r.severity, r.socialSignalCount);
            if (!r.socialPosts) r.socialPosts = [];
            r.socialPosts.unshift({
              source: selectedTweet.source,
              handle: selectedTweet.handle,
              text: selectedTweet.text,
              date: "Just now (Scanned)"
            });
            r.updatedAt = new Date().toISOString();
          }
          return r;
        });
        writeReports(updatedReports);
        return res.json({ success: true, isDuplicate: true, mergedId: duplicateId, text: selectedTweet.text });
      } else {
        // Create a new "Shadow Issue"
        const newId = `rep-shadow-${Date.now()}`;
        const newReport: CivicReport = {
          id: newId,
          source: "social_listening",
          status: "needs_confirmation",
          issueType: structuredResult.issueType || "Roads & Potholes",
          rawTranscript: selectedTweet.text,
          englishTranslation: structuredResult.englishTranslation || selectedTweet.text,
          locationContext: structuredResult.locationContext || "Mumbai, India",
          landmark: structuredResult.landmark || "General Landmark",
          city: "Mumbai",
          latitude: structuredResult.latitude || (19.0544 + (Math.random() - 0.5) * 0.04),
          longitude: structuredResult.longitude || (72.8402 + (Math.random() - 0.5) * 0.04),
          severity: structuredResult.severity || 3,
          socialSignalCount: 5, // Starts with some social strength
          socialPressureScore: calculateScore(structuredResult.severity || 3, 5),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedDept: getDepartment(structuredResult.issueType),
          citations: 0,
          slaDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          socialPosts: [
            { source: selectedTweet.source, handle: selectedTweet.handle, text: selectedTweet.text, date: "Just now (Scanned)" }
          ]
        };

        reports.unshift(newReport);
        writeReports(reports);
        return res.json({ success: true, isDuplicate: false, report: newReport, text: selectedTweet.text });
      }
    } catch (err) {
      console.error("Gemini failed on social scan:", err);
    }
  }

  // Fallback if Gemini not available
  const reports = readReports();
  const newId = `rep-shadow-${Date.now()}`;
  const newReport: CivicReport = {
    id: newId,
    source: "social_listening",
    status: "needs_confirmation",
    issueType: "Sewage & Drainage",
    rawTranscript: selectedTweet.text,
    englishTranslation: selectedTweet.text,
    locationContext: "Bandra Station Road, Mumbai",
    landmark: "Bandra Station",
    city: "Mumbai",
    latitude: 19.0544 + (Math.random() - 0.5) * 0.02,
    longitude: 72.8402 + (Math.random() - 0.5) * 0.02,
    severity: 4,
    socialSignalCount: 3,
    socialPressureScore: calculateScore(4, 3),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedDept: getDepartment("Sewage & Drainage"),
    citations: 0,
    slaDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    socialPosts: [
      { source: selectedTweet.source, handle: selectedTweet.handle, text: selectedTweet.text, date: "Just now" }
    ]
  };

  reports.unshift(newReport);
  writeReports(reports);
  res.json({ success: true, isDuplicate: false, report: newReport, text: selectedTweet.text, fallback: true });
});

// 4. Validate / Upvote a report (Community Citation)
app.post("/api/report/validate", (req, res) => {
  const { id } = req.body;
  const reports = readReports();
  let found = false;

  const updatedReports = reports.map(r => {
    if (r.id === id) {
      r.citations += 1;
      r.socialSignalCount += 2; // Citizen citation boosts signal
      r.socialPressureScore = calculateScore(r.severity, r.socialSignalCount);
      r.updatedAt = new Date().toISOString();
      // If it transitions from needs_confirmation to assigned because of high validation
      if (r.status === "needs_confirmation" && r.citations >= 3) {
        r.status = "assigned";
      }
      found = true;
    }
    return r;
  });

  if (found) {
    writeReports(updatedReports);
    res.json({ success: true, reports: updatedReports });
  } else {
    res.status(404).json({ error: "Report not found" });
  }
});

// 5. Assign to department or change status
app.post("/api/report/assign", (req, res) => {
  const { id, dept } = req.body;
  const reports = readReports();
  let found = false;

  const updatedReports = reports.map(r => {
    if (r.id === id) {
      r.status = "assigned";
      if (dept) r.assignedDept = dept;
      r.updatedAt = new Date().toISOString();
      found = true;
    }
    return r;
  });

  if (found) {
    writeReports(updatedReports);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Report not found" });
  }
});

// 6. Resolve a report
app.post("/api/report/resolve", (req, res) => {
  const { id } = req.body;
  const reports = readReports();
  let found = false;

  const updatedReports = reports.map(r => {
    if (r.id === id) {
      r.status = "resolved";
      r.updatedAt = new Date().toISOString();
      found = true;
    }
    return r;
  });

  if (found) {
    writeReports(updatedReports);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Report not found" });
  }
});

// 7. Get leaderboard statistics
app.get("/api/leaderboard", (req, res) => {
  const reports = readReports();

  const depts = [
    "Roads & Highways Department",
    "Sewage & Drainage Division",
    "Hydraulics & Water Supply Department",
    "Solid Waste Management Ward",
    "Electricity & Public Lighting Division"
  ];

  const stats = depts.map(dept => {
    const deptReports = reports.filter(r => r.assignedDept === dept);
    const total = deptReports.length;
    const resolved = deptReports.filter(r => r.status === "resolved").length;
    const overdue = deptReports.filter(r => r.status === "overdue").length;
    const pending = deptReports.filter(r => r.status === "assigned").length;

    // Resolve rate: resolved / total
    const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    
    // Performance score: starts at 75, resolved adds 5, overdue subtracts 10, citations of unresolved subtracts 1
    let performanceScore = 75;
    performanceScore += resolved * 5;
    performanceScore -= overdue * 12;
    
    // clamp performance rank between 20 and 100
    performanceScore = Math.max(20, Math.min(100, performanceScore));

    // Calculate simulated avg response time in hours
    const avgResolveTimeHours = total > 0 ? Math.round(18 + (overdue * 10) - (resolved * 2)) : 12;

    return {
      assigned_dept: dept,
      avg_resolve_time_hours: Math.max(4, avgResolveTimeHours),
      total_resolved: resolved,
      total_overdue: overdue,
      total_pending: pending,
      performance_rank: performanceScore
    };
  });

  // Sort by performance rank descending
  stats.sort((a, b) => b.performance_rank - a.performance_rank);
  res.json(stats);
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Civic Sense Server] running on http://localhost:${PORT}`);
  });
}

startServer();
