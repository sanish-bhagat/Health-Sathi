
import { UserRole, HealthReport, UserProfile } from "../types";

// Database Configuration
const DB_NAME = 'HealthSathiDB';
const DB_VERSION = 1;
const STORE_USERS = 'users';
const STORE_REPORTS = 'reports';

// Helper to open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error("Failed to open database"));
    
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Users Collection
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        const userStore = db.createObjectStore(STORE_USERS, { keyPath: '_id' });
        userStore.createIndex('email', 'email', { unique: true });
        userStore.createIndex('role', 'role', { unique: false }); // Index for filtering doctors
      }
      
      // Reports Collection
      if (!db.objectStoreNames.contains(STORE_REPORTS)) {
        const reportStore = db.createObjectStore(STORE_REPORTS, { keyPath: 'id' });
        reportStore.createIndex('userId', 'userId', { unique: false });
        reportStore.createIndex('targetDoctorId', 'targetDoctorId', { unique: false }); // Index for doctor routing
        reportStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Generic Helper for DB Operations
const performTransaction = <T>(
  storeName: string, 
  mode: IDBTransactionMode, 
  callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      transaction.oncomplete = () => {
        // If the callback returned a request, resolve with its result
        if (request && (request as IDBRequest).result !== undefined) {
          resolve((request as IDBRequest).result);
        } else {
          resolve(undefined as T);
        }
      };
      
      transaction.onerror = () => reject(transaction.error);
      
      // Handle request specific success if needed for read operations
      if (request) {
         (request as IDBRequest).onsuccess = () => {
             // We wait for transaction complete, but strictly ensuring result is captured
         };
      }

    } catch (e) {
      reject(e);
    }
  });
};

// Helper to simulate network latency for "Real Feel"
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- AUTH SERVICES ---

export const registerUser = async (email: string, pass: string, name: string, role: UserRole, specialization?: string) => {
  await delay(600);
  
  // Check if user exists
  const existingUser = await new Promise((resolve, reject) => {
      openDB().then(db => {
          const tx = db.transaction(STORE_USERS, 'readonly');
          const index = tx.objectStore(STORE_USERS).index('email');
          const req = index.get(email);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
      });
  });

  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  const newUser = {
    _id: "user_" + Date.now() + Math.random().toString(36).substr(2, 9),
    email,
    password: pass, // In production, hash this!
    name,
    role,
    createdAt: new Date().toISOString(),
    // Default empty profile fields
    bloodGroup: 'Unknown',
    age: '',
    height: '',
    weight: '',
    phone: '',
    dob: '', 
    specialization: specialization || '', // Store specialization for doctors
  };

  await performTransaction(STORE_USERS, 'readwrite', (store) => store.add(newUser));

  // Map _id to uid for UserProfile type compatibility
  return { 
    user: { ...newUser, uid: newUser._id }, 
    role: newUser.role 
  };
};

export const loginUser = async (email: string, pass: string) => {
  await delay(600);
  
  const user: any = await new Promise((resolve, reject) => {
      openDB().then(db => {
          const tx = db.transaction(STORE_USERS, 'readonly');
          const index = tx.objectStore(STORE_USERS).index('email');
          const req = index.get(email);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
      });
  });
  
  if (!user || user.password !== pass) {
    throw new Error("Invalid email or password.");
  }

  // Return full profile mapped to UserProfile interface
  return { 
    user: { 
      uid: user._id, 
      email: user.email,
      name: user.name,
      role: user.role,
      bloodGroup: user.bloodGroup,
      age: user.age,
      dob: user.dob,
      height: user.height,
      weight: user.weight,
      phone: user.phone,
      specialization: user.specialization
    }, 
    role: user.role, 
    name: user.name 
  };
};

