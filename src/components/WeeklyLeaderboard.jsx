import React from "react";

export default function WeeklyLeaderboard({
  weeklyWinners,
  locale,
}) {
  if (!weeklyWinners) {
    return null;
  }

  return (
    <div className="weekly-winners-container">
      <h3 className="weekly-winners-title">{locale.weeklyWinners}</h3>
      <div className="teams-row">
        <div className="team-col">
          <h4 className="team-blue">{locale.teamBlue}</h4>
          <ul className="team-list">
            {weeklyWinners.blue.map((p, i) => (
              <li key={p.player} className="player-row">
                <span>
                  {i === 0 && <span className="crown">👑</span>}
                  {p.player}
                </span>
                <span className="score">{p.score}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="team-col">
          <h4 className="team-orange">{locale.teamOrange}</h4>
          <ul className="team-list">
            {weeklyWinners.orange.map((p, i) => (
              <li key={p.player} className="player-row">
                <span>
                  {i === 0 && <span className="crown">👑</span>}
                  {p.player}
                </span>
                <span className="score">{p.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
