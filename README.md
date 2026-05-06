# Monster of the Middle - Enhanced Version

Enhanced version of the Monster of the Middle app with data persistence, weekly tracking, and player management features.

## Features

### Core Functionality (Preserved)
- CSV parsing and scoring logic remains **exactly the same** as the original
- Apple zone detection and event scoring (XBH +3, Hard +2, Swing +1, Miss -1, Take -3)
- Visual strike zone graphics
- Bilingual support (English/Spanish)

### New Features

1. **Data Persistence**
   - All CSV uploads are saved to browser localStorage
   - Player rosters are persisted
   - No data loss on page refresh

2. **Weekly Tracking**
   - Manual week selection when uploading CSVs
   - Filter leaderboard by week or view "All Season"
   - Weekly winners display
   - Cumulative season scores

3. **Player Management**
   - Add/edit/remove players from teams via UI
   - No code editing required
   - Changes persist automatically

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Uploading CSVs
1. Click "Upload CSV" button
2. Select which week the data is for (required)
3. Choose your CSV file
4. Click "Upload CSV" to process

### Managing Players
1. Click "Manage Players" button
2. Add players: Click "+ Add Player" for the desired team
3. Edit players: Click "Edit" next to a player name
4. Delete players: Click "Delete" next to a player name
5. Changes are saved automatically

### Viewing Results
- **Leaderboard Tab**: View cumulative or weekly scores
- Use the week selector to filter by specific week or view "All Season"
- Weekly winners are shown when a specific week is selected
- Other tabs show detailed event breakdowns (XBH, Hard Contact, etc.)

## Data Storage

All data is stored in browser localStorage:
- CSV files and parsed events
- Player rosters
- Week assignments

To clear all data, you can use browser developer tools to clear localStorage, or the data will persist until manually cleared.

## Technical Details

- **CSV Parsing**: Uses PapaParse (unchanged from original)
- **Scoring Logic**: Identical to original implementation
- **Storage**: localStorage for persistence
- **Week Assignment**: Manual selection on upload (no date parsing required)

## Notes

- Week ranges are defined in `src/utils/constants.js` and can be updated when the season schedule is finalized
- Player rosters default to the original hardcoded rosters on first load
- All scoring calculations match the original app exactly
