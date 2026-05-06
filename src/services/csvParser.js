import Papa from "papaparse";
import { isInApple, roundToOneDecimal } from "../utils/zoneUtils";

// Parse CSV file and extract events
// This logic is EXACTLY the same as the original handleFileUpload function
export function parseCSVFile(file, players) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const xbh = [],
          hard = [],
          swing = [],
          miss = [],
          take = [];

        for (const row of rows) {
          const playerName = row["Batter"] || "";
          const playerInfo = players.find((p) => p.name === playerName);

          if (!playerInfo) continue;

          const { name: player, team } = playerInfo;

          const homeTeam = row["HomeTeam"];
          const awayTeam = row["AwayTeam"];
          const userMetsTeams = ["D-MEO", "D-MEB", "DSL_ME1", "DSL_ME2"];
          let opponentDisplay = "N/A";
          if (userMetsTeams.includes(homeTeam))
            opponentDisplay = `vs ${awayTeam || "N/A"}`;
          else if (userMetsTeams.includes(awayTeam))
            opponentDisplay = `@ ${homeTeam || "N/A"}`;

          const isAppleHit = isInApple(
            parseFloat(row["PlateLocSide"]),
            parseFloat(row["PlateLocHeight"])
          );
          const eventBase = {
            player,
            team,
            opponent: opponentDisplay,
            pitchType: row["TaggedPitchType"] || "",
            x: parseFloat(row["PlateLocSide"]),
            y: parseFloat(row["PlateLocHeight"]),
          };

          const playResult = row["PlayResult"] || "";
          const isXBH =
            playResult.includes("Double") ||
            playResult.includes("Triple") ||
            playResult.includes("Home Run") ||
            playResult.includes("HomeRun");
          if (isXBH) {
            if (isAppleHit)
              xbh.push({
                ...eventBase,
                exitV: roundToOneDecimal(row["ExitSpeed"]),
                angle: roundToOneDecimal(row["Angle"]),
                playResult,
              });
          }

          const exitV = parseFloat(row["ExitSpeed"]);
          if (!isNaN(exitV) && exitV >= 95 && isAppleHit) {
            hard.push({
              ...eventBase,
              exitV: roundToOneDecimal(exitV),
              angle: roundToOneDecimal(row["Angle"]),
            });
          }

          const pitchCall = row["PitchCall"] || "";
          if (
            (pitchCall === "StrikeSwinging" ||
              pitchCall === "FoulBall" ||
              pitchCall === "InPlay") &&
            isAppleHit
          ) {
            swing.push({
              ...eventBase,
              exitV: roundToOneDecimal(exitV),
              angle: roundToOneDecimal(row["Angle"]),
            });
          }
          if (pitchCall === "StrikeSwinging" && isAppleHit) {
            miss.push({
              ...eventBase,
              relSpeed: roundToOneDecimal(row["RelSpeed"]),
              ivb: roundToOneDecimal(row["InducedVertBreak"]),
              hb: roundToOneDecimal(row["HorzBreak"]),
            });
          }
          if (pitchCall === "StrikeCalled" && isAppleHit) {
            take.push({
              ...eventBase,
              relSpeed: roundToOneDecimal(row["RelSpeed"]),
              ivb: roundToOneDecimal(row["InducedVertBreak"]),
              hb: roundToOneDecimal(row["HorzBreak"]),
            });
          }
        }

        console.log("Final Events Created:", {
          xbh: xbh.length,
          hard: hard.length,
          swing: swing.length,
          miss: miss.length,
          take: take.length,
        });

        resolve({
          events: { xbh, hard, swing, miss, take },
        });
      },
      error: (err) => {
        console.error("CSV Parse Error:", err);
        reject(new Error("Error parsing CSV: " + err.message));
      },
    });
  });
}
