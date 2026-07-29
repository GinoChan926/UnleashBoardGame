# 財富流沙盤 - 完整遊戲流程邏輯文檔

> 基於代碼庫深度分析生成 | 最後更新：2026-07-29

---

## 1. 核心架構概覽

| 層級 | 技術實現 | 職責 |
|------|----------|------|
| **後端** | Node.js + WebSocket (`backend/server.js`) | 遊戲狀態權威、回合控制、卡牌/格子邏輯、廣播 |
| **前端** | 原生 JS (ES Modules) (`frontend/`) | 渲染、WebSocket 路由、UI 管理、動畫 |
| **通訊** | JSON 訊息 via WebSocket | 類型驅動：`join` / `roll` / `end_turn` / `card_type_choice` ... |

---

## 2. 三層棋盤結構 (核心創新)

```
┌─────────────────────────────────────────────────────────────────┐
│                    🌊 順流層 (Flow Layer) - 36格                 │
│  資產信託 → 夢想 → 項目投資 → 夢想 → 社會服務 → 夢想 → 查稅審計 → │
│  夢想 → 項目投資 → 夢想 → 結算日 → 社會服務 → 項目投資 → 夢想 → │
│  破產陷阱 → 夢想 → 項目投資 → 夢想 → 社會服務 → 夢想 → 項目投資 →│
│  夢想 → 生意失敗 → 夢想 → 項目投資 → 夢想 → 結算日 → 社會服務 → │
│  項目投資 → 夢想 → 年度評選 → 財富峰會 → 投資分紅 → 項目投資 → │
│  終極成就(需60精力)                                            │
├─────────────────────────────────────────────────────────────────┤
│                    🔄 平流層 (Streamline Layer) - 24格           │
│  義工卡 → 騙子卡 → 察覺卡 → 機會卡 → 結算日 → 機會卡 → 逆流層入口 │
│  → 機會卡 → 幸運星 → 機會卡 → 察覺卡 → 機會卡 → 結算日 → 警察卡  │
│  → 察覺卡 → 機會卡 → 四葉草 → 機會卡 → 逆流層出口 → 機會卡 → 結算日│
│  → 機會卡 → 察覺卡 → 機會卡                                    │
├─────────────────────────────────────────────────────────────────┤
│                    🌊 逆流層 (Reverse Layer) - 9格               │
│  覺察卡 → 逆境自強卡 → 覺察卡 → 生意失敗 → 奇蹟 → 失業 → 覺察卡 │
│  → 逆境自強卡 → 覺察卡                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 層級轉換條件

| 轉換 | 條件 |
|------|------|
| **平流層 → 逆流層** | 踩中「逆流層入口」格子 (index 6) |
| **逆流層 → 平流層** | 走完9格循環 或 抽到「奇蹟」卡 |
| **平流層 → 順流層** | 結算日時：**被動收入 ≥ 總支出** 且 **精力 > 0** 且 **無貸款** |

---

## 3. 玩家狀態模型 (`gameState`)

```javascript
gameState = {
  // 位置
  streamlinePos: 0,      // 平流層位置 (0-23)
  reversePos: 0,         // 逆流層位置 (0-8)
  flowPos: 0,            // 順流層位置 (0-35)
  inReverse: false,      // 是否在逆流層
  inFlow: false,         // 是否在順流層
  
  // 財務
  cash: 0,               // 現金
  salary: 0,             // 月薪
  sideIncome: 0,         // 副業收入
  passiveIncome: 0,      // 被動收入(投資)
  livingExpense: 0,      // 生活費
  tax: 0,                // 稅金
  loanAmount: 0,         // 貸款本金
  loanInterest: 0,       // 月利息
  childExpense: 0,       // 子女支出
  totalAssets: 0,        // 總資產
  
  // 精力/屬性
  energy: 0,             // 當前精力
  maxEnergy: 100,        // 最大精力
  luck: 5.0,             // 幸運值
  maxLuck: 10,
  
  // 回合控制
  isMyTurn: false,       // 是否為自己回合
  hasRolledThisTurn: false, // 本回合是否已擲骰
  extraDice: 0,          // 額外擲骰次數
  extraTurn: false,      // 額外回合
  
  // 投資持倉
  stockHoldings: {},     // 股票持倉
  cryptoHoldings: {},    // 加密貨幣持倉
  financeInvestments: [], // 財務投資
  businessInvestments: [], // 創業投資
  propertyInvestments: [], // 地產投資
  
  // 特殊狀態
  volunteerCount: 0,
  contributionCount: 0,
  luckyStarCount: 0,
  fourLeafClover: 0,
  // ... 更多狀態 (skipNextTurn, confused, contractDispute 等)
}
```

---

## 4. 完整回合流程

```
┌────────────────────────────────────────────────────────────────┐
│                        新回合開始                                │
│  1. Server 發送 turn_status → 當前玩家 isMyTurn = true         │
│  2. 前端啟用「擲骰」按鈕，顯示「🎯 輪到你了！」                  │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│                        擲骰階段                                  │
│  1. 玩家點擊「擲骰」 → 發送 {type: 'roll'}                       │
│  2. Server 驗證：                                               │
│     - ✅ isMyTurn = true                                       │
│     - ✅ hasRolledThisTurn = false                             │
│     - ✅ energy > 0 (扣 1 精力)                                 │
│     - ✅ 無 skipNextTurn / confused 等阻礙狀態                 │
│  3. 確定骰子數：                                                │
│     - 順流層：固定 2 顆骰子                                     │
│     - 平流層/逆流層：1 顆 (四葉草/幸運星可疊加)                 │
│  4. 計算步數，執行移動邏輯                                      │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│                        移動與格子觸發                             │
│  依層級分派：                                                    │
│  • 平流層 → processStreamlineTile()                            │
│  • 逆流層 → processReverseTile()                               │
│  • 順流層 → processFlowTile()                                  │
│                                                                │
│  每格類型觸發不同邏輯：                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 結算日 (settlement)                                     │   │
│  │  - 正好踩中 → 獲得薪水+副業收入 + 標記 pendingSettlementRoll│   │
│  │  - 經過 → 只扣支出，收入減半 (若有減半狀態)               │   │
│  │  - 自動處理：債務催收、房貸、高利貸、麵包店精力恢復       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 機會卡 (opportunity)                                    │   │
│  │  - 付費 $500 抽卡 → 選購買/放棄 → 執行效果               │   │
│  │  - 4大類：兼職/財務/創業/地產                            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 察覺卡 (awareness) → 啟示卡                             │   │
│  │  - 選類型：市場消息卡 / 錦囊卡                           │   │
│  │  - 付費 $500 → 執行效果                                 │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 騙子卡 (lier)                                           │   │
│  │  - 自動抽卡並立即執行效果 (無選擇)                      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 警察卡 (police)                                         │   │
│  │  - 選項：移動其他玩家 / 罰款其他玩家 / 輔警卡           │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 義工卡 (volunteer)                                      │   │
│  │  - 捐款選擇 → 獲得貢獻點數                              │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 逆流層入口 (reverse_entry)                              │   │
│  │  - 進入逆流層 + 抽逆境自強卡                            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 逆流層出口 (reverse_exit)                               │   │
│  │  - 離開逆流層回平流層                                   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 幸運星 / 四葉草                                         │   │
│  │  - 獲得道具，下次擲骰加成                               │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 順流層特有：夢想/項目投資/資產信託/社會服務/查稅/破產    │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│                        行動階段 (可選)                           │
│  - 貸款申請 / 還款                                             │
│  - 使用四葉草 / 幸運星                                          │
│  - 投資操作 (股票/加密貨幣/基金/P2P)                            │
│  - 房產管理                                                    │
│  - 借貸系統                                                    │
│  - 團體投資/團體理財                                           │
│  - 精力交易                                                    │
│  - 查看投資組合 / 貸款摘要                                     │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│                        結束回合                                  │
│  1. 玩家點擊「結束回合」 → {type: 'end_turn'}                   │
│  2. Server 驗證 hasRolledThisTurn = true                       │
│  3. 檢查 extraTurn (時間管理卡) → 給予額外回合                  │
│  4. 正常換人：                                                  │
│     - 當前玩家 isMyTurn = false                                │
│     - 下一玩家 isMyTurn = true                                 │
│     - 廣播 turn_status + state_updated (雙方)                   │
│  5. 精力恢復：energy = min(maxEnergy, energy + 1)              │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. 關鍵系統深度解析

