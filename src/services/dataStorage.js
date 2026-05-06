import { metsBlueRoster, metsOrangeRoster } from "../utils/constants";

const STORAGE_KEYS = {
  CSV_FILES: "monster_csv_files",
  ROSTERS: "monster_rosters",
};

// Generate unique ID for CSV files
function generateId() {
  return `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Load CSV files from localStorage
export function loadCSVFiles() {
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
export function saveCSVFile(fileData) {
  try {
    const files = loadCSVFiles();
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
export function deleteCSVFile(fileId) {
  try {
    const files = loadCSVFiles();
    const filtered = files.filter((f) => f.id !== fileId);
    localStorage.setItem(STORAGE_KEYS.CSV_FILES, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error("Error deleting CSV file:", error);
    throw error;
  }
}

// Update CSV file week assignment
export function updateCSVWeek(fileId, week) {
  try {
    const files = loadCSVFiles();
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
export function loadRosters() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ROSTERS);
    if (stored) {
      return JSON.parse(stored);
    }
    // First time - initialize with default rosters
    const defaultRosters = {
      "Mets Blue": [...metsBlueRoster],
      "Mets Orange": [...metsOrangeRoster],
    };
    saveRosters(defaultRosters);
    return defaultRosters;
  } catch (error) {
    console.error("Error loading rosters:", error);
    // Fallback to defaults
    return {
      "Mets Blue": [...metsBlueRoster],
      "Mets Orange": [...metsOrangeRoster],
    };
  }
}

// Save rosters to localStorage
export function saveRosters(rosters) {
  try {
    localStorage.setItem(STORAGE_KEYS.ROSTERS, JSON.stringify(rosters));
  } catch (error) {
    console.error("Error saving rosters:", error);
    throw error;
  }
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
