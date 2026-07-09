"use strict";

import { TILE_DEFINITIONS } from '../constants/Tiles.js';

export class BoardRenderer {
    constructor() {
        this.tiles = TILE_DEFINITIONS;
    }

    // ==================== Public API ====================

    /**
     * Full board redraw.
     * @param {object}  gameState    - local player's game state
     * @param {Map}     otherPlayers - Map<playerId, gameState>
     */
    renderAllTiles(gameState, otherPlayers = new Map()) {
        if (!gameState) return;

        this.renderLayerOnCircle(
            'reverseCellsLayer',
            this.tiles.reverse,
            gameState.reversePos,
            gameState.inReverse,
            15, 48, 'reverse'
        );

        this.renderLayerOnCircle(
            'streamlineCellsLayer',
            this.tiles.streamline,
            gameState.streamlinePos,
            !gameState.inReverse && !gameState.inFlow,
            35, 45, 'streamline'
        );

        this.renderLayerOnHollowSquare(
            'flowCellsLayer',
            this.tiles.flow,
            gameState.flowPos,
            gameState.inFlow,
            45
        );

        // ✅ Pass otherPlayers directly - no window.gameClient read
        this.updatePlayerToken(gameState, otherPlayers);
    }

    /**
     * Place tokens for all players.
     * Called from renderAllTiles - can also be called directly
     * after a dice roll for a token-only refresh.
     *
     * @param {object} gameState    - local player's game state
     * @param {Map}    otherPlayers - Map<playerId, gameState>
     */
    updatePlayerToken(gameState, otherPlayers = new Map()) {
        // Clear all existing tokens first
        document.querySelectorAll('.player-token').forEach(el => el.remove());

        if (!gameState) return;

        // ── Local player token (index 0 = gold border, center position) ──
        const myLayer = this._resolveLayer(gameState);
        const myPos   = this._resolvePos(gameState);

        console.log(`🎯 My token: layer=${myLayer} pos=${myPos}`);
        this.placePlayerToken(myLayer, myPos, gameState, 0);

        // ── Other players ─────────────────────────────────────────────────
        console.log(`👥 Other players count: ${otherPlayers.size}`);

        let index = 1;
        otherPlayers.forEach((state, playerId) => {
            const layer = this._resolveLayer(state);
            const pos   = this._resolvePos(state);

            console.log(
                `👤 Other player ${playerId}: layer=${layer} pos=${pos}`,
                '| inFlow:', state.inFlow,
                '| inReverse:', state.inReverse
            );

            this.placePlayerToken(layer, pos, state, index);
            index++;
        });
    }

    /**
     * Convenience alias kept for callers that pass otherPlayers separately.
     * e.g. after a dice_result only affecting other players.
     */
    updateAllOtherPlayerTokens(otherPlayers) {
        // Re-read local player state from the last known gameState
        // by delegating to updatePlayerToken with both arguments.
        // Callers should prefer renderAllTiles() for a full refresh.
        if (window.gameClient?.gameState) {
            this.updatePlayerToken(window.gameClient.gameState, otherPlayers);
        }
    }

    // ==================== Layer renderers ====================

    renderLayerOnCircle(
        containerId, tiles, currentPos, isActive,
        radiusPercent, cellSizePx, layerType = 'streamline'
    ) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const angleStep = (2 * Math.PI) / tiles.length;