export const updateUserInDb = async (uid: string, updates: Partial<UserProfile>) => {
  await delay(300);
  const db = await openDB();
  const tx = db.transaction(STORE_USERS, 'readwrite');
  const store = tx.objectStore(STORE_USERS);

  return new Promise<void>((resolve, reject) => {
    const getReq = store.get(uid);

    getReq.onsuccess = () => {
      const data = getReq.result;
      if (!data) {
        reject(new Error("User not found"));
        return;
      }
      
      // Merge updates
      const updatedData = { ...data, ...updates };
      const putReq = store.put(updatedData);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
};

export const fetchAvailableDoctors = async (): Promise<UserProfile[]> => {
  await delay(300);
  return new Promise((resolve, reject) => {
    openDB().then(db => {
      const tx = db.transaction(STORE_USERS, 'readonly');
      const store = tx.objectStore(STORE_USERS);
      const index = store.index('role');
      const req = index.getAll(UserRole.DOCTOR);

      req.onsuccess = () => {
        const doctors = (req.result || []).map((doc: any) => ({
          uid: doc._id,
          name: doc.name,
          email: doc.email,
          role: doc.role,
          specialization: doc.specialization
        }));
        resolve(doctors);
      };
      req.onerror = () => reject(req.error);
    });
  });
};

export const logoutUser = async () => {
  await delay(200);
  // No-op for client-side DB
};

// --- STORAGE SERVICES ---

// Stores file as Base64 string. 
export const uploadFileToStorage = async (fileBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileBlob);
  });
};

export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

// --- DATABASE SERVICES ---

export const saveReportToDb = async (report: HealthReport) => {
  await delay(400);
  
  const reportDoc = { 
    ...report, 
    // Ensure we store the large data URIs in IDB
    updatedAt: new Date().toISOString() 
  };

  await performTransaction(STORE_REPORTS, 'readwrite', (store) => store.put(reportDoc));
};

export const fetchPatientReports = async (userId: string): Promise<HealthReport[]> => {
  await delay(400);
  
  return new Promise((resolve, reject) => {
     openDB().then(db => {
         const tx = db.transaction(STORE_REPORTS, 'readonly');
         const index = tx.objectStore(STORE_REPORTS).index('userId');
         const req = index.getAll(userId); // Get all reports for this user
         
         req.onsuccess = () => {
             const results = req.result as HealthReport[];
             // Sort by timestamp descending
             resolve(results.sort((a, b) => b.timestamp - a.timestamp));
         };
         req.onerror = () => reject(req.error);
     });
  });
};

export const fetchReportsForSpecificDoctor = async (doctorId: string): Promise<HealthReport[]> => {
  await delay(400);
  
  return new Promise((resolve, reject) => {
     openDB().then(db => {
         const tx = db.transaction(STORE_REPORTS, 'readonly');
         const index = tx.objectStore(STORE_REPORTS).index('targetDoctorId');
         const req = index.getAll(doctorId);
         
         req.onsuccess = () => {
             const results = req.result as HealthReport[];
             resolve(results.sort((a, b) => b.timestamp - a.timestamp));
         };
         req.onerror = () => reject(req.error);
     });
  });
};

export const fetchAllReportsForDoctor = async (): Promise<HealthReport[]> => {
  await delay(400);
  
  return new Promise((resolve, reject) => {
     openDB().then(db => {
         const tx = db.transaction(STORE_REPORTS, 'readonly');
         const req = tx.objectStore(STORE_REPORTS).getAll();
         
         req.onsuccess = () => {
             const results = req.result as HealthReport[];
             resolve(results.sort((a, b) => b.timestamp - a.timestamp));
         };
         req.onerror = () => reject(req.error);
     });
  });
};

export const updateReportInDb = async (reportId: string, updates: Partial<HealthReport>) => {
  await delay(300);
  
  const db = await openDB();
  const tx = db.transaction(STORE_REPORTS, 'readwrite');
  const store = tx.objectStore(STORE_REPORTS);

  return new Promise<void>((resolve, reject) => {
      const getReq = store.get(reportId);
      
      getReq.onsuccess = () => {
          const data = getReq.result;
          if (!data) {
              reject(new Error("Report not found"));
              return;
          }
          
          const updatedData = { ...data, ...updates };
          const putReq = store.put(updatedData);
          
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
      };
      
      getReq.onerror = () => reject(getReq.error);
  });
};
