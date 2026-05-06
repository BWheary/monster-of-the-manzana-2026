import React, { useState } from "react";
import StrikeZoneGraphic from "./StrikeZoneGraphic";

export default function EventTab({
  icon,
  label,
  type,
  events = [],
  locale,
  selectedPlayer,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipContent, setTooltipContent] = useState(null);

  // Filter events for selected player
  const filteredEvents = events.filter((ev) => ev.player === selectedPlayer);

  // Tooltip content generator
  function getTooltipContent(ev) {
    if (!ev) return null;

    if (type === "xbh" || type === "hard" || type === "swing") {
      return (
        <div>
          <div>
            <b>{locale.opponent}:</b> {ev.opponent}
          </div>
          <div>
            <b>{locale.pitchType}:</b> {ev.pitchType}
          </div>
          <div>
            <b>{locale.exitVelocity}:</b> {ev.exitV}
          </div>
          <div>
            <b>{locale.launchAngle}:</b> {ev.angle}
          </div>
        </div>
      );
    } else if (type === "miss" || type === "take") {
      return (
        <div>
          <div>
            <b>{locale.opponent}:</b> {ev.opponent}
          </div>
          <div>
            <b>{locale.pitchType}:</b> {ev.pitchType}
          </div>
          <div>
            <b>{locale.pitchVelocity}:</b> {ev.relSpeed}
          </div>
          <div>
            <b>{locale.ivb}:</b> {ev.ivb}
          </div>
          <div>
            <b>{locale.hb}:</b> {ev.hb}
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div>
      <h2 className="xbh-tab-title">
        <span role="img" aria-label="icon">
          {icon}
        </span>{" "}
        <span>{label}</span>
      </h2>
      <div className="xbh-graphic-details-row">
        <div className="xbh-zone-graphic">
          <StrikeZoneGraphic
            events={filteredEvents}
            hoveredIndex={hoveredIndex}
            onHover={setHoveredIndex}
            tooltipContent={tooltipContent}
            setTooltipContent={(tip) => {
              if (tip && typeof tip.index === "number") {
                setTooltipContent({
                  ...tip,
                  children: getTooltipContent(filteredEvents[tip.index]),
                });
              } else {
                setTooltipContent(null);
              }
            }}
          />
        </div>
        <div className="xbh-details-table">
          <table>
            <thead>
              <tr>
                <th>{locale.opponent}</th>
                <th>{locale.pitchType}</th>
                {type === "xbh" && (
                  <>
                    <th>{locale.playResult}</th>
                    <th>{locale.exitVelocity}</th>
                  </>
                )}
                {(type === "hard" || type === "swing") && (
                  <>
                    <th>{locale.exitVelocity}</th>
                    <th>{locale.launchAngle}</th>
                  </>
                )}
                {(type === "miss" || type === "take") && (
                  <>
                    <th>{locale.pitchVelocity}</th>
                    <th>{locale.ivb}</th>
                    <th>{locale.hb}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {type === "xbh" && filteredEvents.length > 0
                ? filteredEvents.map((ev, i) => (
                    <tr
                      key={i}
                      style={
                        hoveredIndex === i ? { background: "#ffe5e5" } : {}
                      }
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <td>{ev.opponent}</td>
                      <td>{ev.pitchType}</td>
                      <td>{ev.playResult}</td>
                      <td>{ev.exitV}</td>
                    </tr>
                  ))
                : null}
              {(type === "hard" || type === "swing") &&
              filteredEvents.length > 0
                ? filteredEvents.map((ev, i) => (
                    <tr
                      key={i}
                      style={
                        hoveredIndex === i ? { background: "#ffe5e5" } : {}
                      }
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <td>{ev.opponent}</td>
                      <td>{ev.pitchType}</td>
                      <td>{ev.exitV}</td>
                      <td>{ev.angle}</td>
                    </tr>
                  ))
                : null}
              {(type === "miss" || type === "take") && filteredEvents.length > 0
                ? filteredEvents.map((ev, i) => (
                    <tr
                      key={i}
                      style={
                        hoveredIndex === i ? { background: "#ffe5e5" } : {}
                      }
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <td>{ev.opponent}</td>
                      <td>{ev.pitchType}</td>
                      <td>{ev.relSpeed}</td>
                      <td>{ev.ivb}</td>
                      <td>{ev.hb}</td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
