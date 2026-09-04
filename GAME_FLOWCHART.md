# UnleashBoardGame: Complete Game Logic Flowchart

This document traces the full game logic from the frontend to the backend and back. It complements [`game_logic.md`](game_logic.md) (which describes the game rules) and [`HANDOVER.md`](HANDOVER.md) (which describes the codebase). All diagrams use Mermaid and render automatically on GitHub.

The architecture follows one consistent principle: **the server is the single source of truth.** The client sends intentions (roll, purchase, end turn), the server validates them, updates `gameState`, and broadcasts the authoritative result back to every player in the room. The client only renders what it receives.

---

## 1. System architecture (frontend to backend)

A high level view of the major components and how a message travels between them.

```mermaid
flowchart LR
    subgraph Client["Browser (student device)"]
        UI["index.html : board and panels"]
        GC["game.js : GameClient"]
        PAS["PlayerActionSender"]
        MR["MessageRouter"]
        CONN["ConnectionManager : WebSocket"]
    end

    subgraph Server["Node.js server (server.js)"]
        WSS["WebSocket server"]
        SW["Message switchboard : switch(data.type)"]
        H["Handlers : actions, cards, systems, tiles"]
        GS["Rooms and gameState : in memory"]
        REC["TransactionRecorder"]
        HTTP["HttpServer : static files and /api"]
    end

    subgraph RecordsPage["Records and analysis"]
        RH["record.html"]
    end

    UI --> GC --> PAS --> CONN
    CONN <-->|"WebSocket JSON, port 8080"| WSS
    WSS --> SW --> H --> GS
    H --> REC
    H -->|"broadcast to room"| WSS
    WSS --> CONN --> MR --> GC --> UI
    REC --> HTTP
    HTTP -->|"GET /api/transactions"| RH
```

**Key components**

| Side | Component | Responsibility |
|------|-----------|----------------|
| Client | `ConnectionManager` | Opens the WebSocket, sends and receives JSON messages |
| Client | `PlayerActionSender` | Serialises player intentions into outgoing messages |
| Client | `MessageRouter` | Maps each incoming message type to the correct client handler |
| Client | `game.js` (GameClient) | Owns the managers and the local copy of state, drives rendering |
| Server | `server.js` | Accepts connections and dispatches each message by its `type` |
| Server | Handlers | Contain the actual game logic (join, roll, cards, loans, tiles) |
| Server | `TransactionRecorder` | Records every money and energy change for the analysis page |

---

## 2. Connection and join sequence

How a student joins a room and receives their starting state.

```mermaid
sequenceDiagram
    participant P as Player (browser)
    participant C as ConnectionManager
    participant S as server.js
    participant J as JoinHandler
    participant R as Room and gameState

    P->>C: Enter room name and player name
    C->>S: Open WebSocket, send join message
    S->>J: handleJoin(ws, data, roomId, rooms)
    J->>R: getOrCreateRoom, build gameState, register player to room
    J-->>C: join_success (gameState, tiles, timer, isHost)
    S-->>C: player_joined broadcast to the other players
    C->>P: Render board, player panel, and turn indicator
```

The player's chosen room name becomes the `roomId`. If the name already exists the player joins that room; otherwise a new room is created (up to eight players each). The room is also recorded so that later transactions can be grouped by room.

---

## 3. Core turn loop (the main game logic)

This is the heart of the game: what happens from the moment a player rolls the dice to the moment the turn passes on.

```mermaid
flowchart TD
    A["Player clicks Roll"] --> B["PlayerActionSender sends roll"]
    B --> C["server.js switchboard : case roll"]
    C --> D["RollHandler.handleRoll"]
    D --> E{"Is it this player's turn and not yet rolled?"}
    E -->|No| E1["Send error back to player"]
    E -->|Yes| F["Generate dice, set hasRolledThisTurn"]
    F --> G{"Which board layer?"}
    G -->|Streamline| H1["Advance on streamline, process passed settlements"]
    G -->|Reverse| H2["Advance on reverse layer"]
    G -->|Flow| H3["Advance on flow layer"]
    H1 --> I["Process the tile the player lands on"]
    H2 --> I
    H3 --> I
    I --> J{"Tile type"}
    J -->|Settlement| K1["Collect salary and income, pay expenses"]
    J -->|Opportunity, Lier, Hardship| K2["Draw a card, await player decision"]
    J -->|Other effect| K3["Apply the tile effect"]
    K1 --> L["Update gameState"]
    K2 --> L
    K3 --> L
    L --> M["addTransactionRecord"]
    L --> N["broadcastToRoom : dice_result and state_updated"]
    N --> O["Client MessageRouter to TurnHandler"]
    O --> P["Render dice, board position, and stats"]
    P --> Q{"Is a card awaiting a decision?"}
    Q -->|Yes| R["Show card modal, player decides"]
    Q -->|No| S["Player clicks End Turn"]
    R --> S
    S --> T["end_turn to server, turn passes to next player"]
    T --> U["broadcast turn_ended and turn_status"]
```

