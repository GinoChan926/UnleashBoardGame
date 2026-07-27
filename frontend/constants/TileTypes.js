"use strict";

/**
 * Central mapping of tile types → display metadata.
 * Used by:
 *   - Board renderer (tile colors on the map)
 *   - Tile landing modal (icons + titles)
 *   - Any other UI that shows tile info
 */
export const TILE_TYPES = {
    // ── Streamline layer ─────────────────────────────────────────────
    volunteer:        { color: '#4caf50', icon: '🤝', title: '義工卡',       layer: 'streamline' },
    lier:             { color: '#dc143c', icon: '🎭', title: '騙子卡',       layer: 'streamline' },
    awareness:        { color: '#ff9800', icon: '🧘', title: '察覺卡',       layer: 'both'       },
    opportunity:      { color: '#aa00ff', icon: '🎴', title: '機會卡',       layer: 'streamline' },
    settlement:       { color: '#ff8f00', icon: '💰', title: '結算日',       layer: 'both'       },
    reverse_entry:    { color: '#7b1fa2', icon: '🌀', title: '逆境卡',       layer: 'streamline' },
    reverse_exit:     { color: '#2e7d32', icon: '🌊', title: '順流出口',     layer: 'streamline' },
    lucky_star:       { color: '#ff9800', icon: '⭐', title: '幸運星',       layer: 'streamline' },
    four_leaf_clover: { color: '#4caf50', icon: '🍀', title: '四葉草',       layer: 'streamline' },
    police:           { color: '#2e7d32', icon: '👮', title: '警察卡',       layer: 'streamline' },

    // ── Reverse layer ────────────────────────────────────────────────
    hardship:         { color: '#7f0000', icon: '💥', title: '逆境自強卡',   layer: 'reverse'    },
    business_failure: { color: '#c0392b', icon: '📉', title: '生意失敗',     layer: 'both'       },
    miracle:          { color: '#f50057', icon: '✨', title: '奇蹟',         layer: 'reverse'    },
    unemployment:     { color: '#7f8c8d', icon: '😔', title: '失業',         layer: 'reverse'    },

    // ── Flow layer ───────────────────────────────────────────────────
    asset_trust:      { color: '#5d4037', icon: '🏦', title: '資產信託',     layer: 'flow'       },
    dream:            { color: '#8e24aa', icon: '🌟', title: '夢想',         layer: 'flow'       },
    investment_tile:  { color: '#ff6f00', icon: '🏗️', title: '項目投資',     layer: 'flow'       },
    investment:       { color: '#1565c0', icon: '💎', title: '投資機會',     layer: 'flow'       },
    social_service:   { color: '#00796b', icon: '❤️', title: '社會服務',     layer: 'flow'       },
    audit:            { color: '#e65100', icon: '🔍', title: '查稅審計',     layer: 'flow'       },
    income:           { color: '#2e7d32', icon: '💵', title: '分紅收入',     layer: 'flow'       },
    flowbankruptcy:   { color: '#b71c1c', icon: '💥', title: '破產陷阱',     layer: 'flow'       },

    // ── Fallback ─────────────────────────────────────────────────────
    default:          { color: '#607d8b', icon: '📍', title: '格子',         layer: 'unknown'    }
};

/**
 * Get metadata for a tile type. Falls back to default if unknown.
 */
export function getTileTypeMeta(type) {
    return TILE_TYPES[type] || TILE_TYPES.default;
}

/**
 * Tile types that trigger their own card modal (skip generic landing modal).
 */
export const SKIP_LANDING_MODAL_TYPES = new Set([
    'opportunity',
    'awareness',
    'lier',
    'police',
    'volunteer',
    'hardship',
    'reverse_entry',
    'investment',
    'investment_tile',
    'dream',
    'social_service'
]);