        for (let i = 0; i < tiles.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const x     = 50 + radiusPercent * Math.cos(angle);
            const y     = 50 + radiusPercent * Math.sin(angle);
            const tile  = tiles[i];

            const cell = this._buildCell(tile, i, isActive, currentPos, cellSizePx);
            cell.style.left = `${x}%`;
            cell.style.top  = `${y}%`;

            const imagePath = tile.type === 'dream'
                ? this.getDreamImagePath(i, tile.name)
                : this.getTileImagePath(layerType, tile.type);

            cell.appendChild(this._buildImage(imagePath, i, tile));
            container.appendChild(cell);
        }
    }

    renderLayerOnHollowSquare(containerId, tiles, currentPos, isActive, cellSizePx) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const minBound = 5, maxBound = 95, range = maxBound - minBound;
        const len = tiles.length;

        for (let i = 0; i < len; i++) {
            const { x, y } = this._squarePosition(i, len, minBound, maxBound, range);
            const tile      = tiles[i];

            const cell = this._buildCell(tile, i, isActive, currentPos, cellSizePx);
            cell.style.left = `${x}%`;
            cell.style.top  = `${y}%`;

            const imagePath = tile.type === 'dream'
                ? this.getDreamImagePath(i, tile.name)
                : this.getTileImagePath('flow', tile.type);

            cell.appendChild(this._buildImage(imagePath, i, tile));
            container.appendChild(cell);
        }
    }

    // ==================== Token placement ====================

    placePlayerToken(containerId, position, playerState, playerIndex = 0) {
        if (position === undefined || position === null) return;

        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container not found: ${containerId}`);
            return;
        }

        const cells      = Array.from(container.children);
        const targetCell = cells[position];

        if (!targetCell) {
            console.warn(
                `No cell at position ${position} in ${containerId}` +
                ` (total cells: ${cells.length})`
            );
            return;
        }

        targetCell.style.position = 'relative';
        targetCell.appendChild(this._buildToken(playerState, playerIndex));
    }

    // ==================== Image path helpers ====================

    getTileImagePath(layerType, tileType) {
        const base    = `../cards/tiles/${layerType}`;
        const fileMap = {
            streamline: {
                volunteer:        'volunteer.png',
                lier:             'lier.png',
                awareness:        'awareness.png',
                opportunity:      'opportunity.png',
                settlement:       'settlement.png',
                reverse_entry:    'reverse_entry.png',
                lucky_star:       'lucky_star.png',
                four_leaf_clover: 'four_leaf_clover.png',
                reverse_exit:     'reverse_exit.png',
                police:           'police.png'
            },
            reverse: {
                awareness:        'awareness.png',
                hardship:         'hardship.png',
                business_failure: 'business_failure.png',
                miracle:          'miracle.png',
                unemployment:     'unemployment.png'
            },
            flow: {
                asset_trust:      'asset_trust.png',
                dream:            'dream.png',
                investment_tile:  'investment_tile.png',
                social_service:   'social_service.png',
                income:           'income.png',
                audit:            'audit.png',
                flowbankruptcy:   'flowbankruptcy.png',
                settlement:       'settlement.png',
                business_failure: 'business_failure.png'
            }
        };

        const filename = fileMap[layerType]?.[tileType] ?? `${tileType}.png`;
        return `${base}/${filename}`;
    }

    getDreamImagePath(position, tileName) {
        const dreamPositions = {
            1: 1,  3: 2,  5: 3,  7: 4,  9: 5,
            11: 6, 15: 7, 17: 8, 19: 9, 21: 10,
            23: 11, 25: 12, 27: 13, 31: 14
        };
        const n = dreamPositions[position];
        return n
            ? `../cards/tiles/flow/dream/dream_${n}.png`
            : `../cards/tiles/flow/dream/dream.png`;
    }

    // ==================== Private helpers ====================

    /**
     * Resolve which DOM layer container a player is currently in.
     */
    _resolveLayer(state) {
        if (state.inFlow)    return 'flowCellsLayer';
        if (state.inReverse) return 'reverseCellsLayer';
        return 'streamlineCellsLayer';
    }

    /**
     * Resolve which position index within that layer the player is at.
     */
    _resolvePos(state) {
        if (state.inFlow)    return state.flowPos;
        if (state.inReverse) return state.reversePos;
        return state.streamlinePos;
    }

    /**
     * Calculate x/y % coordinates for a hollow-square layout.
     */
    _squarePosition(i, len, minBound, maxBound, range) {
        const perimeter = (i / len) * 4;
        let x, y;

        if (perimeter < 1) {
            x = minBound + perimeter * range;
            y = minBound;
        } else if (perimeter < 2) {
            x = maxBound;
            y = minBound + (perimeter - 1) * range;
        } else if (perimeter < 3) {
            x = maxBound - (perimeter - 2) * range;
            y = maxBound;
        } else {
            x = minBound;
            y = maxBound - (perimeter - 3) * range;
        }

        return { x, y };
    }

    /**
     * Build a positioned cell div (no image yet).
     */
    _buildCell(tile, index, isActive, currentPos, cellSizePx) {
        const cell = document.createElement('div');
        cell.className = `cell type-${tile.type}`;
        if (isActive && index === currentPos) cell.classList.add('highlight');

        cell.style.cssText = `
            position: absolute;
            transform: translate(-50%, -50%);
            width: ${cellSizePx}px;
            height: ${cellSizePx}px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        `;
        return cell;
    }

    /**
     * Build an <img> with fallback text overlay on error.
     */
    _buildImage(imagePath, index, tile) {
        const img = document.createElement('img');
        img.src = imagePath;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;';

        img.onerror = () => {
            img.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.style.cssText = `
                width: 100%; height: 100%;
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                font-size: 10px; font-weight: bold;
                color: #ffd966; background: rgba(0,0,0,0.6);
            `;
            fallback.innerHTML = `
                <div>${index + 1}</div>
                <div style="font-size:8px;">${tile.name.substring(0, 4)}</div>
            `;
            // img's parent is the cell
            img.parentElement?.appendChild(fallback);
        };

        return img;
    }

    /**
     * Build the avatar token div for one player.
     */
    _buildToken(playerState, playerIndex) {
        // Offset positions so multiple players on the same tile don't overlap
        const offsets = [
            { top: '50%', left: '50%' },  // 0 – local player: centre
            { top: '25%', left: '25%' },  // 1 – top-left
            { top: '25%', left: '75%' },  // 2 – top-right
            { top: '75%', left: '25%' },  // 3 – bottom-left
            { top: '75%', left: '75%' },  // 4 – bottom-right
        ];
        const offset      = offsets[playerIndex % offsets.length];
        const isLocalPlayer = playerIndex === 0;
        const size        = isLocalPlayer ? '80%'    : '50%';
        const borderColor = isLocalPlayer ? '#ffd700' : '#ff9800';
        const zIndex      = isLocalPlayer ? 200       : 150 + playerIndex;

        const avatarFile = playerState.avatar ?? `player${(playerIndex % 5) + 1}.png`;
        const avatarPath = `../cards/players/${avatarFile}`;
        const playerName = playerState.playerName ?? 'Player';

        const token = document.createElement('div');
        token.className   = 'player-token';
        token.style.cssText = `
            position: absolute;
            top: ${offset.top};
            left: ${offset.left};
            transform: translate(-50%, -50%);
            width: ${size};
            height: ${size};
            border-radius: 12px;
            overflow: hidden;
            border: 3px solid ${borderColor};
            box-shadow: 0 0 12px ${borderColor};
            z-index: ${zIndex};
            pointer-events: none;
        `;

        token.innerHTML = `
            <img src="${avatarPath}"
                 alt="${playerName}"
                 title="${playerName}"
                 style="width:100%;height:100%;object-fit:cover;"
                 onerror="this.src='../cards/players/player1.png';">
        `;

        return token;
    }
}