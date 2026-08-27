# UnleashBoardGame: Handover and Development Guide

**Project:** 財富流沙盤 / 馬太財商沙盤, a Hong Kong financial-education board game for secondary-school students.

**Purpose of this document:** to onboard the next developer. It explains what the project is, how it is built, how to run it, what was recently changed, and where it can be taken next.

**Companion document:** [`game_logic.md`](game_logic.md) documents the game rules and flow in depth (Chinese). This document covers the codebase, operations, and roadmap. Both should be read.

---

## 1. Overview

UnleashBoardGame is a multiplayer, LAN-based board game used in classrooms. A teacher runs a server on a mini-PC, and students join from their own laptops or tablets over the school network. Play is organised into **rooms**, where each room represents one game table of up to eight players. The game teaches cash-flow and financial-literacy concepts (salary, passive income, expenses, loans, and investments) through a three-layer board.

- **Players** select a profession (醫生, 工程師, 教師, 藝術家, 創業者, or random), roll dice, move around the board, trigger cards, and manage their money and energy.
- **Objective (win condition):** achieve **financial freedom**, defined as passive income equal to or greater than total expenses, and then complete the ultimate dream in the top "flow" layer. A game also ends when the 90-minute background music finishes.
- **Value to teachers:** during and after a game, a teacher can review what each student and each room did through the records and analysis page.

---

## 2. Technology stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Backend** | Node.js with [`ws`](https://github.com/websockets/ws) | A single WebSocket server that also serves the frontend over HTTP. `ws` is the only dependency. |
| **Frontend** | Vanilla JavaScript (native ES modules) | No framework and no build step. The browser loads `.js` modules directly through `import`. |
| **Data** | In-memory, with `transactions.json` | Game state is held in server memory per room. The records feature also persists a capped list to disk. There is no database. |
| **Transport** | WebSocket on port **8080** | One connection per player. The server is the single source of truth. |

The project currently has no `package.json`, no automated tests, no CI, and no bundler. Section 9 addresses these gaps.

---

## 3. Repository structure

```
BoardGame/
├── README.md                 # How to run, plus LAN classroom setup instructions
├── game_logic.md             # In-depth game rules and flow documentation
├── bugs_to_fix.txt           # The author's running to-do list (mostly unimplemented cards)
├── HANDOVER.md               # This document
├── transactions.json         # Persisted records
│
├── backend/                  # 66 .js files
│   ├── server.js             # Entry point: WebSocket and HTTP server, message switchboard
│   ├── *_cards.js            # Card definitions (chance, revelation, hardship, and others)
│   └── server/               # Server logic, organised by concern:
│       ├── HttpServer.js     #   Static file serving and /api routes
│       ├── actions/          #   join, roll, end-turn, loan, rename, room list
│       ├── cards/            #   One handler per card family (twelve or more)
│       ├── systems/          #   Cross-cutting systems (loans, health, energy trade, portfolio)
│       ├── tiles/            #   Tile processors for the three board layers
│       ├── records/          #   TransactionRecorder.js (the records feature)
│       ├── constants/        #   Professions, Tiles, TileTypes, ServerConfig
│       └── utils/            #   Helpers (rooms, broadcast, expense calculation)
│
├── frontend/                 # 94 .js files
│   ├── index.html            # The game (多人聯機版)
│   ├── main.html             # Official homepage
│   ├── record.html           # Records and analysis page (location of recent work)
│   ├── game.js               # GameClient orchestrator
│   └── managers/             # Client-side managers and handlers, mirroring the backend
│
└── cards/                    # 19 folders of card artwork
```

**Backend and frontend symmetry:** most features have both a server handler and a matching client handler. Adding a feature typically requires changes on both sides, plus a message type in `server.js`.

---

## 4. Running the application

### Local (single machine, for development)

```bash
cd backend
node server.js
```

Then open `http://localhost:8080/frontend/index.html` for the game, or `/record.html` for the records page. The server prints a banner and listens on port **8080**.

If `ws` is not installed on a fresh clone, run `cd backend && npm install ws`. Because there is no `package.json` yet, this step is manual. Section 9 covers the fix.

### Classroom or LAN competition

1. On the teacher's mini-PC, run `cd backend && node server.js`.
2. Find the server's IPv4 address (`ipconfig` on Windows, `ipconfig getifaddr en0` on macOS, `ip a` on Linux).
3. Students open `http://<SERVER_IP>:8080`, enter a room name and a player name, and join.

The full step-by-step procedure is in [`README.md`](README.md).

---

## 5. Core concepts

Full detail is available in [`game_logic.md`](game_logic.md). The essentials are as follows.

