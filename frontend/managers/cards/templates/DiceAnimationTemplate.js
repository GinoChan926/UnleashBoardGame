"use strict";

/**
 * Shows a rolling dice animation before displaying results.
 * Supports 1, 2, or 3 dice depending on the roll type.
 */
export class DiceAnimationTemplate {

    /**
     * Show dice rolling animation, then reveal final values.
     * @param {Array}   diceValues - final dice values [3, 5] for example
     * @param {string}  diceType   - 'normal' | 'clover' | 'lucky_star' | 'flow'
     * @param {Function} onComplete - called after animation ends
     */
    static async show(diceValues, diceType, playerName, onComplete) {
        const overlay = this._createOverlay(diceType, playerName);
        document.body.appendChild(overlay);

        const container = overlay.querySelector('.dice-container');

        diceValues.forEach((finalValue, index) => {
            const dice = this._createDice(index, finalValue, diceType);
            container.appendChild(dice);
        });

        await this._sleep(50);

        overlay.querySelectorAll('.dice').forEach(d => d.classList.add('rolling'));

        const ROLL_DURATION = 1800;
        await this._sleep(ROLL_DURATION);

        overlay.querySelectorAll('.dice').forEach((d, i) => {
            d.classList.remove('rolling');
            d.classList.add('landed');
            d.textContent = this._getDiceFace(diceValues[i]);
        });

        const total = diceValues.reduce((sum, v) => sum + v, 0);
        this._showTotal(overlay, total, diceType);

        await this._sleep(1500);

        overlay.style.transition = 'opacity 0.4s ease';
        overlay.style.opacity = '0';
        await this._sleep(400);

        overlay.remove();
        if (onComplete) onComplete();
    }

    // ==================== Private ====================

    static _createOverlay(diceType, playerName = '') {
        const overlay = document.createElement('div');
        overlay.id = 'diceAnimationOverlay';

        // ✅ Added 'flow' color scheme
        const BG_COLORS = {
            lucky_star: 'rgba(255, 152, 0, 0.85)',
            clover:     'rgba(76, 175, 80, 0.85)',
            flow:       'rgba(33, 150, 243, 0.85)',
            normal:     'rgba(0, 0, 0, 0.85)'
        };

        const LABELS = {
            lucky_star: '⭐ 幸運星！3 顆骰子！',
            clover:     '🍀 四葉草！2 顆骰子！',
            flow:       '🌊 順流層！2 顆骰子！',
            normal:     '🎲 擲骰子'
        };

        const bgColor = BG_COLORS[diceType] || BG_COLORS.normal;
        let label     = LABELS[diceType]    || LABELS.normal;

        if (playerName) {
            label = `${playerName} - ${label}`;
        }

        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${bgColor};
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
            transition: opacity 0.3s ease;
        `;

        // ✅ Added flow-specific dice glow color
        const DICE_GLOW = {
            lucky_star: '0 0 20px rgba(255, 152, 0, 0.6)',
            clover:     '0 0 20px rgba(76, 175, 80, 0.6)',
            flow:       '0 0 20px rgba(33, 150, 243, 0.6)',
            normal:     'none'
        };

        const glowShadow = DICE_GLOW[diceType] || DICE_GLOW.normal;

        overlay.innerHTML = `
            <style>
                @keyframes diceRoll {
                    0%   { transform: rotateX(0deg)   rotateY(0deg)   rotateZ(0deg); }
                    25%  { transform: rotateX(180deg) rotateY(90deg)  rotateZ(45deg); }
                    50%  { transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg); }
                    75%  { transform: rotateX(540deg) rotateY(270deg) rotateZ(135deg); }
                    100% { transform: rotateX(720deg) rotateY(360deg) rotateZ(180deg); }
                }
                @keyframes diceShake {
                    0%, 100% { transform: translate(0, 0); }
                    25%      { transform: translate(-8px, -8px); }
                    50%      { transform: translate(8px, -8px); }
                    75%      { transform: translate(-8px, 8px); }
                }
                @keyframes diceLand {
                    0%   { transform: scale(1.5) rotateY(720deg); }
                    50%  { transform: scale(0.8); }
                    70%  { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                @keyframes labelPulse {
                    0%, 100% { transform: scale(1); }
                    50%      { transform: scale(1.05); }
                }
                @keyframes totalPop {
                    0%   { transform: scale(0);   opacity: 0; }
                    60%  { transform: scale(1.3); opacity: 1; }
                    100% { transform: scale(1);   opacity: 1; }
                }
                @keyframes flowWave {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-6px); }
                }

                .dice-label {
                    color: white;
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 30px;
                    text-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    animation: labelPulse 1s ease infinite;
                }

                .dice-container {
                    display: flex;
                    gap: 30px;
                    justify-content: center;
                    align-items: center;
                    perspective: 800px;
                }

                .dice {
                    width: 100px;
                    height: 100px;
                    background: linear-gradient(135deg, #ffffff, #f0f0f0);
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 72px;
                    color: #222;
                    box-shadow:
                        0 12px 24px rgba(0,0,0,0.4),
                        inset 0 -4px 0 rgba(0,0,0,0.1),
                        inset 0 4px 0 rgba(255,255,255,0.5),
                        ${glowShadow};
                    transform-style: preserve-3d;
                    user-select: none;
                }

                .dice.flow-dice {
                    border: 3px solid rgba(33, 150, 243, 0.6);
                    background: linear-gradient(135deg, #e3f2fd, #bbdefb);
                }

                .dice.rolling {
                    animation:
                        diceRoll 0.6s linear infinite,
                        diceShake 0.15s ease infinite;
                }

                .dice.flow-dice.rolling {
                    animation:
                        diceRoll 0.6s linear infinite,
                        diceShake 0.15s ease infinite,
                        flowWave 0.8s ease infinite;
                }

                .dice.landed {
                    animation: diceLand 0.6s ease-out;
                }

                .dice-total {
                    margin-top: 40px;
                    color: white;
                    font-size: 48px;
                    font-weight: bold;
                    text-shadow: 0 4px 20px rgba(0,0,0,0.7);
                    opacity: 0;
                }

                .dice-total.show {
                    animation: totalPop 0.6s ease-out forwards;
                }
            </style>

            <div class="dice-label">${label}</div>
            <div class="dice-container"></div>
            <div class="dice-total"></div>
        `;

        return overlay;
    }

    static _createDice(index, finalValue, diceType) {
        const dice = document.createElement('div');
        dice.className = 'dice';

        // ✅ Add flow-specific class for styling
        if (diceType === 'flow') {
            dice.classList.add('flow-dice');
        }

        dice.textContent = this._getDiceFace(Math.floor(Math.random() * 6) + 1);
        dice.style.animationDelay = `${index * 0.1}s`;
        return dice;
    }

    static _getDiceFace(value) {
        const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return faces[value - 1] || '?';
    }

    static _showTotal(overlay, total, diceType) {
        const totalEl = overlay.querySelector('.dice-total');
        if (!totalEl) return;

        // ✅ Added flow label
        const TOTAL_LABELS = {
            lucky_star: `⭐ 總計 ${total} 步！`,
            clover:     `🍀 總計 ${total} 步！`,
            flow:       `🌊 總計 ${total} 步！`,
            normal:     `總步數: ${total}`
        };

        totalEl.textContent = TOTAL_LABELS[diceType] || TOTAL_LABELS.normal;
        totalEl.classList.add('show');
    }

    static _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}