**Notes on the turn loop**

- The turn lock `hasRolledThisTurn` prevents a second roll in the same turn, and it must be true before End Turn is accepted.
- Each board layer keeps its own position. Passing over a settlement tile still triggers income and expenses, even when the player does not land on it exactly.
- Every branch that changes money or energy calls `addTransactionRecord` before the result is broadcast, so the analysis page stays in step with play.

---

## 4. Card interaction flow

Opportunity, revelation, lier, hardship, and similar cards follow a draw, decide, resolve pattern.

```mermaid
flowchart TD
    A["Player lands on a card tile"] --> B["Server draws a card and sends card_type_selection or a card_draw message"]
    B --> C["CardHandler displays the card modal"]
    C --> D{"Player decision"}
    D -->|Purchase| E["purchase_card to server"]
    D -->|Execute| F["execute_card to server"]
    D -->|Skip| G["skip to server"]
    E --> H["OpportunityCardHandler or the matching card handler"]
    F --> H
    H --> I["Validate cost and energy, then update gameState"]
    I --> J["addTransactionRecord"]
    I --> K["broadcast card_purchased or card_executed, plus state_updated"]
    K --> L["Client renders the outcome"]
    G --> M["broadcast card_skipped"]
    M --> L
```

The server validates affordability and energy before applying any effect, so an invalid choice is rejected rather than trusted. Some cards require additional input (for example choosing a target player or picking one card from several); these send a follow up prompt and wait for the player's response before resolving.

---

## 5. Records and analysis data flow

How gameplay turns into the teacher facing charts on `record.html`.

```mermaid
flowchart LR
    A["Any money or energy action inside a handler"] --> B["addTransactionRecord(player, card, action, amounts, state)"]
    B --> C["Tag record with roomId, build the record object"]
    C --> D["In memory transactions list"]
    D --> E["Persist to transactions.json, capped"]
    D --> F["Served by GET /api/transactions"]
    F --> G["record.html fetches every 5 seconds"]
    G --> H{"Selected tab"}
    H -->|All records| I["Searchable, filterable table"]
    H -->|Per player| J["Player summary cards and charts"]
    H -->|Per room| K["Room comparison ranking and per room sections"]
```

Records are tagged with the player's room through `gameState.roomId`, with a player to room fallback map for records that carry no state. Records created before room tagging existed appear under the label 未分配.

---

## 6. End to end message reference

The complete round trip for the most common action, a dice roll, named at each hop.

```mermaid
flowchart LR
    subgraph FE["Frontend"]
        A1["Roll button"] --> A2["PlayerActionSender.send(roll)"]
        A2 --> A3["ConnectionManager.send"]
    end
    A3 -->|"roll"| B1
    subgraph BE["Backend"]
        B1["server.js on message"] --> B2["switch case roll"]
        B2 --> B3["RollHandler.handleRoll"]
        B3 --> B4["Tile processors and card handlers"]
        B4 --> B5["gameState updated, addTransactionRecord"]
        B5 --> B6["broadcastToRoom"]
    end
    B6 -->|"dice_result, state_updated"| C1
    subgraph FE2["Frontend"]
        C1["ConnectionManager.onmessage"] --> C2["MessageRouter"]
        C2 --> C3["TurnHandler.handleDiceResult"]
        C3 --> C4["Render board, stats, and log"]
    end
```

**Message vocabulary**

| Direction | Examples |
|-----------|----------|
| Client to server (actions) | `join`, `roll`, `end_turn`, `purchase_card`, `execute_card`, `apply_loan`, `repay_loan` |
| Server to client (results) | `join_success`, `dice_result`, `state_updated`, `turn_ended`, `card_type_selection`, `card_purchased`, `settlement` |

---

## 7. How to read these diagrams

- A rectangle is a step or a component.
- A diamond is a decision, with each outgoing arrow labelled by the outcome.
- A solid arrow is the normal path of data or control.
- A labelled arrow across the client and server boxes is a WebSocket message; the label is the message type.

For the underlying rules behind each step (income formulas, loan interest, card effects, win conditions), refer to [`game_logic.md`](game_logic.md).
