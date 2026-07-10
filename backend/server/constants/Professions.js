"use strict";

const PROFESSIONS = {
    doctor:       { name: "👨‍⚕️ 醫生",  salary: 15000, sideIncome: 0,    cash: 2000000, energy: 2, maxEnergy: 100, livingExpense: 8000, tax: 1500, luck: 5.0 },
    engineer:     { name: "👨‍🔧 工程師", salary: 12000, sideIncome: 0,    cash: 15000,   energy: 3, maxEnergy: 100, livingExpense: 6000, tax: 1200, luck: 5.5 },
    teacher:      { name: "👩‍🏫 教師",  salary: 8000,  sideIncome: 0,    cash: 10000,   energy: 5, maxEnergy: 100, livingExpense: 4500, tax: 800,  luck: 6.0 },
    artist:       { name: "🎨 藝術家", salary: 6000,  sideIncome: 1000, cash: 8000,    energy: 6, maxEnergy: 100, livingExpense: 4000, tax: 600,  luck: 7.0 },
    entrepreneur: { name: "🚀 創業者", salary: 10000, sideIncome: 2000, cash: 12000,   energy: 4, maxEnergy: 100, livingExpense: 7000, tax: 1300, luck: 5.8 }
};

module.exports = { PROFESSIONS };