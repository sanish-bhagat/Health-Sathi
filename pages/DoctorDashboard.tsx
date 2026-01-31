import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { ReportStatus, HealthReport, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { logoutUser } from '../services/dbService';

export const DoctorDashboard: React.FC = () => {
  const { 
    reports, 
    updateReportStatus, 
    loadReports, 
    setAuth, 
    isSidebarOpen, 
    setSidebarOpen, 
    sidebarActiveSection,
    currentPatientName 
  } = useAppStore();
  
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleLogout = async () => {
    await logoutUser();
    setSidebarOpen(false);
    setAuth(UserRole.GUEST, '', null);
  };

  // Sort: Critical -> Warning (Pending) -> Review
  const sortedReports = [...reports].sort((a, b) => {
    const statusOrder = {
      [ReportStatus.CRITICAL]: 0,
      [ReportStatus.PENDING]: 1,
      [ReportStatus.REVIEWED]: 2,
    };
    return statusOrder[a.status] - statusOrder[b.status] || b.timestamp - a.timestamp;
  });

  const selectedReport = reports.find(r => r.id === selectedReportId) || sortedReports[0];
  
  useEffect(() => {
    setIsEditing(false);
    setEditNote("");
  }, [selectedReport?.id]);

  const previousReport = selectedReport 
    ? reports.find(r => r.patientName === selectedReport.patientName && r.id !== selectedReport.id && r.timestamp < selectedReport.timestamp)
    : null;

  const handleApprove = async (id: string) => {
    const doctorName = selectedReport?.targetDoctorName || currentPatientName;
    await updateReportStatus(id, ReportStatus.REVIEWED, `Reviewed by ${doctorName}`);
  };

  const handleEscalate = async (id: string) => {
    const doctorName = selectedReport?.targetDoctorName || currentPatientName;
    await updateReportStatus(id, ReportStatus.CRITICAL, `Escalated by ${doctorName} for Tele-consult.`);
  };

  const handleStartModify = () => {
    if (selectedReport) {
      if (!selectedReportId) setSelectedReportId(selectedReport.id);
      // Pre-fill with existing notes OR AI guidance to allow modification of the draft
      const prefix = `Reviewed by ${selectedReport.targetDoctorName || currentPatientName}: `;
      let initialText = selectedReport.doctorNotes || selectedReport.aiAnalysis?.english_guidance || "";
      
      if (!initialText.startsWith("Reviewed by")) {
        initialText = prefix + initialText;
      }
      
      setEditNote(initialText);
      setIsEditing(true);
    }
  };

  const handleSaveModification = async () => {
    if (selectedReport) {
      await updateReportStatus(selectedReport.id, ReportStatus.REVIEWED, editNote);
      setIsEditing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-slate-100 overflow-hidden relative">
      
      {/* --- SIDEBAR OVERLAY --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- TOGGLEABLE SIDEBAR --- */}
      <aside className={`fixed top-0 left-0 h-full w-85 bg-white shadow-2xl z-[120] transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
               {sidebarActiveSection === 'profile' ? 'Doctor Profile' : 'Sathi Library'}
            </h2>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {sidebarActiveSection === 'profile' ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <section className="mb-12">
                <div className="text-center mb-8">
                   <div className="h-28 w-28 mx-auto bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-5xl font-bold border border-indigo-100 shadow-sm mb-5 transform -rotate-2">
                     Dr
                   </div>
                   <h3 className="text-2xl font-bold text-slate-900">{currentPatientName}</h3>
                   <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-2">Verified Medical Professional</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Total Reviews</p>
                      <p className="font-bold text-xl text-slate-800">{reports.length}</p>
                   </div>
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Active Alerts</p>
                      <p className="font-bold text-xl text-red-600">{reports.filter(r => r.status === ReportStatus.CRITICAL).length}</p>
                   </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[2rem] text-white shadow-xl">
                   <p className="text-[10px] font-bold uppercase mb-3 flex items-center gap-2 opacity-90">
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3a1 1 0 00-.787 0l-7 3a1 1 0 000 1.838l1.69.724z"></path></svg>
                     Specialty: Internal Medicine
                   </p>
                   <p className="text-xs leading-relaxed font-medium">Accessing clinical protocols from Sathi's Medical Library Chapter 1-4 for verification triage.</p>
                </div>
              </section>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
               {/* Same Library Content as Patient but for Doctor Reference */}
               <section className="mb-8">
                  <div className="flex items-center gap-3 mb-8 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">📚</div>
                    <div>
                      <p className="font-bold text-indigo-900 tracking-tight">Clinical Standards</p>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">v1.0.24 Update</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm mb-2">Diagnostic Thresholds</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Reference for hypertensive crisis and metabolic shock markers according to Health Sathi protocols.</p>
                    </div>
                  </div>
               </section>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-50 bg-slate-50/30">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all font-bold text-xs uppercase tracking-widest shadow-sm"
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Logout from Portal
           </button>
        </div>
      </aside>

      {/* --- TRIAGE SIDEBAR (Left Panel) --- */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-slate-200 flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 text-lg">Patient Triage</h2>
          <div className="flex gap-2 mt-2">
             <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
               {reports.filter(r => r.status === ReportStatus.CRITICAL).length} Critical
             </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sortedReports.map(report => (
            <div 
              key={report.id}
              onClick={() => setSelectedReportId(report.id)}
              className={`p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${
                selectedReport?.id === report.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className={`font-semibold text-sm ${selectedReport?.id === report.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {report.patientName}
                </h3>
                {report.status === ReportStatus.CRITICAL && (
                   <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse-red"></span>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-2">{new Date(report.timestamp).toLocaleDateString()}</p>
              
              <div className={`text-xs px-2 py-1 rounded inline-block font-medium ${
                 report.status === ReportStatus.CRITICAL ? 'bg-red-100 text-red-700' :
                 report.status === ReportStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                 'bg-green-100 text-green-700'
              }`}>
                {report.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MAIN REVIEW WORKSPACE --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {selectedReport ? (
          <>
            <header className="bg-white p-6 border-b border-slate-200 shadow-sm z-10">
               <div className="flex justify-between items-start">
                 <div>
                    <h1 className="text-2xl font-bold text-slate-900">{selectedReport.patientName}</h1>
                    <p className="text-sm text-slate-500 mt-1">
                      Report ID: {selectedReport.id} • {new Date(selectedReport.timestamp).toLocaleString()}
                    </p>
                 </div>
                 {selectedReport.aiAnalysis && (
                   <div className="flex flex-col items-end">
                      <div className={`text-sm font-bold px-3 py-1 rounded-full border ${
                        selectedReport.aiAnalysis.confidence_score > 85 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                         {selectedReport.aiAnalysis.confidence_score}% AI Match
                      </div>
                   </div>
                 )}
               </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 pb-32">
              {selectedReport.status === ReportStatus.CRITICAL && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-pulse-red ring-1 ring-red-100">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <h3 className="text-red-800 font-bold">Critical Attention Needed</h3>
                    <p className="text-red-600 text-sm mt-1">{selectedReport.aiAnalysis?.critical_reason || "Critical values detected."}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                   <Card>
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">Lab Values Comparison</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                              <th className="px-4 py-3">Metric</th>
                              <th className="px-4 py-3">Previous</th>
                              <th className="px-4 py-3 text-indigo-700 font-bold bg-indigo-50">Current</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedReport.aiAnalysis?.extracted_values && Object.entries(selectedReport.aiAnalysis.extracted_values).map(([key, value]) => (
                               <tr key={key}>
                                 <td className="px-4 py-3 font-medium text-slate-700">{key}</td>
                                 <td className="px-4 py-3 text-slate-400">{(previousReport?.aiAnalysis?.extracted_values?.[key] as string) || "-"}</td>
                                 <td className="px-4 py-3 font-bold text-slate-900 bg-indigo-50/30">{String(value)}</td>
                               </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                   </Card>
                </div>
                <div className="space-y-6">
                   {selectedReport.imageUri && (
                      <div className="aspect-video bg-slate-200 rounded-xl overflow-hidden border border-slate-300 relative group">
                         <img src={selectedReport.imageUri} alt="Report" className="w-full h-full object-contain bg-slate-900" />
                         <button onClick={() => setPreviewImage(selectedReport.imageUri!)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest">Full View</button>
                      </div>
                   )}
                   <Card className="border-teal-100 bg-teal-50/30">
                     <h3 className="font-bold text-teal-800 text-sm mb-2 uppercase tracking-wide">Sathi AI Guidance</h3>
                     <p className="text-sm text-slate-700 italic">"{selectedReport.aiAnalysis?.english_guidance}"</p>
                   </Card>
                </div>
              </div>
            </div>

            {/* FIXED BOTTOM ACTION BAR WITH EDITING MODE */}
            <div className="bg-white border-t border-slate-200 p-4 absolute bottom-0 left-0 right-0 z-20 shadow-lg">
               {isEditing ? (
                 <div className="max-w-4xl mx-auto space-y-3">
                   <textarea
                     value={editNote}
                     onChange={(e) => setEditNote(e.target.value)}
                     placeholder="Add your clinical notes here..."
                     className="w-full p-3 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50"
                     rows={3}
                   />
                   <div className="flex gap-3">
                     <Button variant="primary" className="flex-1" onClick={handleSaveModification}>Approve & Send</Button>
                     <Button variant="secondary" className="flex-1" onClick={() => setIsEditing(false)}>Cancel</Button>
                   </div>
                 </div>
               ) : (
                 <div className="max-w-4xl mx-auto flex gap-3">
                    <Button variant="primary" className="flex-1" onClick={() => handleApprove(selectedReport.id)}>Approve & Send</Button>
                    <Button variant="secondary" className="flex-1" onClick={handleStartModify}>Modify</Button>
                    <Button variant="danger" className="flex-1" onClick={() => handleEscalate(selectedReport.id)}>Escalate</Button>
                 </div>
               )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-slate-400">
             <p>Select a patient report to review.</p>
          </div>
        )}
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
};