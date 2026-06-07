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
  ROSTERS_UPDATED: "monster_rosters_updated_at",
};

const COLLECTIONS = {
  CSV_FILES: "csvFiles",
  APP_DATA: "appData",
};

const ROSTERS_DOC_ID = "rosters";

const EMPTY_ROSTERS = {
  "Mets Blue": [],
  "Mets Orange": [],
};

let firestoreWriteBlocked = false;

function generateId() {
  return `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isPermissionError(error) {
  return (
    error?.code === "permission-denied" ||
    (typeof error?.message === "string" &&
      error.message.includes("Missing or insufficient permissions"))
  );
}

function markFirestoreWriteBlocked(error) {
  if (isPermissionError(error)) {
    if (!firestoreWriteBlocked) {
      console.warn(
        "Firestore writes blocked (permissions). Using localStorage as source of truth."
      );
      firestoreWriteBlocked = true;
    }
    return true;
  }
  return false;
}

function shouldUseFirestoreSync() {
  return isFirebaseConfigured && db && !firestoreWriteBlocked;
}

function normalizeRosters(teams) {
  if (!teams || typeof teams !== "object") {
    return { "Mets Blue": [], "Mets Orange": [] };
  }
  return {
    "Mets Blue": Array.isArray(teams["Mets Blue"]) ? teams["Mets Blue"] : [],
    "Mets Orange": Array.isArray(teams["Mets Orange"])
      ? teams["Mets Orange"]
      : [],
  };
}

function isDefaultRoster(teams) {
  const normalized = normalizeRosters(teams);
  const blue = normalized["Mets Blue"];
  const orange = normalized["Mets Orange"];
  const defaultBlue = [...metsBlueRoster];
  const defaultOrange = [...metsOrangeRoster];

  if (
    JSON.stringify(blue) === JSON.stringify(defaultBlue) &&
    JSON.stringify(orange) === JSON.stringify(defaultOrange)
  ) {
    return true;
  }

  // Treat partial legacy auto-seeds as defaults (subset of hardcoded names).
  const defaultNames = new Set([...defaultBlue, ...defaultOrange]);
  const storedNames = [...blue, ...orange];
  if (
    storedNames.length > 0 &&
    storedNames.every((name) => defaultNames.has(name))
  ) {
    return true;
  }

  return false;
}

function isExplicitUserRoster(data) {
  return data?.userConfigured === true;
}

function hasRosterContent(rosters) {
  return (
    rosters["Mets Blue"].length > 0 || rosters["Mets Orange"].length > 0
  );
}

function getRostersUpdatedAtLocal() {
  return localStorage.getItem(STORAGE_KEYS.ROSTERS_UPDATED) || null;
}

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

function replaceCSVFilesInLocal(files) {
  try {
    localStorage.setItem(STORAGE_KEYS.CSV_FILES, JSON.stringify(files));
  } catch (error) {
    console.error("Error saving CSV files to localStorage:", error);
    throw error;
  }
}

function appendCSVFileToLocal(fileRecord) {
  const files = loadCSVFilesFromLocal();
  const existingIndex = files.findIndex((f) => f.id === fileRecord.id);
  if (existingIndex >= 0) {
    files[existingIndex] = fileRecord;
  } else {
    files.push(fileRecord);
  }
  replaceCSVFilesInLocal(files);
  return fileRecord;
}

function saveCSVFileToLocal(fileData, existingId) {
  const newFile = {
    id: existingId || generateId(),
    name: fileData.name,
    uploaded: fileData.uploaded || new Date().toISOString(),
    week: fileData.week || "Unassigned",
    team: fileData.team || null,
    events: fileData.events,
  };
  return appendCSVFileToLocal(newFile);
}

function deleteCSVFileFromLocal(fileId) {
  const files = loadCSVFilesFromLocal();
  const filtered = files.filter((f) => f.id !== fileId);
  replaceCSVFilesInLocal(filtered);
  return filtered;
}

function updateCSVWeekInLocal(fileId, week) {
  const files = loadCSVFilesFromLocal();
  const updated = files.map((f) => (f.id === fileId ? { ...f, week } : f));
  replaceCSVFilesInLocal(updated);
  return updated;
}

function loadRostersFromLocal() {
  try {
    const updatedAt = getRostersUpdatedAtLocal();
    const stored = localStorage.getItem(STORAGE_KEYS.ROSTERS);
    if (!stored || !updatedAt) {
      if (stored) {
        localStorage.removeItem(STORAGE_KEYS.ROSTERS);
      }
      if (updatedAt) {
        localStorage.removeItem(STORAGE_KEYS.ROSTERS_UPDATED);
      }
      return { ...EMPTY_ROSTERS };
    }

    const rosters = normalizeRosters(JSON.parse(stored));
    if (isDefaultRoster(rosters)) {
      localStorage.removeItem(STORAGE_KEYS.ROSTERS);
      localStorage.removeItem(STORAGE_KEYS.ROSTERS_UPDATED);
      return { ...EMPTY_ROSTERS };
    }
    return rosters;
  } catch (error) {
    console.error("Error loading rosters:", error);
  }
  return { ...EMPTY_ROSTERS };
}

function saveRostersToLocal(rosters, updatedAt) {
  try {
    const normalized = normalizeRosters(rosters);
    localStorage.setItem(STORAGE_KEYS.ROSTERS, JSON.stringify(normalized));
    localStorage.setItem(
      STORAGE_KEYS.ROSTERS_UPDATED,
      updatedAt || new Date().toISOString()
    );
  } catch (error) {
    console.error("Error saving rosters:", error);
    throw error;
  }
}

async function pushRostersToFirestore(rosters, updatedAt) {
  await setDoc(
    doc(db, COLLECTIONS.APP_DATA, ROSTERS_DOC_ID),
    {
      teams: normalizeRosters(rosters),
      updatedAt: updatedAt || new Date().toISOString(),
      userConfigured: true,
    },
    { merge: true }
  );
}

function resolveRosterConflict(localRosters, localUpdatedAt, firestoreData) {
  const firestoreRosters = normalizeRosters(firestoreData.teams);
  const firestoreUpdatedAt = firestoreData.updatedAt || null;
  const firestoreIsUserConfigured = isExplicitUserRoster(firestoreData);

  if (localUpdatedAt) {
    if (
      !firestoreIsUserConfigured ||
      !firestoreUpdatedAt ||
      localUpdatedAt >= firestoreUpdatedAt
    ) {
      return {
        rosters: localRosters,
        updatedAt: localUpdatedAt,
        source: "local",
      };
    }
    if (isDefaultRoster(firestoreRosters)) {
      return {
        rosters: localRosters,
        updatedAt: localUpdatedAt,
        source: "local",
      };
    }
    return {
      rosters: firestoreRosters,
      updatedAt: firestoreUpdatedAt,
      source: "firestore",
    };
  }

  if (
    firestoreIsUserConfigured &&
    hasRosterContent(firestoreRosters) &&
    !isDefaultRoster(firestoreRosters)
  ) {
    return {
      rosters: firestoreRosters,
      updatedAt: firestoreUpdatedAt,
      source: "firestore",
    };
  }

  if (hasRosterContent(localRosters) && !isDefaultRoster(localRosters)) {
    return {
      rosters: localRosters,
      updatedAt: localUpdatedAt,
      source: "local",
    };
  }

  return { rosters: { ...EMPTY_ROSTERS }, updatedAt: null, source: "empty" };
}

async function tryPushRostersToFirestore(rosters, updatedAt) {
  if (!shouldUseFirestoreSync()) return false;
  try {
    await pushRostersToFirestore(rosters, updatedAt);
    return true;
  } catch (error) {
    markFirestoreWriteBlocked(error);
    console.error("Error saving rosters to Firestore:", error);
    return false;
  }
}

async function syncRostersWithFirestore() {
  const localRosters = loadRostersFromLocal();
  const localUpdatedAt = getRostersUpdatedAtLocal();

  if (!shouldUseFirestoreSync()) {
    return localRosters;
  }

  try {
    const rostersDoc = await getDoc(
      doc(db, COLLECTIONS.APP_DATA, ROSTERS_DOC_ID)
    );

    if (!rostersDoc.exists() || !rostersDoc.data().teams) {
      if (hasRosterContent(localRosters)) {
        const updatedAt = localUpdatedAt || new Date().toISOString();
        await tryPushRostersToFirestore(localRosters, updatedAt);
        saveRostersToLocal(localRosters, updatedAt);
        return localRosters;
      }
      return { ...EMPTY_ROSTERS };
    }

    const firestoreData = rostersDoc.data();
    if (
      !hasRosterContent(localRosters) &&
      !localUpdatedAt &&
      !isExplicitUserRoster(firestoreData)
    ) {
      return { ...EMPTY_ROSTERS };
    }

    if (
      !hasRosterContent(localRosters) &&
      !localUpdatedAt &&
      isDefaultRoster(firestoreData.teams)
    ) {
      return { ...EMPTY_ROSTERS };
    }

    const resolved = resolveRosterConflict(
      localRosters,
      localUpdatedAt,
      firestoreData
    );

    if (resolved.source === "local") {
      const updatedAt = resolved.updatedAt || new Date().toISOString();
      await tryPushRostersToFirestore(resolved.rosters, updatedAt);
      saveRostersToLocal(resolved.rosters, updatedAt);
      return resolved.rosters;
    }

    if (resolved.source === "firestore") {
      if (
        isExplicitUserRoster(firestoreData) &&
        !isDefaultRoster(resolved.rosters)
      ) {
        saveRostersToLocal(resolved.rosters, resolved.updatedAt);
      }
      return loadRostersFromLocal();
    }

    return resolved.rosters;
  } catch (error) {
    markFirestoreWriteBlocked(error);
    console.error("Error loading rosters from Firestore:", error);
    return localRosters;
  }
}

async function syncCSVFilesWithFirestore() {
  const localFiles = loadCSVFilesFromLocal();

  if (!shouldUseFirestoreSync()) {
    return localFiles;
  }

  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.CSV_FILES));
    const firestoreFiles = snapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    }));

    if (firestoreFiles.length > 0) {
      replaceCSVFilesInLocal(firestoreFiles);
      return firestoreFiles;
    }

    return localFiles;
  } catch (error) {
    markFirestoreWriteBlocked(error);
    console.error("Error loading CSV files from Firestore:", error);
    return localFiles;
  }
}

export async function loadCSVFiles() {
  if (!isFirebaseConfigured || !db) {
    return loadCSVFilesFromLocal();
  }
  try {
    return await syncCSVFilesWithFirestore();
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

  const localFile = saveCSVFileToLocal(filePayload);

  if (!isFirebaseConfigured || !db || !shouldUseFirestoreSync()) {
    return localFile;
  }

  try {
    const docRef = await addDoc(
      collection(db, COLLECTIONS.CSV_FILES),
      filePayload
    );
    const cloudFile = {
      id: docRef.id,
      ...filePayload,
    };
    deleteCSVFileFromLocal(localFile.id);
    appendCSVFileToLocal(cloudFile);
    return cloudFile;
  } catch (error) {
    markFirestoreWriteBlocked(error);
    console.error("Error saving CSV file to Firestore:", error);
    return localFile;
  }
}

export async function deleteCSVFile(fileId) {
  deleteCSVFileFromLocal(fileId);

  if (!isFirebaseConfigured || !db || !shouldUseFirestoreSync()) {
    return loadCSVFilesFromLocal();
  }

  try {
    await deleteDoc(doc(db, COLLECTIONS.CSV_FILES, fileId));
  } catch (error) {
    markFirestoreWriteBlocked(error);
    console.error("Error deleting CSV file from Firestore:", error);
  }

  return loadCSVFilesFromLocal();
}

export async function updateCSVWeek(fileId, week) {
  updateCSVWeekInLocal(fileId, week);

  if (!isFirebaseConfigured || !db || !shouldUseFirestoreSync()) {
    return loadCSVFilesFromLocal();
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
  } catch (error) {
    if (!markFirestoreWriteBlocked(error)) {
      console.error("Error updating CSV week in Firestore:", error);
      throw error;
    }
  }

  return loadCSVFilesFromLocal();
}

export async function loadRosters() {
  if (!isFirebaseConfigured || !db) {
    return loadRostersFromLocal();
  }
  try {
    return await syncRostersWithFirestore();
  } catch (error) {
    console.error("Error loading rosters from Firestore:", error);
    return loadRostersFromLocal();
  }
}

export async function saveRosters(rosters) {
  const updatedAt = new Date().toISOString();
  const normalized = normalizeRosters(rosters);
  saveRostersToLocal(normalized, updatedAt);

  if (!isFirebaseConfigured || !db) {
    return;
  }

  await tryPushRostersToFirestore(normalized, updatedAt);
}

export function subscribeToCSVFiles(onData, onError) {
  if (!isFirebaseConfigured || !db) {
    onData(loadCSVFilesFromLocal());
    return () => {};
  }

  return onSnapshot(
    collection(db, COLLECTIONS.CSV_FILES),
    (snapshot) => {
      if (firestoreWriteBlocked) {
        onData(loadCSVFilesFromLocal());
        return;
      }

      const files = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data(),
      }));

      if (files.length > 0) {
        replaceCSVFilesInLocal(files);
        onData(files);
        return;
      }

      onData(loadCSVFilesFromLocal());
    },
    (error) => {
      markFirestoreWriteBlocked(error);
      console.error("CSV file subscription error:", error);
      onData(loadCSVFilesFromLocal());
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
      if (firestoreWriteBlocked) {
        onData(loadRostersFromLocal());
        return;
      }

      if (snapshot.exists() && snapshot.data().teams) {
        const firestoreData = snapshot.data();
        const localRosters = loadRostersFromLocal();
        const localUpdatedAt = getRostersUpdatedAtLocal();

        if (
          !hasRosterContent(localRosters) &&
          !localUpdatedAt &&
          (!isExplicitUserRoster(firestoreData) ||
            isDefaultRoster(firestoreData.teams))
        ) {
          onData({ ...EMPTY_ROSTERS });
          return;
        }

        const resolved = resolveRosterConflict(
          localRosters,
          localUpdatedAt,
          firestoreData
        );

        if (resolved.source === "local") {
          const updatedAt = resolved.updatedAt || new Date().toISOString();
          await tryPushRostersToFirestore(resolved.rosters, updatedAt);
          saveRostersToLocal(resolved.rosters, updatedAt);
        } else if (
          resolved.source === "firestore" &&
          isExplicitUserRoster(firestoreData) &&
          !isDefaultRoster(resolved.rosters)
        ) {
          saveRostersToLocal(resolved.rosters, resolved.updatedAt);
        }

        onData(loadRostersFromLocal());
        return;
      }

      onData(loadRostersFromLocal());
    },
    (error) => {
      markFirestoreWriteBlocked(error);
      console.error("Roster subscription error:", error);
      onData(loadRostersFromLocal());
      if (onError) onError(error);
    }
  );
}

export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CSV_FILES);
    localStorage.removeItem(STORAGE_KEYS.ROSTERS);
    localStorage.removeItem(STORAGE_KEYS.ROSTERS_UPDATED);
  } catch (error) {
    console.error("Error clearing data:", error);
  }
}
