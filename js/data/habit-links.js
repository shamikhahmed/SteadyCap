'use strict';
/**
 * Cross-habit recovery graph — clusters, shared body systems, and pairwise interference.
 * Used by LinkedRecoveryEngine to model realistic whole-body healing.
 */
window.HABIT_CLUSTERS = {
  nicotine: {
    label: 'Nicotine',
    types: ['smoking', 'vape', 'nicotine_pouches', 'shisha'],
    sharedSystems: ['cardiovascular', 'heart', 'blood_pressure', 'co_levels', 'circulation', 'dopamine', 'sensory'],
    rule: 'min_recovery',
    message: 'Nicotine from another source is still active — heart, circulation, and receptor recovery follow your shortest nicotine-free stretch.',
  },
  inhaled: {
    label: 'Inhaled damage',
    types: ['smoking', 'vape', 'shisha', 'weed'],
    sharedSystems: ['lungs', 'airways'],
    rule: 'min_recovery',
    message: 'Airways are still exposed through another inhaled habit — lung healing is limited to your weakest inhaled recovery.',
  },
  behavioural_dopamine: {
    label: 'Reward system',
    types: ['porn', 'gaming', 'social_media', 'masturbation', 'weed', 'sugar', 'smoking', 'vape', 'nicotine_pouches', 'shisha'],
    sharedSystems: ['dopamine', 'focus', 'motivation', 'attention', 'confidence', 'willpower'],
    rule: 'min_recovery',
    message: 'Another high-stimulus habit may still compete for attention — recovery often follows the slowest habit.',
  },
  sleep: {
    label: 'Sleep architecture',
    types: ['alcohol', 'caffeine', 'weed', 'gaming', 'social_media', 'porn', 'masturbation'],
    sharedSystems: ['sleep'],
    rule: 'min_recovery',
    message: 'Sleep recovery is only as strong as your worst sleep-disrupting habit still active.',
  },
  liver_metabolic: {
    label: 'Liver & metabolism',
    types: ['alcohol', 'sugar'],
    sharedSystems: ['liver', 'blood_sugar', 'gut', 'inflammation', 'energy'],
    rule: 'min_recovery',
    message: 'Liver and metabolic healing are slowed while alcohol or heavy sugar load continues.',
  },
  anxiety_calm: {
    label: 'Nervous system calm',
    types: ['caffeine', 'alcohol', 'weed', 'porn', 'social_media'],
    sharedSystems: ['anxiety', 'brain', 'mood'],
    rule: 'min_recovery',
    message: 'Anxiety and mental calm recover together — stimulants, alcohol, or compulsive scrolling keep the nervous system activated.',
  },
  compulsive_screen: {
    label: 'Compulsive screen use',
    types: ['gaming', 'social_media', 'porn'],
    sharedSystems: ['attention', 'focus', 'social', 'creativity'],
    rule: 'min_recovery',
    message: 'Screen-based compulsions share attention circuits — quitting one while another continues slows focus recovery.',
  },
  oral_health: {
    label: 'Oral health',
    types: ['smoking', 'vape', 'nicotine_pouches', 'shisha', 'sugar', 'alcohol'],
    sharedSystems: ['oral', 'sensory'],
    rule: 'min_recovery',
    message: 'Gums, taste receptors, and oral tissue heal across all oral irritants — slowest habit sets the pace.',
  },
  hair_scalp: {
    label: 'Hair & scalp',
    types: ['smoking', 'vape', 'nicotine_pouches', 'shisha', 'weed', 'sugar', 'alcohol', 'caffeine'],
    sharedSystems: ['hair'],
    rule: 'min_recovery',
    message: 'Scalp circulation and follicle recovery are affected by nicotine, stress hormones, and inflammation from multiple habits.',
  },
  cardiovascular_stress: {
    label: 'Cardiovascular load',
    types: ['smoking', 'vape', 'shisha', 'nicotine_pouches', 'alcohol', 'caffeine', 'sugar'],
    sharedSystems: ['cardiovascular', 'heart', 'circulation', 'blood_pressure'],
    rule: 'min_recovery',
    message: 'Heart and vessels recover from combined cardiovascular stress — your body tracks total load, not one habit at a time.',
  },
};