- **Three-layer board (the core innovation):** 平流層 (streamline, normal), 逆流層 (reverse, setback), and 順流層 (flow, wealth). Each layer maintains its own position; switching layers does not reset it.
- **`gameState`** is the per-player state object (cash, salary, side income, passive income, energy, loans, positions, and status flags). The server owns it, and the client only renders it.
- **Settlement days (結算日)** occur on tiles 5, 13, and 21. Players collect salary and side income and pay expenses. Landing exactly on one grants a bonus roll.
- **Energy system:** rolling costs one energy point, and ending a turn restores one. Many actions require sufficient energy.
- **Turn lock:** `hasRolledThisTurn` prevents double rolls, and it must be true before `end_turn`.
- **Rooms** are identified by a name that players type themselves (letters, numbers, Chinese characters, underscores, and hyphens are permitted). An identical name joins the same room, up to eight players each.
- **Cards** span several families: opportunity (機會), revelation (啟示), hardship (逆境), police (警察), lier (騙子), volunteer (義工), social (社會), dream (夢想), investment (投資), and market news (市場消息). Each family has data (`*_cards.js`) and a handler (`server/cards/*`).

---

## 6. Records and analysis (`record.html`)

This is the teacher-facing review tool and the focus of the most recent work.

- **Data source:** `GET /api/transactions` returns the in-memory list from `TransactionRecorder.js`, which is persisted (capped) to `transactions.json`. The page refreshes automatically every five seconds.
- **Coverage:** every game action that changes money or energy calls `addTransactionRecord(...)`, across 79 call sites. Each record carries the player, the room, the card type, the card name, the action, and the changes to cash, passive income, side income, salary, and energy.

The page provides three tabs:

| Tab | Contents |
|-----|----------|
| **全部記錄** | The full transaction table, filterable by card type and searchable. |
| **分玩家分析** | A per-player breakdown: summary cards, a cumulative-cash line chart, and a net-cash bar chart. |
| **分房間分析** | A per-room breakdown: a room-comparison ranking chart ordered by net cash, followed by one section per room showing its players, statistics, and a per-room cumulative-cash chart. |

Charts are drawn as inline SVG, without a charting library, so the page works entirely offline on the LAN. Records are tagged with the player's room via `gameState.roomId`, with a `playerName` to room fallback map in the recorder for records that carry no state. Records created before this feature, or otherwise untagged, appear under **未分配**.

---

## 7. Current branch state

| Branch | Contents | Status |
|--------|----------|--------|
| **`main`** | The authoritative version: the game, rooms, custom naming, per-player analysis, Traditional Chinese records, and earlier bug fixes. | Live, source of truth |
| **`updatednewbranch`** | Rounds one to three: bug fixes, per-player analysis, and Traditional Chinese. | Merged into `main` |
| **`room-and-name-updates`** | Round four (see Section 8): full names in the bar chart, the room-analysis tab, the room comparison, and record room-tagging. | Pushed, awaiting the owner's decision |
| `improve-ui` | The owner's UI branch. | Owner's |

A consistent workflow rule applies: `main` is never committed to or pushed directly. All contributed work is placed on a separate branch, and the owner reviews and merges it.

---

## 8. Summary of recent work

**Bug fixes**

- **Inflation expense defect** (`RollHandler.js`): a player affected by the inflation hardship card skipped all expenses when passing over, rather than landing on, a settlement tile. The behaviour now mirrors the landing path: income is skipped, but expenses are still charged.
- **Records page:** an unreachable duplicate branch was removed, and the search filter was hardened against records with no card name.

**Features**

- The **per-player analysis** tab was added, and that page was converted to Traditional Chinese.
- The net-cash bar chart now displays each player's **full name** rather than truncating it.
- A **per-room analysis** tab and a **room-comparison ranking** chart were added.
- Transaction records are now **tagged with their room** on the backend. This change is additive and does not alter the 79 record call sites or any game logic.

All changes were syntax-checked, unit-tested (for record tagging), and validated end-to-end against a running server with no crashes.

---

## 9. Known issues and technical debt

The following are ranked approximately by impact.

