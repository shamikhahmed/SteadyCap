'use strict';
const DopamineEngine = (() => {
  const STAGES = [
    {
      stage: 0, name: 'Flood', color: SCBrand.h_ff3b30,
      description: 'Your dopamine system is overwhelmed. Baseline reward capacity is critically low.',
      symptoms: ['Everything feels grey or boring', 'Intense cravings', 'Irritability and mood swings', 'Low energy and motivation'],
      tips: ['Survive each hour — this will pass', 'Exercise even briefly — it forces dopamine production', 'Cold water on your face to break the state', 'Do not make major decisions right now'],
    },
    {
      stage: 1, name: 'Crash', color: SCBrand.h_ff6b35,
      description: 'Dopamine is bottoming out. This is the flatline. It is temporary and a sign of healing.',
      symptoms: ['Anhedonia — nothing feels good', 'Fatigue and brain fog', 'Poor sleep', 'Social withdrawal urge'],
      tips: ['This stage is where most people relapse — know that', 'Protein and healthy fats support dopamine synthesis', 'Sunlight exposure in the morning helps reset rhythms', 'Force social interaction even when you don\'t want it'],
    },
    {
      stage: 2, name: 'Rebuilding', color: SCBrand.h_ffd60a,
      description: 'Receptors are recovering sensitivity. Small things are starting to feel rewarding again.',
      symptoms: ['Variable mood — good days and bad days', 'Some cravings still', 'Sleep improving', 'Occasional moments of genuine pleasure'],
      tips: ['Stack wins — small achievements matter now', 'Introduce exercise as a primary dopamine strategy', 'Start re-engaging with hobbies you abandoned', 'Track your progress — the data is motivating'],
    },
    {
      stage: 3, name: 'Recalibrating', color: SCBrand.h_4ecdc4,
      description: 'Dopamine baseline stabilising. Motivation and pleasure are returning to normal function.',
      symptoms: ['Consistent mood most days', 'Cravings rare and manageable', 'Deeper sleep', 'Growing sense of purpose'],
      tips: ['You\'re over the hardest part — protect this momentum', 'Identify what triggered past relapses and plan for it', 'Deepen good habits that support dopamine naturally', 'Start thinking about goals — you have capacity now'],
    },
    {
      stage: 4, name: 'Optimised', color: SCBrand.h_06d6a0,
      description: 'Dopamine system fully recalibrated. Normal rewards feel genuinely rewarding. This is baseline.',
      symptoms: ['Stable, positive mood baseline', 'Strong motivation', 'Quality sleep', 'Real-world engagement is fulfilling'],
      tips: ['Maintain the environment that got you here', 'High-stress periods can temporarily weaken this — plan ahead', 'Help someone else in early recovery', 'You\'ve done something genuinely hard'],
    },
  ];

  const STAGE_THRESHOLDS = {
    smoking:          [0, 48, 168, 720, 2160],
    vape:             [0, 48, 168, 720, 2160],
    nicotine_pouches: [0, 48, 168, 720, 2160],
    shisha:           [0, 48, 168, 720, 2160],
    weed:             [0, 72, 336, 1440, 4320],
    porn:             [0, 72, 336, 720, 2160],
    social_media:     [0, 24, 168, 720, 2160],
    gaming:           [0, 24, 168, 720, 2160],
    sugar:            [0, 24, 168, 720, 2160],
    caffeine:         [0, 12, 72, 336, 720],
    alcohol:          [0, 48, 168, 720, 2160],
    masturbation:     [0, 72, 336, 720, 2160],
    custom:           [0, 48, 168, 720, 2160],
  };

  function getStage(habitType, hoursClean) {
    const thresholds = STAGE_THRESHOLDS[habitType] || STAGE_THRESHOLDS.smoking;
    let idx = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (hoursClean >= thresholds[i]) idx = i;
    }
    return { ...STAGES[idx], thresholdHours: thresholds[idx] };
  }

  function progressInStage(habitType, hoursClean) {
    const thresholds = STAGE_THRESHOLDS[habitType] || STAGE_THRESHOLDS.smoking;
    let idx = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (hoursClean >= thresholds[i]) idx = i;
    }
    if (idx >= thresholds.length - 1) return 100;
    const start = thresholds[idx];
    const end = thresholds[idx + 1];
    return Math.round(Math.min(100, ((hoursClean - start) / (end - start)) * 100));
  }

  return { getStage, progressInStage };
})();
window.DopamineEngine = DopamineEngine;
