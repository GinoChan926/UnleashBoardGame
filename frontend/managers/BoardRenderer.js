import { TILE_DEFINITIONS } from '../constants/Tiles.js';

export class BoardRenderer {
    constructor() {
        this.tiles = TILE_DEFINITIONS;
    }

    renderAllTiles(gameState) {
        if (!gameState) return;
        this.renderLayerOnCircle('reverseCellsLayer', this.tiles.reverse, gameState.reversePos, gameState.inReverse, 15, 48, 'reverse');
        this.renderLayerOnCircle('streamlineCellsLayer', this.tiles.streamline, gameState.streamlinePos, !gameState.inReverse && !gameState.inFlow, 35, 45, 'streamline');
        this.renderLayerOnHollowSquare('flowCellsLayer', this.tiles.flow, gameState.flowPos, gameState.inFlow, 45);
        this.updatePlayerToken(gameState);
    }

    renderLayerOnCircle(containerId, tiles, currentPos, isActive, radiusPercent, cellSizePx, layerType = 'streamline') {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        const angleStep = (2 * Math.PI) / tiles.length;
        for (let i = 0; i < tiles.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const x = 50 + radiusPercent * Math.cos(angle);
            const y = 50 + radiusPercent * Math.sin(angle);

            const tile = tiles[i];
            const cell = document.createElement('div');
            cell.className = `cell type-${tile.type}`;
            if (isActive && i === currentPos) cell.classList.add('highlight');

            cell.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                transform: translate(-50%, -50%);
                width: ${cellSizePx}px;
                height: ${cellSizePx}px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            `;

            let imagePath = tile.type === 'dream' ? this.getDreamImagePath(i, tile.name) : this.getTileImagePath(layerType, tile.type);

            const img = document.createElement('img');
            img.src = imagePath;
            img.style.cssText = `width: 100%; height: 100%; object-fit: cover;`;
            img.onerror = () => {
                img.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.style.cssText = `width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #ffd966; background: rgba(0,0,0,0.6);`;
                fallback.innerHTML = `<div>${i + 1}</div><div style="font-size: 8px;">${tile.name.substring(0,4)}</div>`;
                cell.appendChild(fallback);
            };
            cell.appendChild(img);

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
            const ratio = i / len;
            const perimeter = ratio * 4;
            let x, y;
            if (perimeter < 1) {
                x = minBound + (perimeter * range);
                y = minBound;
            } else if (perimeter < 2) {
                x = maxBound;
                y = minBound + ((perimeter - 1) * range);
            } else if (perimeter < 3) {
                x = maxBound - ((perimeter - 2) * range);
                y = maxBound;
            } else {
                x = minBound;
                y = maxBound - ((perimeter - 3) * range);
            }

            const tile = tiles[i];
            const cell = document.createElement('div');
            cell.className = `cell type-${tile.type}`;
            cell.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                transform: translate(-50%, -50%);
                width: ${cellSizePx}px;
                height: ${cellSizePx}px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            `;

            let imagePath = tile.type === 'dream' ? this.getDreamImagePath(i, tile.name) : this.getTileImagePath('flow', tile.type);

            const img = document.createElement('img');
            img.src = imagePath;
            img.style.cssText = `width: 100%; height: 100%; object-fit: cover;`;
            img.onerror = () => {
                img.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.style.cssText = `width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #ffd966; background: rgba(0,0,0,0.6);`;
                fallback.innerHTML = `<div>${i + 1}</div><div style="font-size: 8px;">${tile.name.substring(0,4)}</div>`;
                cell.appendChild(fallback);
            };
            cell.appendChild(img);