/** Map milestone / cluster keys to bodyEngine system keys */
window.SYSTEM_EQUIVALENTS = {
  cardiovascular: ['cardiovascular', 'heart', 'blood_pressure', 'co_levels'],
  heart: ['cardiovascular', 'heart', 'blood_pressure'],
  lungs: ['lungs', 'airways'],
  airways: ['lungs', 'airways'],
  dopamine: ['dopamine', 'motivation', 'willpower'],
  neurological: ['dopamine', 'brain', 'focus', 'motivation', 'attention'],
  sensory: ['sensory', 'oral'],
  sleep: ['sleep'],
  liver: ['liver'],
  focus: ['focus', 'attention'],
  attention: ['attention', 'focus'],
  mood: ['mood', 'anxiety', 'brain'],
  energy: ['energy'],
  social: ['social'],
  hair: ['hair'],
  oral: ['oral', 'sensory'],
  gut: ['gut', 'blood_sugar', 'inflammation'],
  skin: ['skin'],
  immune: ['immune'],
  cognition: ['cognition', 'brain', 'focus'],
};

/**
 * Pairwise cross-effects: viewing habit → other habit still limiting recovery.
 * weight 0–1 = how much the other habit's system state blends in when it has fewer clean hours.
 */
window.HABIT_CROSS_EFFECTS = {
  smoking: {
    vape: { systems: { lungs: 0.75, cardiovascular: 0.6, circulation: 0.55, sensory: 0.45, hair: 0.35 }, note: 'Vaping still delivers nicotine and aerosol — cigarette lung and heart healing stays partial until vaping stops too.' },
    shisha: { systems: { lungs: 0.65, cardiovascular: 0.55, co_levels: 0.7, hair: 0.3 }, note: 'Shisha sessions add CO, heat, and nicotine on top of cigarette damage.' },
    nicotine_pouches: { systems: { cardiovascular: 0.7, dopamine: 0.65, circulation: 0.5 }, note: 'Nicotine pouches keep receptors occupied even after quitting cigarettes.' },
    weed: { systems: { lungs: 0.4 }, note: 'Cannabis smoke still inflames airways if you also smoke joints.' },
    alcohol: { systems: { cardiovascular: 0.35, immune: 0.3 }, note: 'Alcohol strains the heart and immune system while lungs recover from smoke.' },
    caffeine: { systems: { cardiovascular: 0.25, sleep: 0.3 }, note: 'Heavy caffeine keeps heart rate elevated during early smoke-free recovery.' },
  },
  vape: {
    smoking: { systems: { lungs: 0.4, oral: 0.35 }, note: 'Recent cigarette tar can slow airway clearance early in vape recovery.' },
    shisha: { systems: { lungs: 0.6, cardiovascular: 0.5, airways: 0.55 }, note: 'Hookah between vape sessions keeps nicotine and heat damage elevated.' },
    nicotine_pouches: { systems: { cardiovascular: 0.55, dopamine: 0.5 }, note: 'Pouches maintain nicotine load while you quit vaping.' },
    weed: { systems: { lungs: 0.45, airways: 0.4 }, note: 'Cannabis inhalation adds particulate irritation alongside vape aerosol.' },
    caffeine: { systems: { heart: 0.3, anxiety: 0.25 }, note: 'Caffeine + nicotine withdrawal compounds jitters and heart rate spikes.' },
  },
  nicotine_pouches: {
    smoking: { systems: { oral: 0.35 }, note: 'Smoking residue still affects oral tissue if you recently quit cigarettes.' },
    vape: { systems: { lungs: 0.3, airways: 0.25 }, note: 'Vape aerosol irritates airways even when pouches replace cigarettes.' },
    shisha: { systems: { cardiovascular: 0.5, co_levels: 0.55 }, note: 'Shisha spikes CO and nicotine beyond pouch levels.' },
    caffeine: { systems: { blood_pressure: 0.4, heart: 0.35 }, note: 'Nicotine + caffeine compound blood pressure elevation.' },
  },
  shisha: {
    smoking: { systems: { lungs: 0.45 }, note: 'Cigarette tar may still slow mucociliary clearance.' },
    vape: { systems: { lungs: 0.6, cardiovascular: 0.5 }, note: 'Vaping between hookah sessions keeps nicotine chronically elevated.' },
    nicotine_pouches: { systems: { cardiovascular: 0.45 }, note: 'Pouches add steady nicotine between heavy shisha sessions.' },
    weed: { systems: { lungs: 0.4 }, note: 'Mixed sessions increase total particulate load on lungs.' },
  },
  weed: {
    smoking: { systems: { lungs: 0.5, cardiovascular: 0.25 }, note: 'Tobacco smoke inflames lungs if you still smoke or mix with joints.' },
    vape: { systems: { lungs: 0.5, airways: 0.45 }, note: 'Nicotine vape adds airway irritation alongside cannabis.' },
    alcohol: { systems: { sleep: 0.6, liver: 0.45, cognition: 0.4 }, note: 'Alcohol + cannabis disrupt REM sleep and slow cognitive rebound.' },
    caffeine: { systems: { sleep: 0.5, anxiety: 0.45 }, note: 'Caffeine masks cannabis hangover but prevents deep sleep recovery.' },
    gaming: { systems: { motivation: 0.4, dopamine: 0.35 }, note: 'Many people find gaming can substitute for other rewards — motivation often recovers faster when both ease together.' },
    porn: { systems: { dopamine: 0.45, focus: 0.35 }, note: 'Many people find quitting one high-stimulus habit only partially helps if another continues.' },
  },
  porn: {
    masturbation: { systems: { dopamine: 0.7, focus: 0.55, confidence: 0.4 }, note: 'Masturbation often pairs with porn — reward circuits stay hijacked until both stop.' },
    social_media: { systems: { attention: 0.6, dopamine: 0.5, focus: 0.45 }, note: 'Infinite scroll provides the same novelty hits as porn — attention stays fragmented.' },
    gaming: { systems: { dopamine: 0.55, motivation: 0.45, sleep: 0.35 }, note: 'Gaming delivers variable-ratio rewards that compete with porn recovery.' },
    weed: { systems: { dopamine: 0.4, motivation: 0.35 }, note: 'Cannabis blunts motivation while porn circuits heal.' },
    alcohol: { systems: { sleep: 0.4, mood: 0.35 }, note: 'Alcohol lowers inhibitions and worsens night-time relapse risk.' },
    caffeine: { systems: { anxiety: 0.35, sleep: 0.3 }, note: 'Caffeine anxiety can trigger stress-driven urges.' },
  },
  masturbation: {
    porn: { systems: { dopamine: 0.65, focus: 0.5 }, note: 'Porn super-stimulates the same circuits — quitting masturbation alone is partial without addressing porn.' },
    social_media: { systems: { attention: 0.45, dopamine: 0.4 }, note: 'Social feeds trigger the same novelty-seeking loop.' },
    gaming: { systems: { dopamine: 0.4, energy: 0.3 }, note: 'Late-night gaming sessions often co-occur and drain recovery energy.' },
    weed: { systems: { dopamine: 0.35, motivation: 0.3 }, note: 'Cannabis lowers drive during dopamine recalibration.' },
  },
  social_media: {
    gaming: { systems: { attention: 0.65, dopamine: 0.55, sleep: 0.45 }, note: 'Gaming and scrolling share the same attention fragmentation — both must ease for focus to return.' },
    porn: { systems: { attention: 0.5, dopamine: 0.45 }, note: 'Porn provides stronger dopamine spikes that keep scroll addiction wired.' },
    caffeine: { systems: { sleep: 0.45, anxiety: 0.4 }, note: 'Caffeine keeps you scrolling late into the night.' },
    alcohol: { systems: { mood: 0.35, sleep: 0.35 }, note: 'Alcohol mood dips increase comfort-scrolling urges.' },
    weed: { systems: { attention: 0.35, motivation: 0.3 }, note: 'Cannabis reduces initiative to break the scroll loop.' },
  },
  gaming: {
    social_media: { systems: { attention: 0.6, sleep: 0.5, social: 0.4 }, note: 'Social feeds between gaming sessions prevent attention recovery.' },
    porn: { systems: { dopamine: 0.5, motivation: 0.4 }, note: 'Porn provides higher-intensity rewards that keep gaming dopamine tolerance elevated.' },
    caffeine: { systems: { sleep: 0.55, heart: 0.35 }, note: 'Energy drinks + late gaming destroy sleep-based recovery.' },
    sugar: { systems: { energy: 0.4, blood_sugar: 0.35 }, note: 'Sugar crashes mirror gaming withdrawal fatigue.' },
    weed: { systems: { motivation: 0.4, focus: 0.35 }, note: 'Weed makes real-world goals feel less rewarding than the game.' },
  },
  sugar: {
    alcohol: { systems: { liver: 0.55, gut: 0.5, inflammation: 0.45 }, note: 'Alcohol and sugar both load the liver and gut — metabolic recovery needs both to ease.' },
    caffeine: { systems: { blood_sugar: 0.4, anxiety: 0.35, energy: 0.35 }, note: 'Caffeine + sugar spikes create crash cycles that mimic junk food cravings.' },
    weed: { systems: { gut: 0.3, motivation: 0.25 }, note: 'Munchies reinforce sugar pathways during cannabis recovery.' },
    gaming: { systems: { dopamine: 0.35, energy: 0.3 }, note: 'Gaming snacks keep sugar-reward loops active.' },
    smoking: { systems: { inflammation: 0.25 }, note: 'Smoking increases systemic inflammation that slows gut healing.' },
  },
  alcohol: {
    weed: { systems: { liver: 0.55, sleep: 0.6, brain: 0.45 }, note: 'Cannabis disrupts sleep architecture while the liver clears alcohol damage.' },
    caffeine: { systems: { sleep: 0.65, anxiety: 0.55, heart: 0.35 }, note: 'Caffeine prevents the deep sleep your brain needs during alcohol recovery.' },
    sugar: { systems: { liver: 0.45, blood_sugar: 0.4 }, note: 'Alcohol cravings often swap to sugar — liver still processes both.' },
    smoking: { systems: { cardiovascular: 0.4, immune: 0.35 }, note: 'Smoking + drinking compound heart and immune damage.' },
    porn: { systems: { sleep: 0.35, mood: 0.3 }, note: 'Alcohol lowers inhibitions for night-time compulsive habits.' },
    gaming: { systems: { sleep: 0.35, liver: 0.25 }, note: 'Late gaming delays liver recovery window during sleep.' },
  },
  caffeine: {
    alcohol: { systems: { sleep: 0.6, anxiety: 0.5, heart: 0.4 }, note: 'Caffeine masks alcohol fatigue but blocks restorative sleep.' },
    weed: { systems: { sleep: 0.45, anxiety: 0.35 }, note: 'Weed + caffeine create restless, non-restorative nights.' },
    sugar: { systems: { blood_sugar: 0.45, energy: 0.4 }, note: 'Sweet coffee drinks keep glucose volatility high.' },
    gaming: { systems: { sleep: 0.5, heart: 0.35 }, note: 'Gaming marathons fueled by caffeine delay natural energy recovery.' },
    social_media: { systems: { sleep: 0.45, attention: 0.3 }, note: 'Evening scrolling + caffeine push bedtime later every night.' },
    nicotine_pouches: { systems: { blood_pressure: 0.45, heart: 0.4 }, note: 'Nicotine and caffeine synergistically raise blood pressure.' },
    smoking: { systems: { cardiovascular: 0.35 }, note: 'Smoking already elevates heart rate — caffeine compounds it.' },
  },
  custom: {
    gaming: { systems: { dopamine: 0.4, focus: 0.35 }, note: 'Other high-dopamine habits slow custom habit neural rewiring.' },
    social_media: { systems: { attention: 0.4, dopamine: 0.35 }, note: 'Screen habits compete for the same willpower reserves.' },
    porn: { systems: { dopamine: 0.45 }, note: 'Compulsive sexual content keeps reward thresholds elevated.' },
    weed: { systems: { motivation: 0.35 }, note: 'Cannabis reduces drive to maintain new habits.' },
    alcohol: { systems: { sleep: 0.4, willpower: 0.35 }, note: 'Alcohol weakens impulse control for any habit change.' },
    caffeine: { systems: { anxiety: 0.3, sleep: 0.3 }, note: 'Caffeine jitters make new routines harder to sustain.' },
  },
};

window.HABIT_TYPE_ICONS = {
  smoking: '🚬', vape: '💨', nicotine_pouches: '🟦', shisha: '🪔', weed: '🌿',
  porn: '🔒', social_media: '📱', gaming: '🎮', sugar: '🍔', alcohol: '🍺',
  masturbation: '🚫', caffeine: '☕', custom: '✨',
};