### A. 結算日系統 (`SettlementRollHandler.js` + `StreamlineTileProcessor.js`)

```javascript
// 觸發條件：踩中平流層第 5/13/21 格 (index 4, 12, 20)
if (isExactLanding) {
  state.pendingSettlementRoll = true  // 玩家需手動擲骰獲取精力
}

// 收入計算：
// - 正常：salary + sideIncome
// - 減半：nextSettlementHalfIncome = true
// - 跳過：skipSettlementIncome = true (通脹)

// 支出計算：calculateReducedExpense() (含麵包店/健康投資減免)

// 自動處理：債務催收、房貸、高利貸、茶餐廳費用
```

### B. 精力系統 (`EnergyTradeSystem.js` + `RollHandler.js`)

```
擲骰消耗：1 精力/次
結束回合恢復：+1 精力 (上限 maxEnergy)
順流層進入需求：energy > 0
夢想格子需求：needEnergy (35-60)

道具：
  - 四葉草：下次擲骰步數 ×2
  - 幸運星：下次擲骰骰子數 +1 (順流層疊加變 3 顆)
  - 麵包店：每結算日 +1 精力 (上限 maxEnergy)
```

### C. 貸款系統 (`LoanSystem.js`)

```
申請上限：(salary + sideIncome) × 3
利率：職業基礎利率 (預設 10%) - 永久降低效果
還款：本金 + 利息 (一次性)
結算日強制還款：12 次結算日後強制扣款
違約：現金不足 → 扣光現金，剩餘轉為債務
```