            container.appendChild(cell);
        }
    }

    getTileImagePath(layerType, tileType) {
        const base = `../cards/tiles/${layerType}`;

        const fileMap = {
            streamline: {
                'volunteer': 'volunteer.png',
                'lier': 'lier.png',
                'awareness': 'awareness.png',
                'opportunity': 'opportunity.png',
                'settlement': 'settlement.png',
                'reverse_entry': 'reverse_entry.png',
                'lucky_star': 'lucky_star.png',
                'four_leaf_clover': 'four_leaf_clover.png',
                'reverse_exit': 'reverse_exit.png',
                'police': 'police.png'
            },
            reverse: {
                'awareness': 'awareness.png',
                'hardship': 'hardship.png',
                'business_failure': 'business_failure.png',
                'miracle': 'miracle.png',
                'unemployment': 'unemployment.png'
            },
            flow: {
                'asset_trust': 'asset_trust.png',
                'dream': 'dream.png',
                'investment_tile': 'investment_tile.png',
                'social_service': 'social_service.png',
                'income': 'income.png',
                'audit': 'audit.png',
                'flowbankruptcy': 'flowbankruptcy.png',
                'settlement': 'settlement.png',
                'business_failure': 'business_failure.png',
            }
        };

        const filename = fileMap[layerType]?.[tileType] || `${tileType}.png`;
        return `${base}/${filename}`;
    }

    getDreamImagePath(position, tileName) {
        const dreamPositions = {
            1: 1, 3: 2, 5: 3, 7: 4, 9: 5, 11: 6, 15: 7, 17: 8, 19: 9,
            21: 10, 23: 11, 25: 12, 27: 13, 31: 14
        };
        const dreamNumber = dreamPositions[position];
        return dreamNumber ? `../cards/tiles/flow/dream/dream_${dreamNumber}.png` : `../cards/tiles/flow/dream/dream.png`;
    }

    _createCell(tile, index, isActive, isHighlighted, cellSizePx) {
        const cell = document.createElement('div');
        cell.className = `cell type-${tile.type}`;
        if (isActive && isHighlighted) cell.classList.add('highlight');
        cell.style.cssText = `
            position: absolute;
            transform: translate(-50%, -50%);
            width: ${cellSizePx}px;
            height: ${cellSizePx}px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            font-size: 8px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
        `;
        const shortName = tile.name.length > 3 ? tile.name.substring(0, 3) : tile.name;
        cell.innerHTML = `<div style="font-size: 10px; font-weight: bold;">${index + 1}</div><div style="font-size: 7px;">${shortName}</div>`;
        return cell;
    }

    updatePlayerToken(gameState) {
        // ✅ Clear old tokens
        document.querySelectorAll('.player-token').forEach(el => el.remove());

        if (!gameState) return;

        // ✅ Place current player token
        const myLayer = gameState.inFlow ? 'flowCellsLayer'
            : gameState.inReverse ? 'reverseCellsLayer'
                : 'streamlineCellsLayer';
        const myPos = gameState.inFlow ? gameState.flowPos
            : gameState.inReverse ? gameState.reversePos
                : gameState.streamlinePos;

        console.log(`🎯 My token: layer=${myLayer} pos=${myPos}`);
        this.placePlayerToken(myLayer, myPos, gameState, true, 0);

        // ✅ Other players
        let index = 1;
        if (window.gameClient && window.gameClient.otherPlayers) {
            console.log(`👥 Other players count: ${window.gameClient.otherPlayers.size}`);

            window.gameClient.otherPlayers.forEach((state, playerId) => {
                const layer = state.inFlow ? 'flowCellsLayer'
                    : state.inReverse ? 'reverseCellsLayer'
                        : 'streamlineCellsLayer';
                const pos = state.inFlow ? state.flowPos
                    : state.inReverse ? state.reversePos
                        : state.streamlinePos;

                console.log(`👤 Other player ${playerId}: layer=${layer} pos=${pos}`,
                    'inFlow:', state.inFlow, 'inReverse:', state.inReverse);

                // ✅ Only place in the correct layer based on their active state
                this.placePlayerToken(layer, pos, state, true, index);
                index++;
            });
        }
    }

    placePlayerToken(containerId, position, playerState, shouldShow, playerIndex = 0) {
        if (!shouldShow || position === undefined || position === null) return;

        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container not found: ${containerId}`);
            return;
        }

        const cells = Array.from(container.children);
        const targetCell = cells[position];

        if (!targetCell) {
            console.warn(`No cell at position ${position} in ${containerId} (total cells: ${cells.length})`);
            return;
        }

        const token = document.createElement('div');
        token.className = 'player-token';

        // ✅ Offset tokens when multiple players on same tile
        const offsets = [
            { top: '50%', left: '50%' },   // Player 0: center
            { top: '25%', left: '25%' },   // Player 1: top-left
            { top: '25%', left: '75%' },   // Player 2: top-right
            { top: '75%', left: '25%' },   // Player 3: bottom-left
            { top: '75%', left: '75%' },   // Player 4: bottom-right
        ];
        const offset = offsets[playerIndex % offsets.length];

        // ✅ Scale down size for other players so they don't overlap as much
        const size = playerIndex === 0 ? '80%' : '50%';
        const borderColor = playerIndex === 0 ? '#ffd700' : '#ff9800';
        const glowColor = playerIndex === 0 ? '#ffd700' : '#ff9800';
        const zIndex = playerIndex === 0 ? 200 : 150 + playerIndex;

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
        box-shadow: 0 0 12px ${glowColor};
        z-index: ${zIndex};
        pointer-events: none;
    `;

        let avatarFile = playerState.avatar || `player${(playerIndex % 5) + 1}.png`;
        const avatarPath = `../cards/players/${avatarFile}`;

        token.innerHTML = `
        <img src="${avatarPath}" 
             alt="${playerState.playerName || 'Player'}" 
             style="width: 100%; height: 100%; object-fit: cover;"
             onerror="this.src='../cards/players/player1.png';"
             title="${playerState.playerName || 'Player'}">
    `;

        targetCell.style.position = 'relative';
        targetCell.appendChild(token);
    }
}