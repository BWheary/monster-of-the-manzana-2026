import React, { useState } from "react";
import CSVUploadForm from "./CSVUploadForm";

export default function DataUploadModal({
  csvFiles,
  onUpload,
  onClose,
  onDeleteCsv,
  locale,
  language,
}) {
  const [activeSubTab, setActiveSubTab] = useState("upload"); // "upload" or "previous"
  const [filterTeam, setFilterTeam] = useState(null); // null = show all, "Mets Blue" or "Mets Orange"

  return (
    <div className="modal-overlay">
      <div className="modal-content data-upload-modal">
        <div className="modal-header">
          <h2>{locale.dataUpload}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Subtabs */}
        <div className="data-upload-subtabs">
          <button
            className={`subtab-btn ${activeSubTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveSubTab("upload")}
          >
            {locale.uploadCsv}
          </button>
          <button
            className={`subtab-btn ${activeSubTab === "previous" ? "active" : ""}`}
            onClick={() => setActiveSubTab("previous")}
          >
            {locale.previousCsv} ({csvFiles.length})
          </button>
        </div>

        {/* Content based on active subtab */}
        <div className="data-upload-content">
          {activeSubTab === "upload" && (
            <CSVUploadForm
              onUpload={(file, week, team) => {
                onUpload(file, week, team);
                setActiveSubTab("previous"); // Switch to previous tab after upload
              }}
              onClose={onClose}
              locale={locale}
              language={language}
            />
          )}

          {activeSubTab === "previous" && (
            <div className="previous-csv-content">
              <div className="csv-list-header">
                <span>{locale.loadedFiles} ({csvFiles.length})</span>
              </div>
              <div className="team-filter-section">
                <label>Filter by Team (Optional):</label>
                <div className="team-toggle">
                  <button
                    type="button"
                    className={`team-toggle-btn ${filterTeam === "Mets Blue" ? "active blue" : ""}`}
                    onClick={() => setFilterTeam(filterTeam === "Mets Blue" ? null : "Mets Blue")}
                  >
                    {locale.teamBlue}
                  </button>
                  <button
                    type="button"
                    className={`team-toggle-btn ${filterTeam === "Mets Orange" ? "active orange" : ""}`}
                    onClick={() => setFilterTeam(filterTeam === "Mets Orange" ? null : "Mets Orange")}
                  >
                    {locale.teamOrange}
                  </button>
                </div>
              </div>
              {csvFiles.length > 0 ? (
                <div className="csv-list-container" style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {csvFiles
                    .filter((file) => !filterTeam || file.team === filterTeam)
                    .map((file) => {
                      const teamClass =
                        file.team === "Mets Blue"
                          ? "csv-blue"
                          : file.team === "Mets Orange"
                          ? "csv-orange"
                          : "";
                      return (
                        <div key={file.id} className="csv-item">
                          <div className="csv-item-info">
                            <span className="csv-name">{file.name}</span>
                            <span className={`csv-week ${teamClass}`}>{file.week}</span>
                            <span className={`csv-time ${teamClass}`}>
                              {new Date(file.uploaded).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            className="delete-csv"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCsv(file.id);
                            }}
                            title="Delete CSV"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="csv-empty-state">{locale.noFiles}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
