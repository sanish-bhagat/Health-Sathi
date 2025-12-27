import React, { PropsWithChildren } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAppStore } from './store';
import { UserRole } from './types';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';

// -- Simple Navbar Component --
const Navbar = () => {
  const { currentUserRole, setSidebarOpen } = useAppStore();
  
  if (currentUserRole === UserRole.GUEST) return null;

  const isPatient = currentUserRole === UserRole.PATIENT;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 h-16 z-[100] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
         <Link to="/" className="font-bold text-teal-700 text-lg md:text-xl flex items-center gap-2">
            <div className="h-7 w-7 bg-teal-600 text-white rounded-lg flex items-center justify-center text-xs shadow-sm">HS</div>
            <span className="tracking-tight hidden sm:inline">Health Sathi</span>
         </Link>
         
         <div className="flex gap-4 items-center">
            {/* User Role Badge */}
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
              isPatient 
                ? 'bg-teal-50 text-teal-700 border-teal-100' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
            }`}>
              {isPatient ? 'Patient Portal' : 'Doctor Portal'}
            </div>

            {/* Classical Sidebar Trigger */}
            <button 
              onClick={() => setSidebarOpen(true, 'profile')}
              className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex flex-col items-center justify-center gap-1 border border-slate-100 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200"
              aria-label="Toggle Menu"
            >
               <span className="w-5 h-0.5 bg-current rounded-full"></span>
               <span className="w-5 h-0.5 bg-current rounded-full"></span>
               <span className="w-5 h-0.5 bg-current rounded-full"></span>
            </button>
         </div>
      </div>
    </nav>
  );
};

// -- Route Guard --
const ProtectedRoute = ({ role, children }: PropsWithChildren<{ role: UserRole }>) => {
  const { currentUserRole } = useAppStore();
  if (currentUserRole !== role) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { currentUserRole } = useAppStore();

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pt-16">
        <Navbar />
        <Routes>
          <Route path="/" element={
            currentUserRole === UserRole.PATIENT ? <Navigate to="/patient" /> :
            currentUserRole === UserRole.DOCTOR ? <Navigate to="/doctor" /> :
            <LandingPage />
          } />
          
          <Route path="/auth" element={
            currentUserRole === UserRole.PATIENT ? <Navigate to="/patient" /> :
            currentUserRole === UserRole.DOCTOR ? <Navigate to="/doctor" /> :
            <AuthPage />
          } />
          
          <Route path="/patient" element={
            <ProtectedRoute role={UserRole.PATIENT}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/doctor" element={
            <ProtectedRoute role={UserRole.DOCTOR}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;