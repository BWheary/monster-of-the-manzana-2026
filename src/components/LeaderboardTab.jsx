import React from "react";

export default function LeaderboardTab({
  playerScores,
  locale,
}) {
  const bluePlayers = playerScores
    .filter((p) => p.team === "Mets Blue")
    .sort((a, b) => b.score - a.score);

  const orangePlayers = playerScores
    .filter((p) => p.team === "Mets Orange")
    .sort((a, b) => b.score - a.score);

  return (
    <div className="leaderboard-container">
      <div className="teams-row">
        <div className="team-col">
          <div className="team-blue">{locale.teamBlue}</div>
          <ul className="team-list">
            {bluePlayers.map((player, idx) => (
              <li key={player.player} className="player-row">
                <span>
                  {idx === 0 && <span className="crown">👑</span>}
                  {player.player}
                </span>
                <span className="score">{player.score}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="team-col">
          <div className="team-orange">{locale.teamOrange}</div>
          <ul className="team-list">
            {orangePlayers.map((player, idx) => (
              <li key={player.player} className="player-row">
                <span>
                  {idx === 0 && <span className="crown">👑</span>}
                  {player.player}
                </span>
                <span className="score">{player.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
