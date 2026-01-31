
# Health Sathi 🏥

**Health Sathi** is a multimodal AI health assistant designed to bridge the gap between patients and medical clarity. It uses Google's Gemini models to analyze medical records (PDFs, Images) and voice symptoms, providing clinical guidance that is verified by doctors.

![Health Sathi Banner](https://via.placeholder.com/1200x400/0d9488/ffffff?text=Health+Sathi+AI+Assistant)

## 🚀 Key Features

### For Patients 🧘‍♂️
*   **Multimodal Input**: 
    *   **Voice**: Record symptoms naturally using speech-to-text.
    *   **Vision**: Upload photos of handwritten prescriptions or medicine bottles.
    *   **Documents**: Upload PDF lab reports for analysis.
*   **AI Assessment**: Instantly extracts vitals, medication schedules, and provides clinical guidance using **Google Gemini 1.5/3 Flash**.
*   **Language Barrier Breaker**: Translate medical advice into **10+ Indian Regional Languages** (Hindi, Tamil, Marathi, etc.).
*   **Text-to-Speech (TTS)**: Listen to the guidance in a natural voice.
*   **Download Reports**: Generate professional **PDF Health Assessments** to share with caregivers.
*   **Offline-Capable**: Uses **IndexedDB** to store reports locally on your device.

### For Doctors 👨‍⚕️
*   **Triage Dashboard**: View a prioritized list of patient reports (Critical vs. Pending).
*   **Clinical Verification**: Review AI-generated insights against original files.
*   **One-Click Actions**: Approve, Modify, or Escalate cases with a single click.
*   **RAG Context**: AI analysis is anchored in a simulated "Health Sathi Medical Library" to ensure hallucination-free responses based on thresholds (e.g., Cardiology, Renal protocols).

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS (Custom animated UI)
*   **AI Engine**: Google GenAI SDK (`@google/genai`)
    *   *Analysis*: `gemini-3-flash-preview`
    *   *TTS*: `gemini-2.5-flash-preview-tts`
*   **State Management**: Zustand
*   **Database**: IndexedDB (Client-side NoSQL via native API)
*   **PDF Generation**: `jspdf` & `jspdf-autotable`
*   **Routing**: React Router DOM

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18 or higher)
*   A Google Gemini API Key (Get one at [aistudio.google.com](https://aistudio.google.com/))

### Steps

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/health-sathi.git
    cd health-sathi
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    *   Create a `.env` file in the root directory.
    *   Add your Gemini API Key (Note: In Vite, we use `VITE_` prefix or define it in `vite.config.ts`, but for this demo, ensure `process.env.API_KEY` is accessible or replace it in `services/geminiService.ts` for local testing).
    
    *Recommended for local dev (Quick start):*
    ```bash
    # Windows (PowerShell)
    $env:API_KEY="your_api_key_here"; npm run dev
    
    # Mac/Linux
    export API_KEY="your_api_key_here" && npm run dev
    ```

4.  **Run the App**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

---

## 📱 How to Use

1.  **Authentication**:
    *   Click "Create Account" or "Login".
    *   Select **Patient Portal** to upload data.
    *   Select **Doctor Portal** to review data.
    *   *(Note: Data is stored in your browser's IndexedDB. Doctors can "see" patient data because this is a simulated environment sharing the same local DB).*

2.  **Generate a Report**:
    *   As a Patient, click the **Microphone** to record symptoms.
    *   Or click **Upload Report** to select an image/PDF.
    *   Click "Generate Health Assessment".

3.  **Doctor Review**:
    *   Log out and log back in as a **Doctor**.
    *   Select the patient from the "Patient Triage" sidebar.
    *   Edit the notes and click "Approve & Send".

4.  **Download PDF**:
    *   Go back to the Patient Dashboard.
    *   On the report card, click the **PDF** button to download the A4 assessment.

---

## 🚢 Deployment (GitHub Pages)

To deploy this app live:

1.  Update `vite.config.ts` with your repo name:
    ```ts
    base: '/health-sathi/', // Replace with your repo name
    ```
2.  Run the deploy script:
    ```bash
    npm run deploy
    ```

---

## 📄 License

This project is open-source and available under the MIT License.

*Powered by Google Gemini* ✨
