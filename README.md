# 🏛️ Civic-Sense
### Bridging the Vernacular Gap in Civic Governance with Voice AI & Social Listening

**Category:** AI for Social Good / GovTech  
**Tech Stack:** React (Vite), Node.js (Express), Google Gemini AI (`gemini-3.5-flash`), Tailwind CSS

---

## 📌 The Problem
Most civic platforms assume a high degree of English literacy. In India, over 80% of citizens cannot comfortably draft a formal complaint in English. This creates a **"Governance Silence"**, where sewage leaks, water pipe bursts, or potholes in regional-speaking communities go completely unreported until they reach a breaking point. 

---

## 💡 Our Solution
**Civic-Sense** is a vernacular-first platform that turns raw colloquial speech (Hindi, Marathi, Tamil, Bengali, etc.) and social media noise (Twitter/X complaints) into structured, actionable civic tickets for authorities. 

---

## 🚀 Key Features & "Technical Moats"

### 1. Vernacular Multilingual Voice Triage
*   **How it works:** Citizens hold the "Speak" button and describe their issue in their regional tongue. 
*   **AI Engine:** Powered by **Google Gemini (`gemini-3.5-flash`)**, which natively processes, transcribes, translates to English, and structures the unstructured regional audio directly on the server-side.
*   **Landmark Mapping:** Extracts local landmark references (e.g. *"opposite the red temple near Dadar station"*) instead of relying on raw GPS, which often fails in dense urban setups.

### 2. Social Listening & "Shadow Issues"
*   **How it works:** Municipal authorities can trigger our social media listening scanner to mine civic complaints on platforms like Twitter/X. 
*   **Deduplication (Semantic Matching):** Uses Gemini's contextual intelligence to match a noisy tweet (e.g., *"the gutter is leaking again at Bandra station west!"*) with existing formal reports.
*   **Shadow Flag:** If a high-signal social complaint exists but has zero formal submissions, it gets flagged on the map as a **"Shadow Issue"**—unregistered but real.

### 3. Gamified Ward Accountability & SLA tracking
*   **How it works:** Wards and departments are tracked under strict Service Level Agreements (SLAs). If an issue isn't resolved in 48 hours, it's flagged as **"Overdue"** and visible on the **Public citizen dashboard**.
*   **Leaderboard:** Departments are ranked in real-time, sparking healthy civic competition to maintain a high performance rating.

---

## 🎨 Aesthetic Design Choices
Following rigorous UI guidelines, we implemented a high-contrast, structured **"Dark-Light-Dark Sandwich"** system:
1.  **Top Section (Dark):** Immersive deep civic teal (`#004d40`) and electric amber (`#ffbf00`) accents representing institutional trust and urgent action. Houses the vernacular voice recorder.
2.  **Middle Section (Light):** High-contrast light gray workspace displaying the **Live Shadow Map** (where glowing electric amber rings showcase the scale of social pressure) and **Community validation cards** where neighbors citation-upvote shadow reports.
3.  **Bottom Section (Dark):** A municipal control room interface housing the **Authority Command Queue** (where officials inspect original transcripts, English translations, and social proof) and the **Performance Leaderboard**.

---

## 🛠️ Step-by-Step Submission Guide (For Non-Developers!)

If you have never used GitHub or deployed a server before, don't worry! Here is exactly how to submit Civic-Sense to your hackathon:

### Step 1: Claim Your Google Cloud Project & API Key
1. Go to the [Google AI Studio Secrets Panel](https://aistudio.google.com/) and copy your free **Gemini API Key**.
2. This application is already configured to automatically read this key using the standard secure environment variable (`process.env.GEMINI_API_KEY`).

### Step 2: Create a GitHub Repository (Your Project's Home)
1. Go to [GitHub.com](https://github.com/) and sign up for a free account.
2. In the top right corner, click the **"+"** button and select **New repository**.
3. Fill in the following details:
   * **Repository name:** `civic-sense`
   * **Description:** `Vernacular Voice Civic Reporting & Accountability Platform`
   * **Public:** Keep it checked (so judges can see your code!)
   * Do not check "Add a README file" or "Add .gitignore".
4. Click **Create repository**.

### Step 3: Upload the Code
Since you are inside our AI Studio Workspace, you can instantly export this entire fully-built, ready-to-run repository!
1. Look at the top right of the AI Studio UI for the **Export** or **Download ZIP** icon.
2. Download the ZIP file of your workspace to your computer.
3. Extract the ZIP file on your computer.
4. On your GitHub Repository page, click the link that says **"uploading an existing file"** near the top.
5. Drag and drop all files and folders (except `node_modules` and `dist`) from your computer into the GitHub webpage.
6. Scroll down, write a comment like "Initial MVP commit for Hackathon", and click **Commit changes**.

### Step 4: Submit to the Hackathon Form
When submitting, provide these three links:
1. **GitHub Repository URL:** `https://github.com/YOUR_USERNAME/civic-sense`
2. **Deployed Live Preview URL:** This app is already deployed and hosted live! You can share the preview tab's URL from AI Studio, or deploy to Google Cloud Run in one click using our deployment workspace manager.
3. **Google Doc / Pitch Deck:** Paste the Problem, Solution, and Design Choice sections from above directly into your submission document.

---

### 🏛️ Civic-Sense — Transforming noise into civic signal. Good luck at the hackathon!
