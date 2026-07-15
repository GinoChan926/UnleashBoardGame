"use strict";

import { TILE_DEFINITIONS } from '../constants/Tiles.js';

export class BoardRenderer {
    constructor() {
        this.tiles = TILE_DEFINITIONS;
        this._boardRendered = false;

        // ✅ Cell positions cached per layer so tokens know where to move
        this._cellPositions = {
            streamline: [],
            reverse:    [],
            flow:       []
        };

        // ✅ Token tracking - reuse instead of recreate
        this._tokens = new Map();  // playerId → token element
    }

    // ==================== Public API ====================

    renderAllTiles(gameState, otherPlayers = new Map()) {
        if (!gameState) return;

        // Board built once - never rebuilt
        if (!this._boardRendered) {
            this._renderAllLayers();
            this._boardRendered = true;
            console.log('🎨 Board rendered ONCE. Cell positions cached.');
        }

        this._updateHighlights(gameState);
        this._updateAllTokens(gameState, otherPlayers);
    }

    // Legacy compatibility
    updatePlayerToken(gameState, otherPlayers = new Map()) {
        this._updateAllTokens(gameState, otherPlayers);
    }

    updateAllOtherPlayerTokens(otherPlayers) {
        if (window.gameClient?.gameState) {
            this._updateAllTokens(window.gameClient.gameState, otherPlayers);
        }
    }

    // ==================== Board rendering (one-time) ====================

    _renderAllLayers() {
        this._cellPositions.reverse = this._renderCircleLayer(
            'reverseCellsLayer',
            this.tiles.reverse,
            15,   // radius %
            48,   // cell size px (matches your CSS-ish)
            'reverse'
        );

        this._cellPositions.streamline = this._renderCircleLayer(
            'streamlineCellsLayer',
            this.tiles.streamline,
            35,
            45,
            'streamline'
        );

        this._cellPositions.flow = this._renderSquareLayer(
            'flowCellsLayer',
            this.tiles.flow,
            45
        );
    }

    _renderCircleLayer(containerId, tiles, radiusPercent, cellSizePx, layerType) {
        const container = document.getElementById(containerId);
        if (!container) return [];

        container.innerHTML = '';
        const positions = [];
        const angleStep = (2 * Math.PI) / tiles.length;

        for (let i = 0; i < tiles.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const x     = 50 + radiusPercent * Math.cos(angle);
            const y     = 50 + radiusPercent * Math.sin(angle);
            const tile  = tiles[i];

            positions.push({ xPercent: x, yPercent: y });

            const cell = this._buildCell(tile, i, cellSizePx, layerType);
            cell.style.left = `${x}%`;
            cell.style.top  = `${y}%`;

            const imagePath = tile.type === 'dream'
                ? this.getDreamImagePath(i, tile.name)
                : this.getTileImagePath(layerType, tile.type);

            cell.appendChild(this._buildImage(imagePath, i, tile));
            container.appendChild(cell);
        }

        return positions;
    }

    _renderSquareLayer(containerId, tiles, cellSizePx) {
        const container = document.getElementById(containerId);
        if (!container) return [];

        container.innerHTML = '';
        const positions = [];
        const minBound = 5, maxBound = 95, range = maxBound - minBound;
        const len = tiles.length;

        for (let i = 0; i < len; i++) {
            const { x, y } = this._squarePosition(i, len, minBound, maxBound, range);
            const tile = tiles[i];

            positions.push({ xPercent: x, yPercent: y });

            const cell = this._buildCell(tile, i, cellSizePx, 'flow');
            cell.style.left = `${x}%`;
            cell.style.top  = `${y}%`;

            const imagePath = tile.type === 'dream'
                ? this.getDreamImagePath(i, tile.name)
                : this.getTileImagePath('flow', tile.type);

            cell.appendChild(this._buildImage(imagePath, i, tile));
            container.appendChild(cell);
        }

        return positions;
    }

