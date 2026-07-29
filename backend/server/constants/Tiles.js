"use strict";

const streamlineTiles = [
    { name: "義工卡",     type: "volunteer" },
    { name: "騙子卡",     type: "lier" },
    { name: "察覺卡",     type: "awareness" },
    { name: "機會卡",     type: "reverse_entry" },
    { name: "結算日",     type: "reverse_entry" },
    { name: "機會卡",     type: "reverse_entry" },
    { name: "逆流層入口", type: "reverse_entry" },
    { name: "機會卡",     type: "opportunity" },
    { name: "幸運星",     type: "lucky_star" },
    { name: "機會卡",     type: "opportunity" },
    { name: "察覺卡",     type: "awareness" },
    { name: "機會卡",     type: "opportunity" },
    { name: "結算日",     type: "settlement" },
    { name: "警察卡",     type: "police" },
    { name: "察覺卡",     type: "awareness" },
    { name: "機會卡",     type: "opportunity" },
    { name: "四葉草",     type: "four_leaf_clover" },
    { name: "機會卡",     type: "opportunity" },
    { name: "逆流層出口", type: "reverse_exit" },
    { name: "機會卡",     type: "opportunity" },
    { name: "結算日",     type: "settlement" },
    { name: "機會卡",     type: "opportunity" },
    { name: "察覺卡",     type: "awareness" },
    { name: "機會卡",     type: "opportunity" }
];

const reverseTiles = [
    { name: "覺察卡",     type: "awareness" },
    { name: "逆境自強卡", type: "hardship" },
    { name: "覺察卡",     type: "awareness" },
    { name: "生意失敗",   type: "business_failure" },
    { name: "奇蹟",       type: "miracle" },
    { name: "失業",       type: "unemployment" },
    { name: "覺察卡",     type: "awareness" },
    { name: "逆境自強卡", type: "hardship" },
    { name: "覺察卡",     type: "awareness" }
];

const flowTiles = [
    { name: "資產信託",   type: "asset_trust" },
    { name: "查稅審計",   type: "audit" },
    { name: "項目投資",   type: "investment_tile" },
    { name: "藝術基金",   type: "investment" },
    { name: "社會服務中心", type: "social_service" },
    { name: "私人飛機",   type: "dream",           needEnergy: 40 },
    { name: "項目投資",   type: "investment_tile" },
    { name: "環球旅遊",   type: "dream",           needEnergy: 45 },
    { name: "慈善基金會", type: "investment" },
    { name: "隱形俱樂部", type: "investment" },
    { name: "項目投資",   type: "investment_tile" },
    { name: "終極夢想",   type: "dream",           needEnergy: 50 },
    { name: "財務自由",   type: "dream",           needEnergy: 35 },
    { name: "豪華別墅",   type: "dream",           needEnergy: 45 },
    { name: "項目投資",   type: "investment_tile" },
    { name: "頂級收藏",   type: "investment" },
    { name: "高級俱樂部", type: "investment" },
    { name: "家族基金",   type: "investment" },
    { name: "項目投資",   type: "investment_tile" },
    { name: "房地產帝國", type: "investment" },
    { name: "社會服務中心", type: "social_service" },
    { name: "科技股票",   type: "investment" },
    { name: "項目投資",   type: "investment_tile" },
    { name: "珍稀物業",   type: "investment" },
    { name: "商業帝國",   type: "investment" },
    { name: "董事會席位", type: "investment" },
    { name: "項目投資",   type: "investment_tile" },
    { name: "年度評選",   type: "event" },
    { name: "財富峰會",   type: "event" },
    { name: "投資分紅",   type: "income" },
    { name: "項目投資",   type: "investment_tile" },
    { name: "終極成就",   type: "dream",           needEnergy: 60 }
];

module.exports = { streamlineTiles, reverseTiles, flowTiles };