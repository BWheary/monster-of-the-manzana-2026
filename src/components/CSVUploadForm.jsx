import React, { useState } from "react";
import { weekRangesEn, weekRangesEs } from "../utils/constants";

export default function CSVUploadForm({
  onUpload,
  onClose,
  locale,
  language,
}) {
  const [selectedWeek, setSelectedWeek] = useState("");
  const [file, setFile] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const fileInputRef = React.useRef(null);

  const weekRanges = language === "es" ? weekRangesEs : weekRangesEn;

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!file) {
      alert("Please select a file");
      return;
    }
    if (!selectedWeek) {
      alert("Please select a week");
      return;
    }
    onUpload(file, selectedWeek, selectedTeam);
    setFile(null);
    setSelectedWeek("");
    setSelectedTeam(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="modal-body">
        <div className="form-group">
          <label htmlFor="csv-file">{locale.selectWeek}:</label>
          <select
            id="week-select-upload"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="week-selector"
            required
          >
            <option value="">{locale.selectWeek}...</option>
            {weekRanges.map((week) => (
              <option key={week.label} value={week.label}>
                {week.label}
              </option>
            ))}
            <option value="Unassigned">{locale.unassigned}</option>
          </select>
        </div>
        <div className="form-group">
          <label>Team (Optional):</label>
          <div className="team-toggle">
            <button
              type="button"
              className={`team-toggle-btn ${selectedTeam === "Mets Blue" ? "active blue" : ""}`}
              onClick={() => setSelectedTeam(selectedTeam === "Mets Blue" ? null : "Mets Blue")}
            >
              {locale.teamBlue}
            </button>
            <button
              type="button"
              className={`team-toggle-btn ${selectedTeam === "Mets Orange" ? "active orange" : ""}`}
              onClick={() => setSelectedTeam(selectedTeam === "Mets Orange" ? null : "Mets Orange")}
            >
              {locale.teamOrange}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="csv-file">CSV File:</label>
          <input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
          {file && <div className="file-name">{file.name}</div>}
        </div>
      </div>
      <div className="modal-footer">
        <button onClick={handleUpload} className="upload-btn" disabled={!file || !selectedWeek}>
          {locale.uploadCsv}
        </button>
        <button onClick={onClose} className="cancel-btn">
          {locale.cancel}
        </button>
      </div>
    </>
  );
}