    // ==================== Token overlay (moves smoothly) ====================

    _updateAllTokens(gameState, otherPlayers) {
        const overlay = document.getElementById('tokenOverlay');
        if (!overlay) {
            console.warn('❌ #tokenOverlay not found in HTML - add <div class="cells-layer" id="tokenOverlay"></div>');
            return;
        }

        // Track which player IDs are still active
        const activeIds = new Set();
        if (gameState?.playerId) activeIds.add(gameState.playerId);
        otherPlayers.forEach((_, id) => activeIds.add(id));

        // Remove tokens for disconnected players
        this._tokens.forEach((token, playerId) => {
            if (!activeIds.has(playerId)) {
                token.remove();
                this._tokens.delete(playerId);
            }
        });

        // Update local player token
        this._placeOrMoveToken(gameState, 0, overlay);

        // Update other player tokens
        let index = 1;
        otherPlayers.forEach((state) => {
            this._placeOrMoveToken(state, index, overlay);
            index++;
        });
    }

    _placeOrMoveToken(playerState, playerIndex, overlay) {
        if (!playerState?.playerId) return;

        const layerType = this._resolveLayerType(playerState); // 'streamline' / 'reverse' / 'flow'
        const pos       = this._resolvePos(playerState);

        const positions = this._cellPositions[layerType];
        if (!positions || !positions[pos]) return;

        const { xPercent, yPercent } = positions[pos];

        // Small offset so multi-token same-tile stays visible
        const offset = this._getTokenOffset(playerIndex);
        const finalX = xPercent + offset.xOffset;
        const finalY = yPercent + offset.yOffset;

        // Get or create token
        let token = this._tokens.get(playerState.playerId);
        if (!token) {
            token = this._buildToken(playerState, playerIndex);
            this._tokens.set(playerState.playerId, token);
            overlay.appendChild(token);
        }

        // ✅ Just move it - CSS transition handles animation
        token.style.left = `${finalX}%`;
        token.style.top  = `${finalY}%`;
    }

    _getTokenOffset(playerIndex) {
        const offsets = [
            { xOffset:  0,   yOffset:  0   },  // 0 - local: dead center
            { xOffset: -2,   yOffset: -2   },  // 1 - top-left
            { xOffset:  2,   yOffset: -2   },  // 2 - top-right
            { xOffset: -2,   yOffset:  2   },  // 3 - bottom-left
            { xOffset:  2,   yOffset:  2   }   // 4 - bottom-right
        ];
        return offsets[playerIndex % offsets.length];
    }

    _buildToken(playerState, playerIndex) {
        const isLocal     = playerIndex === 0;
        const sizePercent = isLocal ? 6 : 4.5;      // % of overlay
        const borderColor = isLocal ? '#ffd700' : '#ff9800';
        const zIndex      = isLocal ? 210 : 200 + playerIndex;

        const avatarFile = playerState.avatar ?? `player${(playerIndex % 5) + 1}.png`;
        const avatarPath = `../cards/players/${avatarFile}`;
        const playerName = playerState.playerName ?? 'Player';

        const token = document.createElement('div');
        token.className = 'player-token';
        token.dataset.playerId = playerState.playerId;
        token.style.cssText = `
            width:  ${sizePercent}%;
            height: ${sizePercent}%;
            border: 2px solid ${borderColor};
            box-shadow: 0 0 10px ${borderColor};
            z-index: ${zIndex};
            transform: translate(-50%, -50%);
        `;

        token.innerHTML = `
            <img src="${avatarPath}"
                 alt="${playerName}"
                 title="${playerName}"
                 onerror="this.src='../cards/players/player1.png';">
        `;
        return token;
    }

    // ==================== Highlight ====================