1. **No `package.json`.** The only dependency, `ws`, is installed ad hoc, so a fresh clone cannot run `npm install`. Adding a manifest with `ws` pinned and a `start` script is the highest-value, lowest-effort improvement.
2. **No automated tests.** The card economy is complex and has already produced at least one money-calculation defect. Unit tests for the handlers and systems, particularly the money and energy calculations, are needed.
3. **The port is hardcoded** (`const PORT = 8080` in `server.js`). It should read `process.env.PORT || 8080`.
4. **Records persistence is fragile.** The system uses in-memory storage plus a single capped `transactions.json` (200 to 500 records, with all rooms mixed together). A server restart, or a long multi-room session, loses history. SQLite or per-session files would be more robust.
5. **`transactions.json` is both git-tracked and git-ignored**, which is inconsistent and causes it to appear repeatedly as modified. Running `git rm --cached transactions.json` resolves this.
6. **Mixed Simplified and Traditional Chinese.** The records page is now Traditional, but the server banner and other UI text still contain Simplified characters. The conversion should be completed across the project.
7. **The `server.js` message switchboard is monolithic.** It is manageable, but a handler registry or map would scale better than a large `switch` statement.
8. **There is no error boundary around message handling.** An unhandled exception in one handler could bring down an entire classroom's server. Dispatch should be wrapped in try/catch with structured logging.

---

## 10. Recommendations for future development

### A. Foundation and reliability (priority)

- Add a `package.json` and lockfile, a `start` script, and an environment-configurable port, so that setup is reproducible for the next developer.
- Introduce a test suite. The settlement, expense, and loan calculations, along with the card handlers, should be prioritised, as these are where money defects are most likely.
- Harden the server with try/catch around dispatch, graceful handling of malformed messages, and a health-check endpoint. A crash during a lesson is the most disruptive failure scenario.
- Provide proper persistence for records, and ideally for game state, so that a restart does not discard a lesson's data.

### B. Teacher experience

- **Live teacher dashboard:** a real-time view of all active rooms (players, progress, and money), rather than post-game records alone. The room list, host, and timer already exist as a starting point.
- **Printable per-student and per-room report cards** exported from the records page (PDF or CSV) for teachers to return to students.
- **Room controls:** pause, resume, and reset a room, adjust the timer, and remove or rename players.

### C. Gameplay completeness

- **Complete the unimplemented card functions** listed in [`bugs_to_fix.txt`](bugs_to_fix.txt). Several cards (C05 AI store, C07 drone, C13 tea restaurant, C16 family office, C17 canteen, C20 and C21 sustainability, H01 to H05 property transfer, and P05 and P06 police) are partially implemented and require backend support.
- **End-game screen and leaderboard**, integrated with the records and room data.
- **Save and resume** functionality for a game, which depends on the persistence work above.

### D. Polish and reach

- **Dice and money animations**, already on the owner's wishlist, would be a significant improvement to student engagement.
- **Mobile and tablet responsiveness**, since students join on a range of devices.
- **An English (internationalised) version**, to extend the game beyond Cantonese classrooms.
- **Accessibility improvements:** colour contrast, keyboard navigation, and screen-reader labels.

### E. Records and analysis: the two agreed next steps

The following were scoped during recent work and deferred.

**Item 3, time-based charts.** The cumulative-cash line charts, in both the player and room views, currently advance one step per action, so the lines of two players do not align by the time at which events occurred. Each record already carries a `timestamp`, so the x-axis can be switched to real time, which makes the lines directly comparable. The effort is small to medium and is frontend-only.

**Item 4, export and polish.** For the records page:

- **Export and print** per-player and per-room results (as CSV or a print-friendly view) so that a teacher can save or return results.
- **Value labels** at the end of each chart line, showing each player's final figure without hovering.
- **Room sorting options** (by name, by activity, or by net cash) in the room tab.
- Cross-referencing the **live room list**, so that an active room with no recorded actions yet still appears.

The effort is small and mostly frontend, though export may benefit from a small backend endpoint.

---

## 11. Working conventions

- **Never commit to or push `main` directly.** Branch from the latest `main`, commit to that branch, push it, and let the owner review and merge.
- **Prefer additive changes.** Avoid refactoring core game logic solely to add a feature.
- **Touch both sides.** Most features require a server handler, a client handler, and a message type in `server.js`.
- **After changes,** at minimum run `node --check`, start the server, and smoke-test in the browser. There is no CI to catch regressions.
- **Security:** the GitHub access token used during this work was shared in plaintext and should be revoked or regenerated once handover is complete. Tokens and secrets must never be committed.

---

## 12. Quick-start checklist for the next developer

1. Clone the repository, then run `cd backend && npm install ws` (until a `package.json` exists).
2. Run `node server.js`, open `http://localhost:8080/frontend/index.html`, and play a turn.
3. Open `/record.html`, play a game, and watch the records and analysis populate.
4. Read [`game_logic.md`](game_logic.md) for the rules, and review `server.js` for the message switchboard.
5. Select a starter task: add a `package.json` (Section 10A) or complete a card from [`bugs_to_fix.txt`](bugs_to_fix.txt).