### D. 投資卡牌系統 (`OpportunityCardHandler.js`)

```
卡牌類型：
  💼 兼職類 (13張) - 低成本、穩定現金流
  📈 財務類 (6張)  - 股票/加密貨幣/基金/P2P，有市場價格波動
  🚀 創業類 (3張)  - 高風險高報酬
  🏠 地產類 (6張)  - 房產投資，有按揭系統

流程：選類型 → 抽卡 → 付 $500 購買 → 選擇執行/放棄 → 效果生效
特殊：順流層項目投資免費查看、啟動
```

### E. 啟示卡系統 (`RevelationCardHandler.js`)

```
察覺卡觸發 → 選類型：
  📊 市場消息卡 - 影響股價/幣價，可觸發團體理財
  🎁 錦囊卡 - 個人/團隊效果 (健康分配、精力交易、AI商店、錦囊抽卡)
```

### F. 層級特殊機制

| 層級 | 特殊機制 |
|------|----------|
| **逆流層** | 9格循環、逆境自強卡、生意失敗(損失一半現金)、失業(薪水歸零)、奇蹟(直接回平流層) |
| **順流層** | 夢想需精力、項目投資免費抽投資卡、資產信託(破產保護)、查稅(資產減半)、破產陷阱(掉回平流層保留10%現金) |

---

## 6. 前後端訊息協議精要

### Client → Server (Actions)

```json
{ "type": "join", "playerId", "playerName", "profession", "roomId" }
{ "type": "roll" }
{ "type": "end_turn" }
{ "type": "card_type_choice", "cardType": "finance" }
{ "type": "purchase_card" }
{ "type": "execute_card", "execute": true, "stockAction": "buy", "shares": 100 }
{ "type": "apply_loan", "amount": 50000 }
{ "type": "repay_loan" }
{ "type": "revelation_type_choice", "cardType": "market_news" }
{ "type": "purchase_revelation_card" }
{ "type": "execute_revelation_card", "execute": true }
{ "type": "flow_layer_choice", "enter": true }
{ "type": "auction_bid", "amount": 100000 }
{ "type": "property_choice", "choice": "buy", "propertyId": "H01" }
{ "type": "get_portfolio" }
{ "type": "lend_money", "targetPlayerId", "amount" }
{ "type": "repay_debt", "debtId", "amount" }
```

### Server → Client (State Updates)

