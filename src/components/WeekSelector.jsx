import React from "react";

export default function WeekSelector({
  selectedWeek,
  onWeekChange,
  weekRanges,
  locale,
}) {
  return (
    <div className="week-selector-container">
      <label htmlFor="week-select" className="week-selector-label">
        {locale.selectWeek}:
      </label>
      <select
        id="week-select"
        value={selectedWeek}
        onChange={(e) => onWeekChange(e.target.value)}
        className="week-selector"
      >
        <option value="All Season">{locale.allSeason}</option>
        {weekRanges.map((week) => (
          <option key={week.label} value={week.label}>
            {week.label}
          </option>
        ))}
        <option value="Unassigned">{locale.unassigned}</option>
      </select>
    </div>
  );
}
