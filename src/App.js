import React, { useState, useRef, useEffect } from "react";
import "./styles.css";
import {
  locales,
  weekRangesEn,
  weekRangesEs,
} from "./utils/constants";
import {
  loadCSVFiles,
  saveCSVFile,
  deleteCSVFile,
  loadRosters,
  saveRosters,
} from "./services/dataStorage";
import { parseCSVFile } from "./services/csvParser";
import { calculateAllPlayerScores } from "./services/scoring";
import { getWeeklyWinners } from "./services/weekUtils";
import StrikeZoneGraphic from "./components/StrikeZoneGraphic";
import EventTab from "./components/EventTab";
import LeaderboardTab from "./components/LeaderboardTab";
import WeekSelector from "./components/WeekSelector";
import WeeklyLeaderboard from "./components/WeeklyLeaderboard";
import PlayerManagement from "./components/PlayerManagement";
import DataUploadModal from "./components/DataUploadModal";

function App() {
  const [language, setLanguage] = useState("en");
  const [csvFiles, setCsvFiles] = useState([]);
  const [rosters, setRosters] = useState({ "Mets Blue": [], "Mets Orange": [] });
  const [activeTab, setActiveTab] = useState("monster");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("All Season");
  const [showDataUploadModal, setShowDataUploadModal] = useState(false);
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const locale = locales[language];
  const weekRanges = language === "es" ? weekRangesEs : weekRangesEn;

  // Load data on mount
  useEffect(() => {
    const loadedFiles = loadCSVFiles();
    const loadedRosters = loadRosters();
    setCsvFiles(loadedFiles);
    setRosters(loadedRosters);
  }, []);

  // Build players array from rosters
  const players = [
    ...rosters["Mets Blue"].map((name) => ({ name, team: "Mets Blue" })),
    ...rosters["Mets Orange"].map((name) => ({ name, team: "Mets Orange" })),
  ];

  const sortedPlayersForDropdown = [...players].sort((a, b) =>
    a.name.localeCompare(b.name)
  );


  // Filter events by selected week
  const getFilteredEvents = (eventType) => {
    if (selectedWeek === "All Season") {
      // Aggregate ALL events from ALL CSV files regardless of week assignment
      return csvFiles.flatMap((f) => f.events[eventType] || []);
    }
    if (selectedWeek === "Unassigned") {
      return csvFiles
        .filter((f) => !f.week || f.week === "Unassigned")
        .flatMap((f) => f.events[eventType] || []);
    }
    // Filter by specific week
    const weekFiles = csvFiles.filter((f) => f.week === selectedWeek);
    return weekFiles.flatMap((f) => f.events[eventType] || []);
  };

  // Combine all events from filtered CSVs
  const allXbhEvents = getFilteredEvents("xbh");
  const allHardEvents = getFilteredEvents("hard");
  const allMissEvents = getFilteredEvents("miss");
  const allTakeEvents = getFilteredEvents("take");
  const allSwingEvents = getFilteredEvents("swing");

  // Filter events to only include players currently in rosters
  // This ensures removed players don't appear in leaderboards
  const playerNamesSet = new Set(players.map((p) => p.name));
  const filterByCurrentRoster = (events) =>
    events.filter((ev) => playerNamesSet.has(ev.player));

  const filteredXbhEvents = filterByCurrentRoster(allXbhEvents);
  const filteredHardEvents = filterByCurrentRoster(allHardEvents);
  const filteredMissEvents = filterByCurrentRoster(allMissEvents);
  const filteredTakeEvents = filterByCurrentRoster(allTakeEvents);
  const filteredSwingEvents = filterByCurrentRoster(allSwingEvents);

  // Calculate player scores with team info (only for current roster players)
  // calculateAllPlayerScores expects an array of player name strings
  const playerNamesArray = players.map((p) => p.name);
  const playerScores = calculateAllPlayerScores(
    playerNamesArray,
    filteredXbhEvents,
    filteredHardEvents,
    filteredSwingEvents,
    filteredMissEvents,
    filteredTakeEvents
  ).map((p) => {
    const playerInfo = players.find((pl) => pl.name === p.player);
    return {
      ...p,
      team: playerInfo ? playerInfo.team : "Unknown",
    };
  });


  // Get weekly winners
  const weeklyWinners = getWeeklyWinners(
    csvFiles,
    players,
    selectedWeek,
    (player, allXbhEvents, allHardEvents, allSwingEvents, allMissEvents, allTakeEvents) => {
      return calculateAllPlayerScores(
        [player],
        allXbhEvents,
        allHardEvents,
        allSwingEvents,
        allMissEvents,
        allTakeEvents
      )[0]?.score || 0;
    }
  );

  const handleFileUpload = async (file, week, team) => {
    try {
      const result = await parseCSVFile(file, players);
      const savedFile = saveCSVFile({
        name: file.name,
        week,
        team: team || null, // Optional team selection
        events: result.events,
      });
      setCsvFiles((prev) => [...prev, savedFile]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading CSV: " + error.message);
    }
  };

  const handleRemoveCsv = (fileId) => {
    const updated = deleteCSVFile(fileId);
    setCsvFiles(updated);
  };

  const handleRosterChange = (newRosters) => {
    setRosters(newRosters);
    saveRosters(newRosters);
  };

  return (
    <div className="app-container">
      <header>
        <h1 className="main-title">
          <span role="img" aria-label="apple">
            🍎
          </span>{" "}
          {locale.title}{" "}
          <span role="img" aria-label="apple">
            🍎
          </span>
        </h1>
        <div className="button-group">
          <button
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
          >
            EN
          </button>
          <button
            className={language === "es" ? "active" : ""}
            onClick={() => setLanguage("es")}
          >
            ES
          </button>
          <button onClick={() => setShowDataUploadModal(true)}>
            {locale.dataUpload}
          </button>
          <button onClick={() => setShowPlayerManagement(true)}>
            {locale.managePlayers}
          </button>
        </div>
      </header>

      <WeekSelector
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        weekRanges={weekRanges}
        locale={locale}
      />

      <div className="centered-dropdown">
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          className="player-dropdown"
        >
          <option value="">{locale.allPlayers}</option>
          {sortedPlayersForDropdown.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="tab-nav">
        <button
          className={activeTab === "monster" ? "active" : ""}
          onClick={() => setActiveTab("monster")}
        >
          {locale.leaderboard}
        </button>
        <button
          className={activeTab === "xbh" ? "active" : ""}
          onClick={() => setActiveTab("xbh")}
        >
          🚀 {locale.xbh} +3
        </button>
        <button
          className={activeTab === "hard" ? "active" : ""}
          onClick={() => setActiveTab("hard")}
        >
          🔥 {locale.hard} +2
        </button>
        <button
          className={activeTab === "swing" ? "active" : ""}
          onClick={() => setActiveTab("swing")}
        >
          ✅ {locale.swing} +1
        </button>
        <button
          className={activeTab === "miss" ? "active" : ""}
          onClick={() => setActiveTab("miss")}
        >
          ❌ {locale.miss} -1
        </button>
        <button
          className={activeTab === "take" ? "active" : ""}
          onClick={() => setActiveTab("take")}
        >
          👀 {locale.take} -3
        </button>
      </div>

      <main>
        {activeTab === "monster" && (
          <>
            {selectedWeek === "All Season" ? (
              <>
                <LeaderboardTab playerScores={playerScores} locale={locale} />
                <div style={{ textAlign: "center", marginTop: "24px", color: "#444", fontSize: "0.85rem", opacity: 0.6 }}>
                  Aggregating data from {csvFiles.length} CSV file{csvFiles.length !== 1 ? "s" : ""}
                </div>
              </>
            ) : (
              <>
                {weeklyWinners && (
                  <WeeklyLeaderboard weeklyWinners={weeklyWinners} locale={locale} />
                )}
              </>
            )}
          </>
        )}
        {activeTab === "xbh" && (
          <EventTab
            icon="🚀"
            label={locale.xbh}
            type="xbh"
            events={filteredXbhEvents}
            locale={locale}
            selectedPlayer={selectedPlayer}
          />
        )}
        {activeTab === "hard" && (
          <EventTab
            icon="🔥"
            label={locale.hard}
            type="hard"
            events={filteredHardEvents}
            locale={locale}
            selectedPlayer={selectedPlayer}
          />
        )}
        {activeTab === "swing" && (
          <EventTab
            icon="✅"
            label={locale.swing}
            type="swing"
            events={filteredSwingEvents}
            locale={locale}
            selectedPlayer={selectedPlayer}
          />
        )}
        {activeTab === "miss" && (
          <EventTab
            icon="❌"
            label={locale.miss}
            type="miss"
            events={filteredMissEvents}
            locale={locale}
            selectedPlayer={selectedPlayer}
          />
        )}
        {activeTab === "take" && (
          <EventTab
            icon="👀"
            label={locale.take}
            type="take"
            events={filteredTakeEvents}
            locale={locale}
            selectedPlayer={selectedPlayer}
          />
        )}
      </main>

      {showDataUploadModal && (
        <DataUploadModal
          csvFiles={csvFiles}
          onUpload={handleFileUpload}
          onClose={() => setShowDataUploadModal(false)}
          onDeleteCsv={handleRemoveCsv}
          locale={locale}
          language={language}
        />
      )}

      {showPlayerManagement && (
        <PlayerManagement
          rosters={rosters}
          onRosterChange={handleRosterChange}
          locale={locale}
          onClose={() => setShowPlayerManagement(false)}
        />
      )}
    </div>
  );
}

export default App;
