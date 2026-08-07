"use strict";

const WebSocket = require('ws');
const path      = require('path');

// ── Constants ─────────────────────────────────────────────────────────────────
const { streamlineTiles, reverseTiles, flowTiles } = require('./server/constants/Tiles.js');

// ── Card data ─────────────────────────────────────────────────────────────────
const { partTimeCards, financeCards, businessCards, propertyCards } = _loadCards('./chance_cards.js',
    { partTimeCards: [], financeCards: [], businessCards: [], propertyCards: [] });

const hardshipCards  = _loadArray('./hardship_cards.js',  'hardshipCards');
const lierCards      = _loadArray('./lier_cards.js',      'lierCards');
const volunteerCards = _loadArray('./volunteer_cards.js', 'volunteerCards');
const policeCards    = _loadArray('./police_cards.js',    'policeCards');
const investmentCards = _loadArray('./investment_cards.js','investmentCards');
const socialCards    = _loadArray('./social_cards.js',    'socialCards');
const { marketNewsCards, tipCards } = _loadRevelation('./revelation_cards.js');
const { dreamCards, getDreamCard } = _loadDream('./dream_cards.js');

const CARD_TYPES = {
    PART_TIME: { id: 'part_time', name: '兼職類', icon: '💼', color: '#4caf50', cards: partTimeCards },
    FINANCE:   { id: 'finance',   name: '財務類', icon: '📈', color: '#2196f3', cards: financeCards },
    BUSINESS:  { id: 'business',  name: '創業類', icon: '🚀', color: '#ff9800', cards: businessCards },
    PROPERTY:  { id: 'property',  name: '地產類', icon: '🏠', color: '#9c27b0', cards: propertyCards }
};
global.CARD_TYPES = CARD_TYPES;

// ── Infrastructure ────────────────────────────────────────────────────────────
const { getTransactions, clearTransactions, loadFromFile } = require('./server/records/TransactionRecorder.js');
const { broadcastToRoom, getOrCreateRoom }                 = require('./server/utils/helpers.js');
const { createHttpServer }                                 = require('./server/HttpServer.js');
// ── Systems ───────────────────────────────────────────────────────────────────
const { handleLoan, handleRepayLoan, handleGetLoanInfo }       = require('./server/systems/LoanSystem.js');
const { handleFlowLayerChoice }             = require('./server/systems/FlowLayerSystem.js');
const { executeAssetTrust }                 = require('./server/systems/AssetTrustSystem.js');
const { handleUseEmotionalSupport, handleSkipEmotionalSupport } = require('./server/systems/EmotionalSupportSystem.js');
const { handleRenamePlayer } = require('./server/actions/RenameHandler.js');
const { handleSettlementRoll } = require('./server/actions/SettlementRollHandler.js');
const { handleLierAck } = require('./server/actions/LierAckHandler.js');

// ── Card handlers ─────────────────────────────────────────────────────────────
const { startAuction, handleAuctionBid, handleAuctionPass } = require('./server/cards/AuctionHandler.js');
const { drawHardshipCard, handleHardshipChoice } = require('./server/cards/HardshipCardHandler.js');
const { drawAndExecuteLierCard, drawLierCard, executeLierCard } = require('./server/cards/LierCardHandler.js');
const {
    drawVolunteerCard,
    executeVolunteerDonation,
    executeVolunteerChoice,
    handleVolunteerDonationResponse    // ← NEW
} = require('./server/cards/VolunteerCardHandler.js');
const { drawPoliceCard }      = require('./server/cards/PoliceCardHandler.js');
const { showRevelationCardTypeSelection, handleRevelationCardTypeChoice,
    handlePurchaseRevelationCard, handleExecuteRevelationCard,
    handleMarketNewsResponse }           = require('./server/cards/RevelationCardHandler.js');
const { showCardTypeSelection, handleCardTypeChoice,
    handlePurchaseCard, handleExecuteCard } = require('./server/cards/OpportunityCardHandler.js');
