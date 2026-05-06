// Filter events by week
export function filterEventsByWeek(events, selectedWeek) {
  if (!selectedWeek || selectedWeek === "All Season" || selectedWeek === "Unassigned") {
    return events;
  }
  return events.filter((event) => event.week === selectedWeek);
}

// Get all unique weeks from CSV files
export function getAvailableWeeks(csvFiles) {
  const weeks = new Set();
  csvFiles.forEach((file) => {
    if (file.week && file.week !== "Unassigned") {
      weeks.add(file.week);
    }
  });
  return Array.from(weeks).sort();
}

// Get weekly winners for a specific week
export function getWeeklyWinners(csvFiles, players, selectedWeek, calculateScoreFn) {
  if (!selectedWeek || selectedWeek === "All Season") {
    return null;
  }

  // Filter CSV files for this week
  const weekFiles = csvFiles.filter((f) => f.week === selectedWeek);
  
  if (weekFiles.length === 0) {
    return null;
  }

  // Combine events for this week only
  const weekXbhEvents = weekFiles.flatMap((f) => f.events.xbh || []);
  const weekHardEvents = weekFiles.flatMap((f) => f.events.hard || []);
  const weekSwingEvents = weekFiles.flatMap((f) => f.events.swing || []);
  const weekMissEvents = weekFiles.flatMap((f) => f.events.miss || []);
  const weekTakeEvents = weekFiles.flatMap((f) => f.events.take || []);

  // Filter events to only include players currently in rosters
  const playerNames = new Set(players.map((p) => p.name));
  const filterByCurrentRoster = (events) =>
    events.filter((ev) => playerNames.has(ev.player));

  const filteredWeekXbhEvents = filterByCurrentRoster(weekXbhEvents);
  const filteredWeekHardEvents = filterByCurrentRoster(weekHardEvents);
  const filteredWeekSwingEvents = filterByCurrentRoster(weekSwingEvents);
  const filteredWeekMissEvents = filterByCurrentRoster(weekMissEvents);
  const filteredWeekTakeEvents = filterByCurrentRoster(weekTakeEvents);

  // Calculate scores for this week (only for current roster players)
  // calculateScoreFn expects player name as first parameter
  const weekScores = players.map((playerObj) => {
    const playerName = typeof playerObj === 'string' ? playerObj : playerObj.name;
    const playerTeam = typeof playerObj === 'string' ? 'Unknown' : playerObj.team;
    return {
      player: playerName,
      team: playerTeam,
      score: calculateScoreFn(
        playerName,
        filteredWeekXbhEvents,
        filteredWeekHardEvents,
        filteredWeekSwingEvents,
        filteredWeekMissEvents,
        filteredWeekTakeEvents
      ),
    };
  });

  // Group by team and find winners
  const blueScores = weekScores
    .filter((p) => p.team === "Mets Blue")
    .sort((a, b) => b.score - a.score);
  
  const orangeScores = weekScores
    .filter((p) => p.team === "Mets Orange")
    .sort((a, b) => b.score - a.score);

  return {
    week: selectedWeek,
    blue: blueScores,
    orange: orangeScores,
  };
}
