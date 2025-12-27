import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">HS</div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Health Sathi</span>
            </div>
            <div className="flex items-center gap-4">
               <Link to="/auth">
                 <Button variant="primary" className="py-2 px-6 text-sm">
                  Log In
                 </Button>
               </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-50 to-slate-50 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-teal-100 border border-teal-200">
             <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">✨ Powered by Team Envision</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Healthcare Simplified with <br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Multimodal AI</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload prescriptions, lab reports, or just speak your symptoms. 
            Health Sathi interprets medical data instantly and connects you with doctor verification.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <button className="px-8 py-4 bg-teal-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all hover:-translate-y-1">
                Get Started Free
              </button>
            </Link>
          </div>
          
          <div className="mt-16 mx-auto max-w-4xl relative">
             <div className="absolute inset-0 bg-teal-500 blur-3xl opacity-20 rounded-full transform scale-75"></div>
             <img 
               src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
               alt="Doctor Dashboard" 
               className="relative rounded-2xl shadow-2xl border-4 border-white mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-500"
             />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose Health Sathi?</h2>
               <p className="text-slate-500 max-w-2xl mx-auto">We combine advanced AI with human expertise to make medical information accessible and understandable.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
               <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                  <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Multimodal Analysis</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Don't just type. Upload photos of handwritten prescriptions, PDF lab reports, or record audio voice notes. Our AI understands it all.
                  </p>
               </div>
               
               <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                  <div className="h-12 w-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 mb-6">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Language Barrier Breaker</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Get guidance in your local language. Health Sathi automatically detects spoken languages and translates complex medical terms into Hindi or English.
                  </p>
               </div>
               
               <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                  <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Doctor Verified</h3>
                  <p className="text-slate-600 leading-relaxed">
                    AI isn't perfect, so we keep humans in the loop. Doctors review critical cases and AI insights before you receive the final guidance.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Knowledge Base / RAG Showcase Section */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Knowledge Context Engine</span>
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">
                Not Just Guessing.<br/>
                <span className="text-indigo-600">Retrieving Clinical Truth.</span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed max-w-xl">
                Unlike general AI, Health Sathi uses <strong>Retrieval-Augmented Generation (RAG)</strong>. Every response is anchored in our verified Clinical Reference Library. We cross-reference your data against specific diagnostic thresholds before saying a word.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Retrieve</h4>
                    <p className="text-xs text-slate-500">AI scans Chapter 1-4 for relevant protocols.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Validate</h4>
                    <p className="text-xs text-slate-500">Inputs are checked against high-risk 'Warning' triggers.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="h-8 w-8 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Cite</h4>
                    <p className="text-xs text-slate-500">Guidance is delivered with verifiable library citations.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
              
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl hover:-translate-y-2 transition-transform cursor-default group">
                <div className="h-10 w-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4 text-xl">❤️</div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-tight">CH 1: Cardiology</h4>
                <p className="text-[11px] text-slate-500 leading-normal">Hypertension thresholds: Stage 1 (130/80) up to Crisis (180/120).</p>
                <div className="mt-4 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-red-600 uppercase">Warning: BP {">"} 180/120</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl hover:-translate-y-2 transition-transform cursor-default group translate-y-8">
                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 text-xl">🍭</div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-tight">CH 2: Metabolic</h4>
                <p className="text-[11px] text-slate-500 leading-normal">HbA1c {"&"} Glucose monitoring. Verified Low GI food exchange lists.</p>
                <div className="mt-4 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-amber-600 uppercase">Critical: Sugar {"<"} 70 mg/dL</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl hover:-translate-y-2 transition-transform cursor-default group">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 text-xl">🫁</div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-tight">CH 3: Respiratory</h4>
                <p className="text-[11px] text-slate-500 leading-normal">O2 Saturation Benchmarks {"(<94%)"} and moderate fever hydration.</p>
                <div className="mt-4 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Insist: ER if O2 {"<"} 94%</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl hover:-translate-y-2 transition-transform cursor-default group translate-y-8">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 text-xl">🧪</div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-tight">CH 4: Renal</h4>
                <p className="text-[11px] text-slate-500 leading-normal">Creatinine markers (0.7-1.3) and digestive GERD acidity protocols.</p>
                <div className="mt-4 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Goal: Stability 0.7-1.3 mg/dL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-teal-900 text-white overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-teal-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
         <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to take control of your health?</h2>
            <p className="text-teal-100 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of patients and doctors using Health Sathi to simplify chronic disease management.
            </p>
            <Link to="/auth">
               <button className="px-10 py-4 bg-white text-teal-900 rounded-xl font-bold text-lg hover:bg-teal-50 transition-colors shadow-xl">
                 Create Free Account
               </button>
            </Link>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center gap-2 mb-4">
                 <div className="h-6 w-6 bg-teal-600 text-white rounded flex items-center justify-center font-bold text-xs">HS</div>
                 <span className="text-lg font-bold text-white">Health Sathi</span>
               </div>
               <p className="text-sm max-w-xs">
                 Empowering patients with AI-driven insights and connecting them with trusted medical professionals.
               </p>
            </div>
            <div>
               <h4 className="text-white font-bold mb-4">Product</h4>
               <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-teal-400">Features</a></li>
                  <li><a href="#" className="hover:text-teal-400">For Patients</a></li>
                  <li><a href="#" className="hover:text-teal-400">For Doctors</a></li>
               </ul>
            </div>
            <div>
               <h4 className="text-white font-bold mb-4">Legal</h4>
               <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-teal-400">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-teal-400">Terms of Service</a></li>
               </ul>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-xs">
            © 2025 Health Sathi AI. All rights reserved.
         </div>
      </footer>
    </div>
  );
};