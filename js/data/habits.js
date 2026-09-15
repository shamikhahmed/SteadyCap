'use strict';
const HABITS_CONFIG = {
  smoking: {
    name: 'Smoking', icon: '🚬', color: SCBrand.h_ff6b35,
    configFields: [
      { id: 'cigarettesPerDay', label: 'Cigarettes per day', type: 'number', placeholder: '10' },
      { id: 'yearsSmoked', label: 'Years smoking', type: 'number', placeholder: '5' },
      { id: 'costPerPack', label: 'Cost per pack', type: 'number', placeholder: '8.00' },
      { id: 'cigarettesPerPack', label: 'Cigarettes per pack', type: 'number', placeholder: '20', default: 20 },
    ],
    computeCostPerDay: (cfg) => (cfg.cigarettesPerDay / (cfg.cigarettesPerPack || 20)) * (cfg.costPerPack || 0),
  },
  vape: {
    name: 'Vaping', icon: '💨', color: SCBrand.h_4ecdc4,
    configFields: [
      { id: 'deviceType', label: 'Device type', type: 'select', options: ['Pod System','Box Mod','Disposable','Pen Vape','Other'] },
      { id: 'deviceBrand', label: 'Device / brand (optional)', type: 'text', placeholder: 'e.g. Vuse, Juul, Smok, Voopoo', optional: true },
      { id: 'nicType', label: 'Nicotine type', type: 'select', options: ['Nicotine Salt (Nic Salt)','Freebase Nicotine'] },
      { id: 'nicStrength', label: 'Nicotine strength (mg/mL)', type: 'number', placeholder: '20' },
      { id: 'wattage', label: 'Wattage (W) — box mods only', type: 'number', placeholder: '40', optional: true, showIf: { field: 'deviceType', value: 'Box Mod' } },
      { id: 'dailyPuffs', label: 'Estimated daily puffs', type: 'number', placeholder: '200' },
      { id: 'podsPerWeek', label: 'Pods / coils per week', type: 'number', placeholder: '2' },
      { id: 'flavour', label: 'Favourite flavour (optional)', type: 'text', placeholder: 'e.g. mango, mint, tobacco', optional: true },
      { id: 'costPerPod', label: 'Cost per pod/coil', type: 'number', placeholder: '5.00' },
    ],
    computeCostPerDay: (cfg) => ((cfg.podsPerWeek || 0) * (cfg.costPerPod || 0)) / 7,
  },
  nicotine_pouches: {
    name: 'Nicotine Pouches', icon: '🟦', color: SCBrand.h_bf5af2,
    configFields: [
      { id: 'brand', label: 'Brand (optional)', type: 'text', placeholder: 'Zyn, On!, Velo...', optional: true },
      { id: 'strengthMg', label: 'Strength (mg)', type: 'number', placeholder: '6' },
      { id: 'pouchesPerDay', label: 'Pouches per day', type: 'number', placeholder: '8' },
      { id: 'costPerTin', label: 'Cost per tin', type: 'number', placeholder: '6.00' },
      { id: 'pouchesPerTin', label: 'Pouches per tin', type: 'number', placeholder: '20', default: 20 },
    ],
    computeCostPerDay: (cfg) => (cfg.pouchesPerDay / (cfg.pouchesPerTin || 20)) * (cfg.costPerTin || 0),
  },
  shisha: {
    name: 'Shisha / Hookah', icon: '🪔', color: SCBrand.h_ffd60a,
    configFields: [
      { id: 'sessionsPerWeek', label: 'Sessions per week', type: 'number', placeholder: '3' },
      { id: 'sessionDuration', label: 'Average session duration (mins)', type: 'number', placeholder: '60' },
      { id: 'costPerSession', label: 'Cost per session', type: 'number', placeholder: '15' },
    ],
    computeCostPerDay: (cfg) => ((cfg.sessionsPerWeek || 0) * (cfg.costPerSession || 0)) / 7,
  },
  weed: {
    name: 'Weed / Cannabis', icon: '🌿', color: SCBrand.h_06d6a0,
    configFields: [
      { id: 'gramsPerDay', label: 'Grams per day', type: 'number', placeholder: '1' },
      { id: 'costPerGram', label: 'Cost per gram', type: 'number', placeholder: '10' },
      { id: 'method', label: 'Primary method', type: 'select', options: ['Joints','Bong','Vaporizer','Edibles','Mixed'] },
    ],
    computeCostPerDay: (cfg) => (cfg.gramsPerDay || 0) * (cfg.costPerGram || 0),
  },
  porn: {
    name: 'Porn', icon: '🔒', color: SCBrand.h_ff3b30,
    configFields: [
      { id: 'frequencyPerWeek', label: 'Sessions per week', type: 'number', placeholder: '7' },
      { id: 'avgDuration', label: 'Average duration (mins)', type: 'number', placeholder: '30' },
      { id: 'primaryTrigger', label: 'Primary trigger', type: 'select', options: ['Boredom','Stress','Loneliness','Night time','Anxiety','Habit'] },
    ],
    computeCostPerDay: () => 0,
  },
  social_media: {
    name: 'Social Media', icon: '📱', color: SCBrand.h_0a84ff,
    configFields: [
      { id: 'hoursPerDay', label: 'Hours per day', type: 'number', placeholder: '4' },
      { id: 'primaryApp', label: 'Primary app', type: 'select', options: ['TikTok','Instagram','Twitter/X','YouTube','Snapchat','Reddit','Mixed'] },
    ],
    computeCostPerDay: () => 0,
  },
  gaming: {
    name: 'Gaming', icon: '🎮', color: SCBrand.h_bf5af2,
    configFields: [
      { id: 'hoursPerDay', label: 'Hours per day (beyond healthy amount)', type: 'number', placeholder: '4' },
      { id: 'platform', label: 'Primary platform', type: 'select', options: ['PC','PlayStation','Xbox','Mobile','Mixed'] },
    ],
    computeCostPerDay: () => 0,
  },
  sugar: {
    name: 'Junk Food / Sugar', icon: '🍔', color: SCBrand.h_ffd60a,
    configFields: [
      { id: 'spendPerDay', label: 'Daily spend on junk food', type: 'number', placeholder: '10' },
      { id: 'mainIssue', label: 'Primary issue', type: 'select', options: ['Sugar cravings','Fast food','Binge eating','Snacking','Sugary drinks'] },
    ],
    computeCostPerDay: (cfg) => cfg.spendPerDay || 0,
  },
  alcohol: {
    name: 'Alcohol', icon: '🍺', color: SCBrand.h_ff9500,
    configFields: [
      { id: 'drinksPerWeek', label: 'Drinks per week', type: 'number', placeholder: '14' },
      { id: 'avgCostPerDrink', label: 'Average cost per drink', type: 'number', placeholder: '8.00' },
      { id: 'severity', label: 'Usage level', type: 'select', options: ['Social only','Regular','Heavy','Daily'] },
    ],
    computeCostPerDay: (cfg) => ((cfg.drinksPerWeek || 0) * (cfg.avgCostPerDrink || 0)) / 7,
  },
  masturbation: {
    name: 'Masturbation', icon: '🚫', color: SCBrand.h_ff2d55,
    configFields: [
      { id: 'frequencyPerWeek', label: 'Sessions per week', type: 'number', placeholder: '7' },
      { id: 'primaryTrigger', label: 'Primary trigger', type: 'select', options: ['Boredom','Stress','Loneliness','Night time','Anxiety','Habit'] },
    ],
    computeCostPerDay: () => 0,
  },
  caffeine: {
    name: 'Excess Caffeine', icon: '☕', color: SCBrand.h_ff6b35,
    configFields: [
      { id: 'cupsPerDay', label: 'Cups of coffee per day', type: 'number', placeholder: '5' },
      { id: 'energyDrinksPerDay', label: 'Energy drinks per day', type: 'number', placeholder: '0' },
      { id: 'costPerCup', label: 'Average cost per coffee', type: 'number', placeholder: '3.50' },
    ],
    computeCostPerDay: (cfg) => ((cfg.cupsPerDay || 0) * (cfg.costPerCup || 0)) + ((cfg.energyDrinksPerDay || 0) * 2.5),
  },
};
window.HABITS_CONFIG = HABITS_CONFIG;
