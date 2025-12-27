
import { create } from 'zustand';
import { UserRole, HealthReport, ReportStatus, UserProfile } from './types';
import { fetchPatientReports, fetchReportsForSpecificDoctor, updateReportInDb, updateUserInDb, fetchAvailableDoctors } from './services/dbService';

interface AppState {
  currentUserRole: UserRole;
  currentPatientName: string;
  currentUserId: string | null;
  currentUserProfile: UserProfile | null;
  reports: HealthReport[];
  availableDoctors: UserProfile[]; // Cache for doctors list
  isLoading: boolean;
  isSidebarOpen: boolean;
  sidebarActiveSection: 'profile' | 'library';
  
  // Actions
  setAuth: (role: UserRole, name: string, uid: string | null, profile?: UserProfile) => void;
  setReports: (reports: HealthReport[]) => void;
  addReportLocal: (report: HealthReport) => void; 
  setSidebarOpen: (open: boolean, section?: 'profile' | 'library') => void;
  
  // Async Actions
  loadReports: () => Promise<void>;
  loadDoctors: () => Promise<void>;
  updateReportStatus: (id: string, status: ReportStatus, notes?: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUserRole: UserRole.GUEST,
  currentPatientName: '',
  currentUserId: null,
  currentUserProfile: null,
  reports: [],
  availableDoctors: [],
  isLoading: false,
  isSidebarOpen: false,
  sidebarActiveSection: 'profile',

  setAuth: (role, name, uid, profile) => set({ 
    currentUserRole: role, 
    currentPatientName: name, 
    currentUserId: uid,
    currentUserProfile: profile || null
  }),
  
  setReports: (reports) => set({ reports }),
  
  addReportLocal: (report) => set((state) => ({ reports: [report, ...state.reports] })),
  
  setSidebarOpen: (open, section = 'profile') => set({ isSidebarOpen: open, sidebarActiveSection: section }),

  loadReports: async () => {
    const { currentUserRole, currentUserId } = get();
    if (!currentUserId && currentUserRole !== UserRole.DOCTOR) return; 
    
    set({ isLoading: true });
    try {
      let fetchedReports: HealthReport[] = [];
      if (currentUserRole === UserRole.PATIENT && currentUserId) {
        fetchedReports = await fetchPatientReports(currentUserId);
      } else if (currentUserRole === UserRole.DOCTOR && currentUserId) {
        // Now using specific fetching for logged-in doctor
        fetchedReports = await fetchReportsForSpecificDoctor(currentUserId);
      }
      set({ reports: fetchedReports });
    } catch (e) {
      console.error("Failed to load reports", e);
    } finally {
      set({ isLoading: false });
    }
  },

  loadDoctors: async () => {
    try {
      const doctors = await fetchAvailableDoctors();
      set({ availableDoctors: doctors });
    } catch (e) {
      console.error("Failed to load doctors", e);
    }
  },
  
  updateReportStatus: async (id, status, notes) => {
    set((state) => ({
      reports: state.reports.map((r) => 
        r.id === id ? { ...r, status, doctorNotes: notes } : r
      )
    }));

    try {
      await updateReportInDb(id, { status, doctorNotes: notes });
    } catch (e) {
      console.error("Failed to update report in DB", e);
    }
  },

  updateProfile: async (updates) => {
    const { currentUserId, currentUserProfile } = get();
    if (!currentUserId || !currentUserProfile) return;

    // Optimistic Update
    const newProfile = { ...currentUserProfile, ...updates };
    set({ currentUserProfile: newProfile, currentPatientName: newProfile.name });

    try {
      await updateUserInDb(currentUserId, updates);
    } catch (e) {
      console.error("Failed to update profile", e);
      // Revert if needed (omitted for simplicity in this demo)
    }
  }
}));