```json
{ "type": "join_success", "playerId", "gameState", "otherPlayers", "streamlineTiles", "reverseTiles", "flowTiles" }
{ "type": "dice_result", "steps", "diceValues", "diceCount", "diceType", "gameState", "tile", "eventMessage" }
{ "type": "card_type_selection", "cardTypes", "canAfford" }
{ "type": "opportunity_card_draw", "card", "canAfford" }
{ "type": "card_purchased", "card", "effectPreview", "gameState" }
{ "type": "card_decision_result", "execute", "message", "gameState" }
{ "type": "settlement", "salary", "sideIncome", "totalIncome", "totalExpense", "gameState" }
{ "type": "turn_status", "currentTurnPlayer", "currentTurnPlayerId" }
{ "type": "state_updated", "playerId", "gameState" }
{ "type": "notification", "message" }
{ "type": "flow_layer_choice", "message", "canEnter", "passiveIncome", "totalExpense" }
{ "type": "revelation_type_selection", "cardTypes", "canAfford" }
```

---

## 7. 勝利條件與遊戲結束

| 條件 | 判定邏輯 |
|------|----------|
| **財務自由** | 被動收入 ≥ 總支出 (進入順流層條件) + 在順流層達成終極夢想 |
| **破產淘汰** | 現金 ≤ 0 且無資產可變現 (順流層破產陷阱會掉回平流層保留 10% 現金) |
| **音樂結束** | 前端 90 分鐘背景音樂播放完畢 → `gameOver = true` |

---

## 8. 代碼架構亮點

| 模式 | 應用位置 |
|------|----------|
| **Dependency Injection** | `makeDeps(roomId)` 將 broadcast、tile processors、card drawers 打包傳給 handlers |
| **Event-Driven** | `room.pendingEvents` Map 追蹤待處理卡牌狀態 |
| **State Machine** | `inReverse` / `inFlow` / `hasRolledThisTurn` 控制回合流程 |
| **Template Pattern** | `TileLandingTemplate`、`DiceAnimationTemplate` 統一 UI 模板 |
| **Handler Delegation** | `CardHandler` → 12 個子 handler (Opportunity/Revelation/Volunteer/...) |

---

## 9. 已知特殊卡牌/系統 (從代碼發現)

| 卡牌ID | 名稱 | 特殊機制 |
|--------|------|----------|
| C03 | 派對房間 | 投資後全體玩家 +2 精力，自己 +7 |
| C04 | 外賣店 | 選單式：投資 / 兌換精力 |
| C05 | AI無人便利店 | 抽取機會卡讓其他玩家選擇 |
| C07 | 無人機快遞 | 抽 3 張錦囊卡選 1 張 |
| C17 | 大學飯堂 | 健康分配給其他玩家 / 精力交易 / 自動抽錦囊卡 |
| C20 | 精力交易 | 玩家間買賣精力 |
| H01-H05 | 房產選擇 | 買/租/放棄，含按揭系統 |
| F01-F05 | 財務卡 | 股票/加密貨幣/基金/P2P，含團體理財 |

---

## 10. 給開發者的關鍵提示

1. **狀態同步**：Server 是唯一真實來源，Client 只渲染 `gameState` + `otherPlayers`
2. **回合鎖**：`hasRolledThisTurn` 防止雙重擲骰，`end_turn` 前必須為 `true`
3. **層級位置獨立**：三層各有自己的 `*Pos`，切換層級時位置不重置
4. **精力檢查**：所有消耗精力動作 (進入順流層、夢想、投資卡) 都要檢查 `state.energy`
5. **廣播模式**：`broadcastToRoom(roomId, msg, excludeWs)` - 除外發送者
6. **交易記錄**：`addTransactionRecord()` 記錄所有金流，支援 `get_portfolio` / `get_lending_summary`

---

## 總結

這是一個**三層棋盤 + 多卡牌系統 + 複雜財務模擬**的完整桌遊數位化實現，核心玩法在於：

> **平流層累積資產 → 達標進入順流層 → 透過夢想/投資實現財務自由**

逆流層作為風險/挫折機制增加戲劇張力，適合中學財商教育場景。