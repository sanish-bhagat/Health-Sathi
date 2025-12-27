
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { analyzeMedicalInputs, translateText } from '../services/geminiService';
import { uploadFileToStorage, base64ToBlob, saveReportToDb, logoutUser } from '../services/dbService';
import { generateReportPDF } from '../services/pdfService';
import { AudioRecorder } from '../components/AudioRecorder';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TTSButton } from '../components/TTSButton';
import { ReportStatus, HealthReport, UserRole, MedicationDetail, UserProfile } from '../types';

const REGIONAL_LANGUAGES = [
  "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Kannada", "Odia", "Punjabi", "Malayalam"
];

const MedicationScheduleCard: React.FC<{ meds: MedicationDetail[] }> = ({ meds }) => {
  if (!meds || meds.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-sm"></span>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Extracted Prescription Schedule</span>
      </div>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {meds.map((med, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-indigo-200 transition-colors h-full flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm line-clamp-1" title={med.name}>{med.name}</h4>
                <p className="text-[11px] text-indigo-600 font-bold uppercase">{med.dosage}</p>
              </div>
              <div className="bg-indigo-50 px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-700 uppercase whitespace-nowrap">
                {med.frequency}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-auto pt-3 p-2 bg-slate-50 rounded-xl">
              <div className="h-6 w-6 bg-white rounded-lg flex items-center justify-center text-xs shadow-sm">🕒</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">Timing</p>
                <p className="text-xs text-slate-700 font-medium truncate" title={med.timing}>{med.timing}</p>
              </div>
            </div>
            {med.instructions && med.instructions.toLowerCase() !== "none" && (
              <p className="mt-3 text-[10px] text-slate-500 leading-relaxed italic border-t border-slate-50 pt-2 line-clamp-2" title={med.instructions}>
                <span className="font-bold text-amber-600">Note: </span>{med.instructions}
              </p>
            )}
            
            {/* Deep Link to Pharmacy */}
            <div className="mt-3 pt-3 border-t border-slate-50">
               <a 
                 href={`https://www.1mg.com/search/all?name=${encodeURIComponent(med.name)}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-100 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
               >
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                 Order Now
               </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PatientDashboard: React.FC = () => {
  const { 
    currentPatientName, 
    currentUserId, 
    currentUserProfile,
    addReportLocal, 
    reports, 
    loadReports, 
    isSidebarOpen, 
    setSidebarOpen,
    sidebarActiveSection,
    setAuth,
    updateProfile,
    loadDoctors,
    availableDoctors
  } = useAppStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [symptomText, setSymptomText] = useState("");
  
  // Searchable Doctor State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(""); 
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  
  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  const [reportTranslations, setReportTranslations] = useState<Record<string, { lang: string, text: string, loading: boolean }>>({});

  const [imgMime, setImgMime] = useState('image/jpeg');
  const [pdfMime, setPdfMime] = useState('application/pdf');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadReports();
    loadDoctors(); 
  }, [loadReports, loadDoctors]);

  // Sync edit form with profile data when opening edit mode
  useEffect(() => {
    if (isEditingProfile) {
      if (currentUserProfile) {
        setEditForm(currentUserProfile);
      } else {
        setEditForm({ name: currentPatientName, email: '' });
      }
    }
  }, [isEditingProfile, currentUserProfile, currentPatientName]);

  const totalReports = reports.length;
  const criticalReports = reports.filter(r => r.status === ReportStatus.CRITICAL).length;
  const filteredDoctors = availableDoctors.filter(doc => 
    doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
    (doc.specialization || '').toLowerCase().includes(doctorSearchQuery.toLowerCase())
  ).slice(0, 50); 

  const handleSelectDoctor = (doc: UserProfile | null) => {
    if (doc) {
      setSelectedDoctorId(doc.uid);
      setDoctorSearchQuery(doc.name); 
    } else {
      setSelectedDoctorId("");
      setDoctorSearchQuery("");
    }
    setIsDoctorDropdownOpen(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setSidebarOpen(false);
    setAuth(UserRole.GUEST, '', null);
  };

  const handleProfileSave = async () => {
    if (Object.keys(editForm).length > 0) {
       await updateProfile(editForm);
    }
    setIsEditingProfile(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const content = base64String.split(',')[1];
        if (file.type.includes('image')) {
          setSelectedImage(content);
          setImgMime(file.type);
          setSelectedPdf(null); 
        } else if (file.type.includes('pdf')) {
          setSelectedPdf(content);
          setPdfMime(file.type);
          setSelectedImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLanguageSwitch = async (reportId: string, englishText: string, targetLang: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    if (targetLang === (report.aiAnalysis?.detected_language || "Hindi")) {
      setReportTranslations(prev => ({
        ...prev,
        [reportId]: { lang: targetLang, text: report.aiAnalysis?.local_language_guidance || "", loading: false }
      }));
      return;
    }

    setReportTranslations(prev => ({
      ...prev,
      [reportId]: { lang: targetLang, text: prev[reportId]?.text || "", loading: true }
    }));

    try {
      const translated = await translateText(englishText, targetLang);
      setReportTranslations(prev => ({
        ...prev,
        [reportId]: { lang: targetLang, text: translated, loading: false }
      }));
    } catch (error) {
      console.error("Translation failed", error);
      setReportTranslations(prev => ({
        ...prev,
        [reportId]: { ...prev[reportId], loading: false }
      }));
    }
  };

  const handleSubmit = async () => {
    if ((!selectedImage && !selectedPdf) && !recordedAudio && !symptomText.trim()) {
      alert("Please upload a file, record audio, or enter text symptoms.");
      return;
    }
    
    if (!currentUserId) {
        alert("Authentication error. Please re-login.");
        return;
    }

    setIsProcessing(true);
    try {
      const patientReports = reports.filter(r => r.userId === currentUserId);
      const lastReport = patientReports.length > 0 ? patientReports[0] : null;
      let historyContext = null;
      
      if (lastReport && lastReport.aiAnalysis) {
        historyContext = `Previous Report Date: ${new Date(lastReport.timestamp).toLocaleDateString()}\n`;
        historyContext += `Previous Values: ${JSON.stringify(lastReport.aiAnalysis.extracted_values)}\n`;
        historyContext += `Previous Medications: ${lastReport.aiAnalysis.medications.join(', ')}`;
      }

      const analysis = await analyzeMedicalInputs(selectedImage, selectedPdf, recordedAudio, historyContext, symptomText);
      
      const status = analysis.is_critical ? ReportStatus.CRITICAL : ReportStatus.PENDING;
      const reportId = Date.now().toString();

      let imageStorageUrl, pdfStorageUrl, audioStorageUrl;

      if (selectedImage) {
        const blob = base64ToBlob(selectedImage, imgMime);
        imageStorageUrl = await uploadFileToStorage(blob);
      }
      
      if (selectedPdf) {
        const blob = base64ToBlob(selectedPdf, pdfMime);
        pdfStorageUrl = await uploadFileToStorage(blob);
      }

      if (recordedAudio) {
        const blob = base64ToBlob(recordedAudio, 'audio/wav');
        audioStorageUrl = await uploadFileToStorage(blob);
      }

      const selectedDoc = availableDoctors.find(d => d.uid === selectedDoctorId);

      const newReport: HealthReport = {
        id: reportId,
        userId: currentUserId,
        patientName: currentPatientName,
        timestamp: Date.now(),
        imageUri: imageStorageUrl, 
        pdfUri: pdfStorageUrl,
        audioUri: audioStorageUrl,
        status: status,
        aiAnalysis: analysis,
        targetDoctorId: selectedDoctorId || undefined,
        targetDoctorName: selectedDoc ? selectedDoc.name : undefined
      };

      await saveReportToDb(newReport);
      addReportLocal(newReport);

      setSelectedImage(null);
      setSelectedPdf(null);
      setRecordedAudio(null);
      setSymptomText("");
      setSelectedDoctorId("");
      setDoctorSearchQuery("");
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      console.error(error);
      alert("Failed to analyze. Please check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50">
      
      {/* --- SIDEBAR OVERLAY --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`fixed top-0 left-0 h-full w-85 bg-white shadow-2xl z-[120] transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         {/* ... Sidebar content unchanged but ensuring classes match ... */}
         <div className="p-8 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
               {sidebarActiveSection === 'profile' ? 'My Profile' : 'Sathi Library'}
            </h2>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          {sidebarActiveSection === 'profile' ? (
             <div className="animate-in fade-in slide-in-from-left-4 duration-300">
               <section className="mb-12 relative">
                 {!isEditingProfile && (
                   <button onClick={() => setIsEditingProfile(true)} className="absolute top-0 right-0 p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Edit Profile">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                   </button>
                 )}
                 <div className="text-center mb-8">
                   <div className="h-28 w-28 mx-auto bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center text-5xl font-bold border border-teal-100 shadow-sm mb-5">
                     {currentPatientName.charAt(0)}
                   </div>
                   <h3 className="text-2xl font-bold text-slate-900">{currentPatientName}</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Verified Health Sathi Member</p>
                 </div>
                 {isEditingProfile ? (
                   <div className="space-y-4 mb-8">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Weight (kg)</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          value={editForm.weight || ""} 
                          onChange={e => setEditForm({...editForm, weight: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Age</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          value={editForm.age || ""} 
                          onChange={e => setEditForm({...editForm, age: e.target.value})} 
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button fullWidth onClick={handleProfileSave} className="bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20">Save</Button>
                        <Button fullWidth variant="outline" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                      </div>
                   </div>
                 ) : (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase">Weight</p><p className="font-bold text-lg">{currentUserProfile?.weight || '--'} kg</p></div>
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase">Age</p><p className="font-bold text-lg">{currentUserProfile?.age || '--'}</p></div>
                    </div>
                 )}
               </section>
             </div>
          ) : (
             <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100"><p className="text-indigo-800 font-medium text-sm">Library Access Active</p></div>
          )}
         </div>
         <div className="p-8 border-t border-slate-50 bg-slate-50/30">
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-red-600 transition-all font-bold text-xs uppercase tracking-widest">Logout</button>
         </div>
      </aside>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Hello, {currentPatientName.split(' ')[0]}
              </h1>
              <p className="text-slate-500 mt-1 font-medium text-lg">How are you feeling today?</p>
           </div>
        </div>

        {/* --- MAIN FEATURE SECTION --- */}
        <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-visible">
            
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
               <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span>
               Start Assessment
            </h2>

            {/* PRIMARY ACTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                
                {/* 1. VOICE INPUT (Primary) */}
                <div className={`relative rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center p-6 gap-3 min-h-[160px] ${recordedAudio ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-teal-200 hover:bg-teal-50/10'}`}>
                    <div className="scale-125 transform transition-transform">
                         <AudioRecorder onAudioCaptured={setRecordedAudio} />
                    </div>
                    <div className="text-center">
                        <p className={`text-sm font-bold ${recordedAudio ? 'text-indigo-700' : 'text-slate-700'}`}>
                           {recordedAudio ? 'Voice Captured' : 'Record Symptoms'}
                        </p>
                        {recordedAudio && (
                           <button onClick={() => setRecordedAudio(null)} className="text-[10px] text-red-500 font-bold uppercase hover:underline mt-1">Remove</button>
                        )}
                    </div>
                </div>

                {/* 2. UPLOAD REPORT (Primary) */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center p-6 gap-4 min-h-[160px] ${selectedImage || selectedPdf ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-100 hover:border-teal-200 hover:bg-teal-50/10'}`}
                >
                   {selectedImage || selectedPdf ? (
                      <>
                        <div className="h-14 w-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                           {selectedPdf ? '📄' : '🖼️'}
                        </div>
                         <div className="text-center">
                           <p className="text-sm font-bold text-teal-700">File Attached</p>
                           <p className="text-[10px] text-teal-600 font-bold uppercase">Ready</p>
                        </div>
                        <div className="absolute top-3 right-3 text-teal-400 hover:text-red-500 p-2" onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setSelectedPdf(null); }}>
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                      </>
                   ) : (
                      <>
                        <div className="h-14 w-14 bg-white text-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-200">
                           <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        </div>
                        <div className="text-center">
                           <p className="text-sm font-bold text-slate-700">Upload Report</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">PDF or Image</p>
                        </div>
                      </>
                   )}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />

                {/* 3. SELECT DOCTOR (Primary) */}
                <div className="relative">
                    <button 
                       onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                       className={`w-full h-full min-h-[160px] rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center p-6 gap-4 ${selectedDoctorId ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/10'}`}
                    >
                       <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border ${selectedDoctorId ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-white text-indigo-500 border-slate-200'}`}>
                          👨‍⚕️
                       </div>
                       <div className="text-center">
                          <p className={`text-sm font-bold ${selectedDoctorId ? 'text-indigo-900' : 'text-slate-700'}`}>
                             {selectedDoctorId 
                                ? (availableDoctors.find(d => d.uid === selectedDoctorId)?.name || 'Doctor Selected') 
                                : 'Select Doctor'}
                          </p>
                          <p className={`text-[10px] font-bold uppercase ${selectedDoctorId ? 'text-indigo-600' : 'text-slate-400'}`}>
                             {selectedDoctorId ? 'Review Requested' : 'Optional'}
                          </p>
                       </div>
                    </button>
                    
                    {/* DROPDOWN */}
                    {isDoctorDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 max-h-72 flex flex-col animate-in fade-in slide-in-from-top-2">
                           <div className="p-3 border-b border-slate-50 bg-slate-50/50 sticky top-0 z-10">
                             <input 
                               autoFocus
                               className="w-full px-4 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                               placeholder="Search doctor..."
                               value={doctorSearchQuery}
                               onChange={e => setDoctorSearchQuery(e.target.value)}
                             />
                           </div>
                           <div className="overflow-y-auto flex-1">
                              <div 
                                onClick={() => handleSelectDoctor(null)}
                                className="px-5 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 flex items-center gap-3"
                              >
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">Self</div>
                                <div><p className="text-sm font-bold text-slate-700">Self Review (No Doctor)</p></div>
                              </div>
                              {filteredDoctors.map(doc => (
                                 <div 
                                   key={doc.uid}
                                   onClick={() => handleSelectDoctor(doc)}
                                   className="px-5 py-4 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 flex items-center gap-3"
                                 >
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">Dr</div>
                                    <div className="truncate">
                                       <p className="text-sm font-bold text-slate-700 truncate">{doc.name}</p>
                                       <p className="text-[10px] text-slate-400 uppercase">{doc.specialization}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SECONDARY: CHATBOX */}
            <div className="relative group">
                <div className="absolute top-4 left-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
                    Additional Notes (Optional)
                </div>
                <textarea 
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  placeholder="Type any specific details here (e.g., 'Fever started 2 days ago')..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 pt-10 text-sm text-slate-700 placeholder-slate-300 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all resize-none min-h-[100px]"
                />
            </div>

            {/* SUBMIT BUTTON */}
            <div className="mt-8">
               <Button 
                 onClick={handleSubmit} 
                 disabled={isProcessing}
                 fullWidth
                 className="py-4 rounded-2xl text-base shadow-xl shadow-teal-500/20 font-bold tracking-wide"
               >
                 {isProcessing ? (
                    <span className="flex items-center justify-center gap-3">
                       <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                       Analyzing Health Data...
                    </span>
                 ) : 'Generate Health Assessment'}
               </Button>
            </div>
        </section>

        {/* Timeline Section */}
        <section>
           <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-sm"></span>
                Recent Assessments
             </h2>
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{totalReports} Entries</span>
           </div>
           
           {reports.length === 0 ? (
             <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
               <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
               </div>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Your timeline is empty</p>
               <p className="text-slate-400 text-xs mt-1">Create your first assessment above</p>
             </div>
           ) : (
             <div className="space-y-8">
               {reports.map((report) => {
                 const currentTrans = reportTranslations[report.id] || { 
                   lang: report.aiAnalysis?.detected_language || "Hindi", 
                   text: report.aiAnalysis?.local_language_guidance || "", 
                   loading: false 
                 };

                 return (
                 <Card key={report.id} className="border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-0 overflow-hidden rounded-[2rem]">
                   {/* Card Header */}
                   <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
                     <div className="flex gap-4 items-center">
                        <div className="h-10 w-10 bg-white shadow-sm border border-slate-100 text-indigo-600 rounded-xl flex items-center justify-center">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-800">Health Assessment</p>
                           <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                             {new Date(report.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                       {report.targetDoctorName && (
                         <span className="hidden sm:inline-block px-2 py-1 bg-white text-indigo-600 text-[10px] font-bold uppercase tracking-wide rounded-lg border border-indigo-100 shadow-sm">
                           Dr. {report.targetDoctorName.split(' ')[1] || report.targetDoctorName}
                         </span>
                       )}
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                         report.status === ReportStatus.CRITICAL 
                           ? 'bg-red-50 text-red-600 border-red-100' 
                           : report.status === ReportStatus.REVIEWED
                             ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                             : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                       }`}>
                         {report.status}
                       </span>
                     </div>
                   </div>
                   
                   {report.aiAnalysis && (
                     <div className="p-6 md:p-8 space-y-8">
                        {/* Guidance Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide text-teal-700">Analysis & Guidance</h3>
                                <div className="flex items-center gap-3">
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); generateReportPDF(report); }}
                                     className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 hover:border-indigo-300 transition-colors"
                                   >
                                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12"></path></svg>
                                     PDF
                                   </button>
                                   <TTSButton text={report.aiAnalysis.english_guidance} />
                                </div>
                            </div>
                            <p className="text-base text-slate-700 leading-relaxed font-medium bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                {report.aiAnalysis.english_guidance}
                            </p>
                        </div>

                        {/* Translation */}
                        <div className="bg-teal-50/30 p-5 rounded-2xl border border-teal-100/50">
                           <div className="flex justify-between items-center mb-3">
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Translate to</span>
                               <select 
                                 value={currentTrans.lang}
                                 onChange={(e) => handleLanguageSwitch(report.id, report.aiAnalysis!.english_guidance, e.target.value)}
                                 className="text-[10px] font-bold uppercase tracking-widest bg-white border border-teal-200 rounded-lg px-2 py-0.5 outline-none text-teal-700 cursor-pointer"
                               >
                                 {REGIONAL_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                               </select>
                             </div>
                             {/* Added TTSButton for translated text */}
                             <TTSButton text={currentTrans.text} label="Listen" />
                           </div>
                           {currentTrans.loading ? (
                             <div className="text-teal-600/50 text-sm font-medium animate-pulse">Translating...</div>
                           ) : (
                             <p className="text-base text-slate-800 font-serif leading-relaxed">
                               {currentTrans.text}
                             </p>
                           )}
                        </div>

                        {/* Medications */}
                        {report.aiAnalysis.medication_details && report.aiAnalysis.medication_details.length > 0 && (
                            <MedicationScheduleCard meds={report.aiAnalysis.medication_details} />
                        )}

                        {/* Extracted Values Grid */}
                        {Object.keys(report.aiAnalysis.extracted_values || {}).length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {Object.entries(report.aiAnalysis.extracted_values).map(([key, val]) => (
                              <div key={key} className="bg-white border border-slate-100 p-3 rounded-xl text-center shadow-sm">
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 truncate" title={key}>{key}</p>
                                 <p className="text-sm font-bold text-slate-800 truncate" title={String(val)}>{String(val)}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Doctor Notes */}
                        {report.doctorNotes && (
                          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex items-start gap-4">
                             <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path></svg>
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-1">Doctor's Note</p>
                                <p className="text-sm text-indigo-900 font-medium italic">"{report.doctorNotes}"</p>
                             </div>
                          </div>
                        )}
                     </div>
                   )}
                 </Card>
               )})}
             </div>
           )}
        </section>
      </main>
    </div>
  );
};