const { processSocialServiceTile, handleSocialServiceChoice } = require('./server/cards/SocialServiceHandler.js');
const { triggerDreamCard }    = require('./server/cards/DreamCardHandler.js');
const { handleAuxiliaryPoliceCard, handleAuxiliaryPoliceChoice } = require('./server/cards/AuxiliaryPoliceHandler.js');
const { handleAIStoreDraw, handleAIStorePick } = require('./server/cards/AIStoreHandler.js');
const { handleTipCardDraw, handleTipCardPick, handleTipCardCancel } = require('./server/cards/TipCardDrawHandler.js');
const { handleAutoTipDrawNext } = require('./server/systems/AutoTipDrawSystem.js');
const {
    handleEnergyTradeSetPrice,
    handleEnergyTradeBuy,
    handleEnergyTradePass,
    handleEnergyTradeSellerDecide
} = require('./server/systems/EnergyTradeSystem.js');
const {
    handlePropertyChoice,
    handleGetPropertyList,
    handleEarlyPayoff
} = require('./server/systems/PropertyChoiceSystem.js');
const { handleMoveOtherPlayer } = require('./server/systems/MoveOtherPlayerSystem.js');
const { handleFineOtherPlayer } = require('./server/systems/FineOtherPlayerSystem.js');
const { handleGoodCitizenChoice } = require('./server/systems/GoodCitizenSystem.js');
const {
    handlePersonalCardResponse,
    handleTeamCardResponse
} = require('./server/systems/RevelationCardSystem.js');
const { handleGiftCardTarget }        = require('./server/systems/GiftCardSystem.js');
const { handleMoveForwardChoice }     = require('./server/systems/MoveForwardSystem.js');
const { handleAssetChoice } = require('./server/systems/MarketNewsSystem.js');
const { handleGetPortfolio } = require('./server/systems/PortfolioSystem.js');
const {
    handleLendMoney,
    handleRepayDebt,
    handleGetLendingSummary,
    handlePayBankDebt
} = require('./server/systems/LendingSystem.js');
const { startGroupInvestment, handleGroupInvestmentResponse } = require('./server/systems/GroupInvestmentSystem.js');
const { handleGroupFinanceResponse } = require('./server/systems/GroupFinanceSystem.js');
const { handleIN03RewardChoice } = require('./server/systems/RevelationCardSystem.js');
// ── Tile processors ───────────────────────────────────────────────────────────
const { processStreamlineTile } = require('./server/tiles/StreamlineTileProcessor.js');
const { processReverseTile }    = require('./server/tiles/ReverseTileProcessor.js');
const { processFlowTile }       = require('./server/tiles/FlowTileProcessor.js');

// ── Action handlers ───────────────────────────────────────────────────────────
const { handleJoin }    = require('./server/actions/JoinHandler.js');
const { handleEndTurn } = require('./server/actions/TurnHandler.js');
const { handleUseFourLeafClover, handleUseLuckyStar } = require('./server/actions/ItemHandler.js');
const { handleRoll }    = require('./server/actions/RollHandler.js');
const { handlePlayerDisconnect } = require('./server/actions/DisconnectHandler.js');

