import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { UserRole, HealthReport, UserProfile } from "../types";

// Helper to simulate network latency if needed, but Firebase handles its own
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- AUTH SERVICES ---

export const registerUser = async (email: string, pass: string, name: string, role: UserRole, specialization?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    const userData = {
      uid: user.uid,
      email,
      name,
      role,
      createdAt: Date.now(),
      bloodGroup: 'Unknown',
      age: '',
      height: '',
      weight: '',
      phone: '',
      dob: '', 
      specialization: specialization || '',
    };

    await setDoc(doc(db, "users", user.uid), userData);

    return { 
      user: userData, 
      role: userData.role 
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const loginUser = async (email: string, pass: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      throw new Error("User data not found.");
    }

    const data = userDoc.data() as any;
    
    return { 
      user: {
        uid: data.uid,
        email: data.email,
        name: data.name,
        role: data.role,
        bloodGroup: data.bloodGroup,
        age: data.age,
        dob: data.dob,
        height: data.height,
        weight: data.weight,
        phone: data.phone,
        specialization: data.specialization
      }, 
      role: data.role, 
      name: data.name 
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateUserInDb = async (uid: string, updates: Partial<UserProfile>) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, updates);
};

export const fetchAvailableDoctors = async (): Promise<UserProfile[]> => {
  const q = query(collection(db, "users"), where("role", "==", UserRole.DOCTOR));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: data.uid,
      name: data.name,
      email: data.email,
      role: data.role,
      specialization: data.specialization
    } as UserProfile;
  });
};

export const logoutUser = async () => {
  await signOut(auth);
};

// --- STORAGE SERVICES (MIGRATED TO BASE64 FOR FREE STORAGE) ---

/**
 * No longer uses Firebase Storage to avoid billing and CORS issues.
 * Returns the Base64 data directly to be stored in the Firestore document.
 * Note: Firestore documents have a 1MB limit.
 */
export const uploadFileToStorage = async (fileData: string, _fileName?: string): Promise<string> => {
  // Simply return the base64 string. It will be stored in the Firestore document.
  return fileData;
};

// --- DATABASE SERVICES ---

export const saveReportToDb = async (report: HealthReport) => {
  const reportRef = doc(db, "reports", report.id);
  await setDoc(reportRef, {
    ...report,
    updatedAt: Date.now()
  });
};

export const fetchPatientReports = async (userId: string): Promise<HealthReport[]> => {
  const q = query(
    collection(db, "reports"), 
    where("userId", "==", userId),
    orderBy("timestamp", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as HealthReport);
};

export const fetchAllReportsForDoctor = async (): Promise<HealthReport[]> => {
  const q = query(
    collection(db, "reports"),
    orderBy("timestamp", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as HealthReport);
};

export const updateReportInDb = async (reportId: string, updates: Partial<HealthReport>) => {
  const reportRef = doc(db, "reports", reportId);
  await updateDoc(reportRef, {
    ...updates,
    updatedAt: Date.now()
  });
};

// Helper for converting Base64 to Blob if needed for other operations
export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};
