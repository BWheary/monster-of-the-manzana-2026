import React, { useRef } from "react";

export default function StrikeZoneGraphic({
  events = [],
  hoveredIndex,
  onHover,
  tooltipContent,
  setTooltipContent,
}) {
  const pad = 20,
    size = 180;
  const xMin = -1,
    xMax = 1,
    yMin = 1,
    yMax = 4;
  const mapX = (x) => pad + ((x - xMin) / (xMax - xMin)) * size;
  const mapY = (y) => pad + ((yMax - y) / (yMax - yMin)) * size;
  const axMin = -0.56,
    axMax = 0.56,
    ayMin = 1.833,
    ayMax = 3.167;
  const ax = mapX(axMin),
    ay = mapY(ayMax);
  const aw = mapX(axMax) - ax,
    ah = mapY(ayMin) - ay;
  const svgRef = useRef();

  function handleMouseMove(e, ev, i) {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setTooltipContent({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      event: ev,
      index: i,
    });
  }

  return (
    <div
      style={{
        position: "relative",
        width: size + pad * 2,
        height: size + pad * 2,
      }}
    >
      <svg
        ref={svgRef}
        width={size + pad * 2}
        height={size + pad * 2}
        style={{ background: "#1a1a1a", borderRadius: 12, border: "1px solid #333" }}
      >
        <rect
          x={pad}
          y={pad}
          width={size}
          height={size}
          stroke="#333"
          strokeWidth={3}
          fill="none"
        />
        <rect
          x={ax}
          y={ay}
          width={aw}
          height={ah}
          fill="#ffe5e5"
          stroke="#e74c3c"
          strokeWidth={2}
          rx={6}
        />
        {events.map((ev, i) => (
          <circle
            key={i}
            cx={mapX(ev.x)}
            cy={mapY(ev.y)}
            r={hoveredIndex === i ? 8 : 6}
            fill={hoveredIndex === i ? "#e74c3c" : "#3498db"}
            opacity={0.8}
            stroke="#fff"
            strokeWidth={2}
            onMouseEnter={(e) => {
              onHover(i);
              handleMouseMove(e, ev, i);
            }}
            onMouseMove={(e) => handleMouseMove(e, ev, i)}
            onMouseLeave={() => {
              onHover(null);
              setTooltipContent(null);
            }}
          />
        ))}
      </svg>
      {tooltipContent && typeof tooltipContent.index === "number" && (
        <div
          style={{
            position: "absolute",
            left: tooltipContent.x + 12,
            top: tooltipContent.y - 8,
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 6,
            color: "#e0e0e0",
            padding: "8px 12px",
            fontSize: 14,
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            zIndex: 10,
            minWidth: 120,
            maxWidth: 220,
            whiteSpace: "nowrap",
          }}
        >
          {tooltipContent.children}
        </div>
      )}
    </div>
  );
}
