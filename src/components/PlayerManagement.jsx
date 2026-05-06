import React, { useState } from "react";

export default function PlayerManagement({
  rosters,
  onRosterChange,
  locale,
  onClose,
}) {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerTeam, setNewPlayerTeam] = useState("Mets Blue");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;

    // Check if player already exists in this team
    if (rosters[newPlayerTeam].includes(trimmedName)) {
      alert(`Player "${trimmedName}" already exists in ${newPlayerTeam}`);
      return;
    }

    const updatedRosters = {
      ...rosters,
      [newPlayerTeam]: [...rosters[newPlayerTeam], trimmedName],
    };
    onRosterChange(updatedRosters);
    setNewPlayerName("");
    setShowAddForm(false);
  };

  const handleEditPlayer = (team, oldName, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    // Check if new name already exists in this team
    if (trimmedName !== oldName && rosters[team].includes(trimmedName)) {
      alert(`Player "${trimmedName}" already exists in ${team}`);
      return;
    }

    const updatedRosters = {
      ...rosters,
      [team]: rosters[team].map((name) => (name === oldName ? trimmedName : name)),
    };
    onRosterChange(updatedRosters);
    setEditingPlayer(null);
  };

  const handleDeletePlayer = (team, playerName) => {
    if (window.confirm(`Remove "${playerName}" from ${team}?`)) {
      const updatedRosters = {
        ...rosters,
        [team]: rosters[team].filter((name) => name !== playerName),
      };
      onRosterChange(updatedRosters);
    }
  };

  return (
    <div className="player-management-overlay">
      <div className="player-management-modal">
        <div className="player-management-header">
          <h2>{locale.managePlayers}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="player-management-content">
          <div className="player-management-teams">
            {/* Mets Blue */}
            <div className="player-management-team">
              <h3 className="team-blue">{locale.teamBlue}</h3>
              <ul className="player-list">
                {rosters["Mets Blue"].map((player, idx) => (
                  <li key={idx} className="player-item">
                    {editingPlayer?.team === "Mets Blue" &&
                    editingPlayer?.index === idx ? (
                      <input
                        type="text"
                        defaultValue={player}
                        onBlur={(e) =>
                          handleEditPlayer("Mets Blue", player, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleEditPlayer("Mets Blue", player, e.target.value);
                          } else if (e.key === "Escape") {
                            setEditingPlayer(null);
                          }
                        }}
                        autoFocus
                        className="player-edit-input"
                      />
                    ) : (
                      <div className="player-name-row">
                        <span className="player-name">{player}</span>
                        <div className="player-actions">
                          <button
                            className="edit-btn"
                            onClick={() =>
                              setEditingPlayer({ team: "Mets Blue", index: idx })
                            }
                          >
                            {locale.editPlayer}
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeletePlayer("Mets Blue", player)}
                          >
                            {locale.deletePlayer}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <button
                className="add-player-btn"
                onClick={() => {
                  setNewPlayerTeam("Mets Blue");
                  setShowAddForm(true);
                }}
              >
                + {locale.addPlayer}
              </button>
            </div>

            {/* Mets Orange */}
            <div className="player-management-team">
              <h3 className="team-orange">{locale.teamOrange}</h3>
              <ul className="player-list">
                {rosters["Mets Orange"].map((player, idx) => (
                  <li key={idx} className="player-item">
                    {editingPlayer?.team === "Mets Orange" &&
                    editingPlayer?.index === idx ? (
                      <input
                        type="text"
                        defaultValue={player}
                        onBlur={(e) =>
                          handleEditPlayer("Mets Orange", player, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleEditPlayer("Mets Orange", player, e.target.value);
                          } else if (e.key === "Escape") {
                            setEditingPlayer(null);
                          }
                        }}
                        autoFocus
                        className="player-edit-input"
                      />
                    ) : (
                      <div className="player-name-row">
                        <span className="player-name">{player}</span>
                        <div className="player-actions">
                          <button
                            className="edit-btn"
                            onClick={() =>
                              setEditingPlayer({ team: "Mets Orange", index: idx })
                            }
                          >
                            {locale.editPlayer}
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDeletePlayer("Mets Orange", player)
                            }
                          >
                            {locale.deletePlayer}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <button
                className="add-player-btn"
                onClick={() => {
                  setNewPlayerTeam("Mets Orange");
                  setShowAddForm(true);
                }}
              >
                + {locale.addPlayer}
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="add-player-form">
              <h4>{locale.addPlayer}</h4>
              <div className="form-row">
                <select
                  value={newPlayerTeam}
                  onChange={(e) => setNewPlayerTeam(e.target.value)}
                  className="team-select"
                >
                  <option value="Mets Blue">{locale.teamBlue}</option>
                  <option value="Mets Orange">{locale.teamOrange}</option>
                </select>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder={locale.playerName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddPlayer();
                    } else if (e.key === "Escape") {
                      setShowAddForm(false);
                      setNewPlayerName("");
                    }
                  }}
                  className="player-name-input"
                  autoFocus
                />
                <button onClick={handleAddPlayer} className="save-btn">
                  {locale.save}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewPlayerName("");
                  }}
                  className="cancel-btn"
                >
                  {locale.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
