"use strict";

/**
 * Shows a rolling dice animation before displaying results.
 * Supports 1, 2, or 3 dice depending on the roll type.
 */
export class DiceAnimationTemplate {

    /**
     * Show dice rolling animation, then reveal final values.
     * @param {Array}   diceValues - final dice values [3, 5] for example
     * @param {string}  diceType   - 'normal' | 'clover' | 'lucky_star'
     * @param {Function} onComplete - called after animation ends
     */
    static async show(diceValues, diceType, playerName, onComplete) {
        const overlay = this._createOverlay(diceType, playerName);
        document.body.appendChild(overlay);

        // Get dice container inside overlay
        const container = overlay.querySelector('.dice-container');

        // Create dice elements
        diceValues.forEach((finalValue, index) => {
            const dice = this._createDice(index, finalValue);
            container.appendChild(dice);
        });

        // Wait a tick so browser renders
        await this._sleep(50);

        // Start rolling animation
        overlay.querySelectorAll('.dice').forEach(d => d.classList.add('rolling'));

        // Rolling duration
        const ROLL_DURATION = 1800;
        await this._sleep(ROLL_DURATION);

        // Stop rolling, show final values
        overlay.querySelectorAll('.dice').forEach((d, i) => {
            d.classList.remove('rolling');
            d.classList.add('landed');
            d.textContent = this._getDiceFace(diceValues[i]);
        });

        // Show total
        const total = diceValues.reduce((sum, v) => sum + v, 0);
        this._showTotal(overlay, total, diceType);

        // Wait so player can read
        await this._sleep(1500);

        // Fade out
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

        // Color scheme based on dice type
        const bgColor = diceType === 'lucky_star'
            ? 'rgba(255, 152, 0, 0.85)'
            : diceType === 'clover'
                ? 'rgba(76, 175, 80, 0.85)'
                : 'rgba(0, 0, 0, 0.85)';

        let label = diceType === 'lucky_star'
            ? '⭐ 幸運星！3 顆骰子！'
            : diceType === 'clover'
                ? '🍀 四葉草！2 顆骰子！'
                : '🎲 擲骰子';

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
                        inset 0 4px 0 rgba(255,255,255,0.5);
                    transform-style: preserve-3d;
                    user-select: none;
                }

                .dice.rolling {
                    animation:
                        diceRoll 0.6s linear infinite,
                        diceShake 0.15s ease infinite;
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
            <div class="dice-label">${label}</div>
            <div class="dice-total"></div>
        `;

        return overlay;
    }

    static _createDice(index, finalValue) {
        const dice = document.createElement('div');
        dice.className = 'dice';
        // Start with a random face while rolling
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

        let text = `總步數: ${total}`;
        if (diceType === 'lucky_star') {
            text = `⭐ 總計 ${total} 步！`;
        } else if (diceType === 'clover') {
            text = `🍀 總計 ${total} 步！`;
        }

        totalEl.textContent = text;
        totalEl.classList.add('show');
    }

    static _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}