// ── State ─────────────────────────────────────────────────────────────────────
const rooms       = new Map();
const projectRoot = path.resolve(__dirname, '..');
// ✅ Generate unique ID for this server instance
const SERVER_INSTANCE_ID = `srv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
global.SERVER_INSTANCE_ID = SERVER_INSTANCE_ID;
console.log(`🆔 Server instance: ${SERVER_INSTANCE_ID}`);

// ── Bound broadcast helper ────────────────────────────────────────────────────
const broadcast = (roomId, msg, excl) => broadcastToRoom(rooms, roomId, msg, excl);

global._rooms            = rooms;
global._broadcastToRoom  = broadcast;
global._tipCards        = tipCards;
// ── Dependency bundle passed to handlers that need multiple deps ──────────────
function makeDeps(roomId) {
    return {
        broadcastToRoom:              broadcast,
        startAuction:                 (rId, card, player, ws) => startAuction(rId, card, player, ws, broadcast),
        processStreamlineTile:        (state, tile, ws, rId, player, exact) =>
            processStreamlineTile(state, tile, ws, rId, player, exact, {
                broadcastToRoom:              broadcast,
                showCardTypeSelection:        (ws, s, rId, p) => showCardTypeSelection(ws, s, rId, p, CARD_TYPES, rooms.get(rId)),
                showRevelationCardTypeSelection: (ws, s, rId, p) => showRevelationCardTypeSelection(ws, s, rId, p, marketNewsCards, tipCards, rooms.get(rId)),
                drawAndExecuteLierCard:       (ws, s, rId, p) => drawAndExecuteLierCard(ws, s, rId, p, lierCards, broadcast, rooms),
                drawVolunteerCard:            (ws, s, rId, p, exact) => drawVolunteerCard(ws, s, rId, p, volunteerCards, rooms.get(rId), broadcast, exact),
                drawPoliceCard:               (ws, s, rId, p) => drawPoliceCard(ws, s, rId, p, policeCards, broadcast, {rooms}),
                drawHardshipCard:             (ws, s, rId, p) => drawHardshipCard(ws, s, rId, p, hardshipCards, broadcast, rooms),
                rooms
            }),
        processReverseTile:           (state, tile, ws, rId, player) =>
            processReverseTile(state, tile, ws, rId, player, streamlineTiles, broadcast,
                (ws, s, rId, p) => drawHardshipCard(ws, s, rId, p, hardshipCards, broadcast, rooms),{ rooms, tipCards }),
        processFlowTile:              (state, tile, ws, rId, player, room) =>
            processFlowTile(state, tile, ws, rId, player, room, {
                broadcastToRoom: broadcast,
                startAuction:   (rId, card, player, ws) => startAuction(rId, card, player, ws, broadcast),
                processSocialServiceTile: (s, ws, rId, p, t, r) => processSocialServiceTile(s, ws, rId, p, t, r),
                investmentCards,
                dreamCards,
                rooms
            }),
        triggerDreamCard:             (state, tile, ws, rId, player, old, pos) =>
            triggerDreamCard(state, tile, ws, rId, player, old, pos, getDreamCard, broadcast),
        drawHardshipCard:             (ws, s, rId, p) => drawHardshipCard(ws, s, rId, p, hardshipCards, broadcast, rooms),
        handleEndTurn:                (ws, d, rId)   => handleEndTurn(ws, d, rId, rooms, broadcast)
    };
}

// ✅ Store the streamline tile processor globally so systems can access it
global._streamlineTileProcessor = (state, tile, ws, rId, player, exact) => {
    processStreamlineTile(state, tile, ws, rId, player, exact, {
        broadcastToRoom: broadcast,
        showCardTypeSelection: (ws, s, rId, p) => showCardTypeSelection(ws, s, rId, p, CARD_TYPES, rooms.get(rId)),
        showRevelationCardTypeSelection: (ws, s, rId, p) => showRevelationCardTypeSelection(ws, s, rId, p, marketNewsCards, tipCards, rooms.get(rId)),
        drawAndExecuteLierCard: (ws, s, rId, p) => drawAndExecuteLierCard(ws, s, rId, p, lierCards, broadcast, rooms),
        drawVolunteerCard: (ws, s, rId, p, exact) => drawVolunteerCard(ws, s, rId, p, volunteerCards, rooms.get(rId), broadcast, exact),
        drawPoliceCard: (ws, s, rId, p) => drawPoliceCard(ws, s, rId, p, policeCards, broadcast, { rooms }),
        drawHardshipCard: (ws, s, rId, p) => drawHardshipCard(ws, s, rId, p, hardshipCards, broadcast, rooms),
        rooms
    });
};

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = createHttpServer(projectRoot, rooms, getTransactions, clearTransactions);
const wss    = new WebSocket.Server({ server });

// ── WebSocket connection handler ──────────────────────────────────────────────
wss.on('connection', (ws) => {
    let playerRoomId = 'default_room';
    let deps = null;
    console.log('🔌 新客戶端連接');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📨 收到消息:', data.type);

            switch (data.type) {
                case 'join':
                    playerRoomId = data.roomId || 'default_room';
                    handleJoin(ws, data, playerRoomId, rooms);
                    deps = makeDeps(playerRoomId);
                    break;
                case 'roll':
                    handleRoll(ws, data, playerRoomId, rooms, deps);
                    break;
                case 'end_turn':
                    handleEndTurn(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'apply_loan':
                    handleLoan(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'repay_loan':
                    handleRepayLoan(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'get_loan_info':
                    handleGetLoanInfo(ws, data, playerRoomId, rooms);
                    break;
                case 'card_type_choice':
                    handleCardTypeChoice(ws, data, playerRoomId, rooms, CARD_TYPES);
                    break;
                case 'purchase_card':
                    handlePurchaseCard(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'execute_card':
                    handleExecuteCard(ws, data, playerRoomId, rooms, broadcast, CARD_TYPES, tipCards);
                    break;
                case 'use_four_leaf_clover':
                    handleUseFourLeafClover(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'use_lucky_star':
                    handleUseLuckyStar(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'execute_lier_card':
                    executeLierCard(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'volunteer_card_confirm':
                    executeVolunteerDonation(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'volunteer_card_choice_confirm':
                    executeVolunteerChoice(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'use_emotional_support':
                    handleUseEmotionalSupport(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'skip_emotional_support':
                    handleSkipEmotionalSupport(ws, data);
                    break;
                case 'revelation_type_choice':
                    handleRevelationCardTypeChoice(ws, data, playerRoomId, rooms, marketNewsCards, tipCards);
                    break;
                case 'purchase_revelation_card':
                    handlePurchaseRevelationCard(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'execute_revelation_card':
                    handleExecuteRevelationCard(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'market_news_response':
                    handleMarketNewsResponse(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'flow_layer_choice':
                    handleFlowLayerChoice(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'auction_bid':
                    handleAuctionBid(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'auction_pass':
                    handleAuctionPass(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'asset_trust_setup': {
                    const room = rooms.get(playerRoomId);
                    if (room?.players.has(ws)) {
                        const player = room.players.get(ws);
                        // ✅ No amount needed — trust has fixed setup fee
                        executeAssetTrust(player.gameState, ws, playerRoomId, player, broadcast);
                    }
                    break;
                }
                case 'social_service_choice':
                    handleSocialServiceChoice(ws, data, playerRoomId, rooms, broadcast, investmentCards, socialCards);
                    break;
                case 'auxiliary_police_choice':
                    handleAuxiliaryPoliceChoice(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'ai_store_pick':
                    handleAIStorePick(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'tip_card_pick':
                    handleTipCardPick(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'tip_card_cancel':
                    handleTipCardCancel(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'auto_tip_draw_next':
                    handleAutoTipDrawNext(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'energy_trade_set_price':
                    handleEnergyTradeSetPrice(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'energy_trade_buy':
                    handleEnergyTradeBuy(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'energy_trade_pass':
                    handleEnergyTradePass(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'energy_trade_seller_decide':
                    handleEnergyTradeSellerDecide(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'property_choice':
                    handlePropertyChoice(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'get_property_list':
                    handleGetPropertyList(ws, data, playerRoomId, rooms);
                    break;

                case 'property_early_payoff':
                    handleEarlyPayoff(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'police_move_target':
                    handleMoveOtherPlayer(ws, data, playerRoomId, rooms, broadcast, {
                        processStreamlineTile: (state, tile, ws, rId, player, exact) =>
                            processStreamlineTile(state, tile, ws, rId, player, exact, {
                                broadcastToRoom: broadcast,
                                showCardTypeSelection:        (ws, s, rId, p) => showCardTypeSelection(ws, s, rId, p, CARD_TYPES, rooms.get(rId)),
                                showRevelationCardTypeSelection: (ws, s, rId, p) => showRevelationCardTypeSelection(ws, s, rId, p, marketNewsCards, tipCards, rooms.get(rId)),
                                drawAndExecuteLierCard:       (ws, s, rId, p) => drawAndExecuteLierCard(ws, s, rId, p, lierCards, broadcast, rooms),
                                drawVolunteerCard:            (ws, s, rId, p, exact) => drawVolunteerCard(ws, s, rId, p, volunteerCards, rooms.get(rId), broadcast, exact),
                                drawPoliceCard:               (ws, s, rId, p) => drawPoliceCard(ws, s, rId, p, policeCards, broadcast, { rooms }),
                                drawHardshipCard:             (ws, s, rId, p) => drawHardshipCard(ws, s, rId, p, hardshipCards, broadcast, rooms),
                                rooms
                            }),
                        processReverseTile: (state, tile, ws, rId, player) =>
                            processReverseTile(state, tile, ws, rId, player, streamlineTiles, broadcast,
                                (ws, s, rId, p) => drawHardshipCard(ws, s, rId, p, hardshipCards, broadcast, rooms), { rooms, tipCards }),
                        processFlowTile: (state, tile, ws, rId, player, room) =>
                            processFlowTile(state, tile, ws, rId, player, room, {
                                broadcastToRoom: broadcast,
                                startAuction:   (rId, card, player, ws) => startAuction(rId, card, player, ws, broadcast),
                                processSocialServiceTile: (s, ws, rId, p, t, r) => processSocialServiceTile(s, ws, rId, p, t, r),
                                investmentCards
                            })
                    });
                    break;
                case 'police_fine_target':
                    handleFineOtherPlayer(ws, data, playerRoomId, rooms, broadcast);
                    break;
                case 'good_citizen_choice':
                    handleGoodCitizenChoice(ws, data, playerRoomId, rooms, broadcast, tipCards);
                    break;

                case 'personal_card_response':
                    handlePersonalCardResponse(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'team_card_response':
                    handleTeamCardResponse(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'gift_card_target':
                    handleGiftCardTarget(ws, data, playerRoomId, rooms, broadcast, CARD_TYPES);
                    break;

                case 'move_forward_choice':
                    handleMoveForwardChoice(ws, data, playerRoomId, rooms, broadcast,
                        // tileProcessor closure
                        (state, tile, ws, rId, p, exact) => {
                            processStreamlineTile(state, tile, ws, rId, p, exact, {
                                broadcastToRoom: broadcast,
                                showCardTypeSelection:        (ws, s, rId, p) => showCardTypeSelection(ws, s, rId, p, CARD_TYPES, rooms.get(rId)),
                                showRevelationCardTypeSelection: (ws, s, rId, p) => showRevelationCardTypeSelection(ws, s, rId, p, marketNewsCards, tipCards, rooms.get(rId)),
                                drawAndExecuteLierCard:       (ws, s, rId, p) => drawAndExecuteLierCard(ws, s, rId, p, lierCards, broadcast, rooms),
                                drawVolunteerCard:            (ws, s, rId, p, e) => drawVolunteerCard(ws, s, rId, p, volunteerCards, rooms.get(rId), broadcast, e),
                                drawPoliceCard:               (ws, s, rId, p) => drawPoliceCard(ws, s, rId, p, policeCards, broadcast, { rooms }),
                                drawHardshipCard:             (ws, s, rId, p) => drawHardshipCard(ws, s, rId, p, hardshipCards, broadcast, rooms),
                                rooms
                            });
                        }
                    );
                    break;

                case 'asset_choice_response':
                    handleAssetChoice(ws, data, playerRoomId, rooms, broadcast);
                    break;
                    
                case 'get_portfolio':
                    handleGetPortfolio(ws, data, playerRoomId, rooms);
                    break;

                case 'get_lending_summary':
                    handleGetLendingSummary(ws, data, playerRoomId, rooms);
                    break;

                case 'pay_bank_debt':
                    handlePayBankDebt(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'lend_money':
                    handleLendMoney(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'repay_debt':
                    handleRepayDebt(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'group_investment_response':
                    handleGroupInvestmentResponse(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'hardship_choice':
                    handleHardshipChoice(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'volunteer_donation_response':
                    handleVolunteerDonationResponse(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'group_finance_response':
                    handleGroupFinanceResponse(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'rename_player':
                    handleRenamePlayer(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'settlement_roll':
                    handleSettlementRoll(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'lier_ack':
                    handleLierAck(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'in03_reward_choice_response':
                    handleIN03RewardChoice(ws, data, playerRoomId, rooms, broadcast);
                    break;

                case 'request_flow_choice': {
                    const room = rooms.get(playerRoomId);
                    const player = room?.players.get(ws);
                    if (!room || !player) break;

                    const state = player.gameState;

                    if (state.inFlow) {
                        ws.send(JSON.stringify({
                            type: 'notification',
                            message: '❌ 你已在順流層'
                        }));
                        break;
                    }

                    // ✅ Re-verify eligibility server-side
                    const totalExpense = (state.livingExpense || 0)
                        + (state.tax || 0)
                        + (state.childExpense || 0);

                    if (state.passiveIncome < totalExpense) {
                        ws.send(JSON.stringify({
                            type: 'notification',
                            message: `❌ 被動收入不足 (需 $${totalExpense.toLocaleString()}，你有 $${state.passiveIncome.toLocaleString()})`
                        }));
                        break;
                    }

                    if (state.energy <= 0) {
                        ws.send(JSON.stringify({
                            type: 'notification',
                            message: '❌ 精力不足，無法進入順流層'
                        }));
                        break;
                    }

                    if (state.loanAmount > 0) {
                        ws.send(JSON.stringify({
                            type: 'notification',
                            message: `❌ 還有 $${state.loanAmount.toLocaleString()} 貸款未還清`
                        }));
                        break;
                    }

                    // Send the choice modal (reuse existing message type)
                    ws.send(JSON.stringify({
                        type: 'flow_layer_choice',
                        message: `🎉 恭喜！你已滿足進入順流層的條件！\n` +
                            `被動收入: $${state.passiveIncome.toLocaleString()}/月\n` +
                            `總支出: $${totalExpense.toLocaleString()}/月\n\n` +
                            `你是否願意進入順流層？`,
                        canEnter:       true,
                        passiveIncome:  state.passiveIncome,
                        totalExpense,
                        energy:         state.energy,
                        maxEnergy:      state.maxEnergy,
                        loanAmount:     state.loanAmount
                    }));

                    if (!room.pendingFlowChoices) room.pendingFlowChoices = new Map();
                    room.pendingFlowChoices.set(ws, {
                        playerId: player.playerId,
                        timestamp: Date.now()
                    });
                    break;
                }
                default:
                    ws.send(JSON.stringify({ type: 'error', message: '未知訊息類型' }));
            }
        } catch (e) {
            console.error('消息處理錯誤:', e);
            ws.send(JSON.stringify({ type: 'error', message: '消息格式錯誤' }));
        }
    });

    ws.on('close', () => {
        handlePlayerDisconnect(ws, playerRoomId, rooms, broadcast);
    });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎲 財富流沙盤 WebSocket 伺服器運行在連接埠 ${PORT}`);
});

// ── Card loader helpers ───────────────────────────────────────────────────────

function _loadCards(file, defaults) {
    try { return { ...defaults, ...require(file) }; }
    catch (e) { console.log(`⚠️ 無法載入 ${file}`); return defaults; }
}

function _loadArray(file, key) {
    try {
        const data = require(file);
        console.log(`📚 載入 ${key}: ${(data[key] || []).length} 張`);
        return data[key] || [];
    } catch (e) { console.log(`⚠️ 無法載入 ${file}`); return []; }
}

function _loadRevelation(file) {
    try {
        const data = require(file);
        return { marketNewsCards: data.marketNewsCards || [], tipCards: data.tipCards || [] };
    } catch (e) { return { marketNewsCards: [], tipCards: [] }; }
}

function _loadDream(file) {
    try {
        const data = require(file);
        return { dreamCards: data.dreamCards || {}, getDreamCard: data.getDreamCard || null };
    } catch (e) { return { dreamCards: {}, getDreamCard: null }; }
}