    _updateHighlights(gameState) {
        document.querySelectorAll('.cell.highlight').forEach(el => {
            el.classList.remove('highlight');
        });

        if (gameState.inReverse) {
            this._highlightCell('reverseCellsLayer', gameState.reversePos);
        } else if (gameState.inFlow) {
            this._highlightCell('flowCellsLayer', gameState.flowPos);
        } else {
            this._highlightCell('streamlineCellsLayer', gameState.streamlinePos);
        }
    }

    _highlightCell(containerId, position) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const cell = container.children[position];
        if (cell) cell.classList.add('highlight');
    }

    // ==================== Image paths ====================

    getTileImagePath(layerType, tileType) {
        const base = `../cards/tiles/${layerType}`;
        const fileMap = {
            streamline: {
                volunteer:'volunteer.png', lier:'lier.png',
                awareness:'awareness.png', opportunity:'opportunity.png',
                settlement:'settlement.png', reverse_entry:'reverse_entry.png',
                lucky_star:'lucky_star.png', four_leaf_clover:'four_leaf_clover.png',
                reverse_exit:'reverse_exit.png', police:'police.png'
            },
            reverse: {
                awareness:'awareness.png', hardship:'hardship.png',
                business_failure:'business_failure.png',
                miracle:'miracle.png', unemployment:'unemployment.png'
            },
            flow: {
                asset_trust:'asset_trust.png', dream:'dream.png',
                investment_tile:'investment_tile.png', social_service:'social_service.png',
                income:'income.png', audit:'audit.png',
                flowbankruptcy:'flowbankruptcy.png', settlement:'settlement.png',
                business_failure:'business_failure.png'
            }
        };
        const filename = fileMap[layerType]?.[tileType] ?? `${tileType}.png`;
        return `${base}/${filename}`;
    }

    getDreamImagePath(position, tileName) {
        const dreamPositions = {
            1:1, 3:2, 5:3, 7:4, 9:5, 11:6, 15:7, 17:8, 19:9,
            21:10, 23:11, 25:12, 27:13, 31:14
        };
        const n = dreamPositions[position];
        return n
            ? `../cards/tiles/flow/dream/dream_${n}.png`
            : `../cards/tiles/flow/dream/dream.png`;
    }

    // ==================== Private helpers ====================

    /** Returns short layer key ('streamline', 'reverse', 'flow') */
    _resolveLayerType(state) {
        if (state.inFlow)    return 'flow';
        if (state.inReverse) return 'reverse';
        return 'streamline';
    }

    _resolvePos(state) {
        if (state.inFlow)    return state.flowPos;
        if (state.inReverse) return state.reversePos;
        return state.streamlinePos;
    }

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

    _buildCell(tile, index, cellSizePx, layerType) {
        // ✅ Use your existing .cell CSS class - it has the octagon clip-path,
        //    hover effects, colors, animations etc.
        //    Don't override with inline styles for anything visual.
        const cell = document.createElement('div');
        cell.className = `cell type-${tile.type}`;
        cell.dataset.index     = index;
        cell.dataset.layerType = layerType;

        // Only set positioning
        cell.style.left = `0%`;   // will be overridden by caller
        cell.style.top  = `0%`;
        cell.style.transform = 'translate(-50%, -50%)';

        // Optional: allow custom size if different from CSS default (56px)
        if (cellSizePx) {
            cell.style.width  = `${cellSizePx}px`;
            cell.style.height = `${cellSizePx}px`;
        }

        return cell;
    }

    _buildImage(imagePath, index, tile) {
        const img = document.createElement('img');
        img.src = imagePath;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        img.onerror = () => {
            img.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.style.cssText = `
                width:100%;height:100%;
                display:flex;flex-direction:column;
                align-items:center;justify-content:center;
                font-size:10px;font-weight:bold;
                color:#ffd966;background:rgba(0,0,0,0.6);
            `;
            fallback.innerHTML = `
                <div>${index + 1}</div>
                <div style="font-size:8px;">${tile.name.substring(0,4)}</div>
            `;
            img.parentElement?.appendChild(fallback);
        };
        return img;
    }
}