import { SCORING_POINTS } from "../utils/constants";

// Calculate player score from events
// This logic is EXACTLY the same as the original calculatePlayerScore function
export function calculatePlayerScore(player, allXbhEvents, allHardEvents, allSwingEvents, allMissEvents, allTakeEvents) {
  const xbhCount = allXbhEvents.filter((ev) => ev.player === player).length;
  const hardCount = allHardEvents.filter((ev) => ev.player === player).length;
  const swingCount = allSwingEvents.filter((ev) => ev.player === player).length;
  const missCount = allMissEvents.filter((ev) => ev.player === player).length;
  const takeCount = allTakeEvents.filter((ev) => ev.player === player).length;

  const score =
    xbhCount * SCORING_POINTS.xbh +
    hardCount * SCORING_POINTS.hard +
    swingCount * SCORING_POINTS.swing +
    missCount * SCORING_POINTS.miss +
    takeCount * SCORING_POINTS.take;

  return score;
}

// Calculate scores for all players
export function calculateAllPlayerScores(players, allXbhEvents, allHardEvents, allSwingEvents, allMissEvents, allTakeEvents) {
  return players.map((player) => ({
    player,
    score: calculatePlayerScore(
      player,
      allXbhEvents,
      allHardEvents,
      allSwingEvents,
      allMissEvents,
      allTakeEvents
    ),
  }));
}
