import { metsBlueRoster, metsOrangeRoster } from "../utils/constants";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

const STORAGE_KEYS = {
  CSV_FILES: "monster_csv_files",
  ROSTERS: "monster_rosters",
};

const COLLECTIONS = {
  CSV_FILES: "csvFiles",
  APP_DATA: "appData",
};

const ROSTERS_DOC_ID = "rosters";

// Generate unique ID for CSV files
function generateId() {
  return `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDefaultRosters() {
  return {
    "Mets Blue": [...metsBlueRoster],
    "Mets Orange": [...metsOrangeRoster],
  };
}

// Load CSV files from localStorage
function loadCSVFilesFromLocal() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CSV_FILES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading CSV files:", error);
  }
  return [];
}

// Save CSV file to localStorage
function saveCSVFileToLocal(fileData) {
  try {
    const files = loadCSVFilesFromLocal();
    const newFile = {
      id: generateId(),
      name: fileData.name,
      uploaded: new Date().toISOString(),
      week: fileData.week || "Unassigned",
      team: fileData.team || null, // Optional team selection
      events: fileData.events,
    };
    files.push(newFile);
    localStorage.setItem(STORAGE_KEYS.CSV_FILES, JSON.stringify(files));
    return newFile;
  } catch (error) {
    console.error("Error saving CSV file:", error);
    throw error;
  }
}

// Delete CSV file from localStorage
function deleteCSVFileFromLocal(fileId) {
  try {
    const files = loadCSVFilesFromLocal();
    const filtered = files.filter((f) => f.id !== fileId);
    localStorage.setItem(STORAGE_KEYS.CSV_FILES, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error("Error deleting CSV file:", error);
    throw error;
  }
}

// Update CSV file week assignment
function updateCSVWeekInLocal(fileId, week) {
  try {
    const files = loadCSVFilesFromLocal();
    const updated = files.map((f) =>
      f.id === fileId ? { ...f, week } : f
    );
    localStorage.setItem(STORAGE_KEYS.CSV_FILES, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error updating CSV week:", error);
    throw error;
  }
}

// Load rosters from localStorage
function loadRostersFromLocal() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ROSTERS);
    if (stored) {
      return JSON.parse(stored);
    }
    // First time - initialize with default rosters
    const defaultRosters = getDefaultRosters();
    saveRostersToLocal(defaultRosters);
    return defaultRosters;
  } catch (error) {
    console.error("Error loading rosters:", error);
    // Fallback to defaults
    return getDefaultRosters();
  }
}

// Save rosters to localStorage
function saveRostersToLocal(rosters) {
  try {
    localStorage.setItem(STORAGE_KEYS.ROSTERS, JSON.stringify(rosters));
  } catch (error) {
    console.error("Error saving rosters:", error);
    throw error;
  }
}

export async function loadCSVFiles() {
  if (!isFirebaseConfigured || !db) {
    return loadCSVFilesFromLocal();
  }
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.CSV_FILES));
    return snapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    }));
  } catch (error) {
    console.error("Error loading CSV files from Firestore:", error);
    return loadCSVFilesFromLocal();
  }
}

export async function saveCSVFile(fileData) {
  const filePayload = {
    name: fileData.name,
    uploaded: new Date().toISOString(),
    week: fileData.week || "Unassigned",
    team: fileData.team || null,
    events: fileData.events,
  };

  if (!isFirebaseConfigured || !db) {
    return saveCSVFileToLocal(fileData);
  }

  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.CSV_FILES), filePayload);
    return {
      id: docRef.id,
      ...filePayload,
    };
  } catch (error) {
    console.error("Error saving CSV file to Firestore:", error);
    throw error;
  }
}

export async function deleteCSVFile(fileId) {
  if (!isFirebaseConfigured || !db) {
    return deleteCSVFileFromLocal(fileId);
  }
  try {
    await deleteDoc(doc(db, COLLECTIONS.CSV_FILES, fileId));
    return loadCSVFiles();
  } catch (error) {
    console.error("Error deleting CSV file from Firestore:", error);
    throw error;
  }
}

export async function updateCSVWeek(fileId, week) {
  if (!isFirebaseConfigured || !db) {
    return updateCSVWeekInLocal(fileId, week);
  }
  try {
    const existingDoc = await getDoc(doc(db, COLLECTIONS.CSV_FILES, fileId));
    if (!existingDoc.exists()) {
      throw new Error("CSV file not found.");
    }

    await setDoc(
      doc(db, COLLECTIONS.CSV_FILES, fileId),
      {
        ...existingDoc.data(),
        week,
      },
      { merge: true }
    );

    return loadCSVFiles();
  } catch (error) {
    console.error("Error updating CSV week in Firestore:", error);
    throw error;
  }
}

export async function loadRosters() {
  if (!isFirebaseConfigured || !db) {
    return loadRostersFromLocal();
  }
  try {
    const rostersDoc = await getDoc(doc(db, COLLECTIONS.APP_DATA, ROSTERS_DOC_ID));
    if (rostersDoc.exists()) {
      return rostersDoc.data().teams || getDefaultRosters();
    }

    const defaultRosters = getDefaultRosters();
    await setDoc(doc(db, COLLECTIONS.APP_DATA, ROSTERS_DOC_ID), {
      teams: defaultRosters,
      updatedAt: new Date().toISOString(),
    });
    return defaultRosters;
  } catch (error) {
    console.error("Error loading rosters from Firestore:", error);
    return loadRostersFromLocal();
  }
}

export async function saveRosters(rosters) {
  if (!isFirebaseConfigured || !db) {
    saveRostersToLocal(rosters);
    return;
  }
  try {
    await setDoc(
      doc(db, COLLECTIONS.APP_DATA, ROSTERS_DOC_ID),
      {
        teams: rosters,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving rosters to Firestore:", error);
    throw error;
  }
}

export function subscribeToCSVFiles(onData, onError) {
  if (!isFirebaseConfigured || !db) {
    onData(loadCSVFilesFromLocal());
    return () => {};
  }
  return onSnapshot(
    collection(db, COLLECTIONS.CSV_FILES),
    (snapshot) => {
      const files = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data(),
      }));
      onData(files);
    },
    (error) => {
      console.error("CSV file subscription error:", error);
      if (onError) onError(error);
    }
  );
}

export function subscribeToRosters(onData, onError) {
  if (!isFirebaseConfigured || !db) {
    onData(loadRostersFromLocal());
    return () => {};
  }
  return onSnapshot(
    doc(db, COLLECTIONS.APP_DATA, ROSTERS_DOC_ID),
    async (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data().teams || getDefaultRosters());
        return;
      }

      const defaultRosters = getDefaultRosters();
      try {
        await setDoc(doc(db, COLLECTIONS.APP_DATA, ROSTERS_DOC_ID), {
          teams: defaultRosters,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error seeding roster defaults:", error);
      }
      onData(defaultRosters);
    },
    (error) => {
      console.error("Roster subscription error:", error);
      if (onError) onError(error);
    }
  );
}

// Clear all data (for testing/reset)
export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CSV_FILES);
    localStorage.removeItem(STORAGE_KEYS.ROSTERS);
  } catch (error) {
    console.error("Error clearing data:", error);
  }
}
