'use strict';
/** 30-day structured recovery program stubs — week-by-week tips per habit type */
const RECOVERY_PROGRAMS = {
  smoking: {
    title: '30-Day Smoke-Free Program',
    weeks: [
      { week: 1, label: 'Survive the first 72 hours', tips: ['Track every craving — they peak at 3–5 minutes', 'Replace the hand-to-mouth habit with gum or tea', 'Avoid alcohol and coffee triggers this week', 'Tell one person you quit — accountability helps'] },
      { week: 2, label: 'Rebuild your routine', tips: ['Walk after meals instead of smoking', 'Deep-clean spaces that smell like smoke', 'Notice improved taste and smell — write it down', 'Reward yourself with saved cigarette money'] },
      { week: 3, label: 'Strengthen new identity', tips: ['Plan social situations with an exit strategy', 'Practice saying "I don\'t smoke" not "I\'m trying"', 'Add 10 minutes of cardio daily', 'Review your longest craving-free stretch so far'] },
      { week: 4, label: 'Lock in the habit', tips: ['Calculate total money saved — celebrate it', 'Identify your top 3 triggers and plan responses', 'Help someone else start their quit journey', 'Set a 60-day milestone goal'] },
    ],
  },
  vape: {
    title: '30-Day Vape-Free Program',
    weeks: [
      { week: 1, label: 'Break the puff loop', tips: ['Remove devices from your bedroom and car', 'Nicotine cravings spike — use the 5-minute rule', 'Replace morning vape with cold water + stretch', 'Log puff urges without acting on them'] },
      { week: 2, label: 'Detox your environment', tips: ['Dispose of pods, coils, and chargers', 'Avoid vape shops and vaping friends temporarily', 'Track sleep improvements in your journal', 'Use nicotine-free gum only if needed'] },
      { week: 3, label: 'Rebuild dopamine naturally', tips: ['Exercise 20 min when cravings hit hardest', 'Reduce caffeine — it can trigger oral fixation', 'Practice box breathing: 4-4-4-4', 'Notice clearer lungs during light activity'] },
      { week: 4, label: 'Stay vape-free long term', tips: ['Write your "why I quit" on your lock screen', 'Plan a treat funded by vape savings', 'Review relapse warning signs weekly', 'Commit to 90 days — the brain rewires by then'] },
    ],
  },
  nicotine_pouches: {
    title: '30-Day Pouch-Free Program',
    weeks: [
      { week: 1, label: 'Taper and track', tips: ['Cut daily pouches by 25% — don\'t go cold turkey unless ready', 'Keep tins out of reach, not in pockets', 'Swap one pouch session for mint gum', 'Hydrate — dry mouth drives pouch use'] },
      { week: 2, label: 'Break oral habits', tips: ['Identify your top 3 pouch triggers', 'Use sunflower seeds or toothpicks as substitutes', 'Avoid driving with pouches in the console', 'Log gum recession concerns as motivation'] },
      { week: 3, label: 'Nicotine-free days', tips: ['Aim for 3 consecutive pouch-free days', 'Exercise when jaw tension builds', 'Tell coworkers you\'re quitting — less peer pressure', 'Celebrate each pouch-free morning'] },
      { week: 4, label: 'Full freedom', tips: ['Dispose of all remaining tins', 'Calculate annual savings from quitting', 'Plan a dental checkup as a reward', 'Set a 60-day no-pouch goal'] },
    ],
  },
  alcohol: {
    title: '30-Day Alcohol Reset',
    weeks: [
      { week: 1, label: 'Clear the first week', tips: ['Remove alcohol from your home', 'Plan Friday/Saturday activities without drinking', 'Tell a friend your 30-day goal', 'Track sleep quality — it improves fast'] },
      { week: 2, label: 'Find new rituals', tips: ['Replace evening drink with herbal tea or mocktail', 'Avoid bars — try cafes or walks instead', 'Notice mood stability without hangovers', 'Journal what you\'re feeling instead of numbing'] },
      { week: 3, label: 'Social confidence sober', tips: ['Practice ordering non-alcoholic drinks confidently', 'Leave events early if temptation is high', 'Use the money saved for something meaningful', 'Review your energy levels mid-afternoon'] },
      { week: 4, label: 'Decide your long-term path', tips: ['Reflect: do you want permanent sobriety or moderation?', 'Set rules if moderating — days, limits, contexts', 'Celebrate 30 days with a non-alcohol reward', 'Book a health checkup as closure'] },
    ],
  },
  weed: {
    title: '30-Day Cannabis Break',
    weeks: [
      { week: 1, label: 'Ride out withdrawal', tips: ['Sleep may be disrupted — expect vivid dreams', 'Remove paraphernalia from your space', 'Cravings peak at usual smoke times — plan alternatives', 'Exercise helps clear THC metabolites faster'] },
      { week: 2, label: 'Reclaim your clarity', tips: ['Notice improved short-term memory', 'Replace evening smoke with reading or stretching', 'Avoid friends who only socialize while high', 'Track anxiety — it often drops by week 2'] },
      { week: 3, label: 'Rebuild motivation', tips: ['Set one goal you couldn\'t pursue while using', 'Practice boredom tolerance without reaching for weed', 'Journal your dreams — they\'re often vivid now', 'Celebrate clearer mornings'] },
      { week: 4, label: 'Choose your relationship with cannabis', tips: ['Decide: full quit, T-break, or strict limits', 'Write trigger plan for high-risk situations', 'Calculate money saved over 30 days', 'Set a 90-day review date'] },
    ],
  },
  social_media: {
    title: '30-Day Digital Detox',
    weeks: [
      { week: 1, label: 'Remove friction', tips: ['Delete apps from home screen — use browser only', 'Turn off all non-essential notifications', 'Set a 30-minute daily screen time limit', 'Charge phone outside the bedroom'] },
      { week: 2, label: 'Replace the scroll', tips: ['Keep a book or journal where you usually scroll', 'Batch-check messages to 2 fixed times daily', 'Notice boredom — sit with it 5 minutes', 'Track hours reclaimed in a simple log'] },
      { week: 3, label: 'Intentional use only', tips: ['Before opening an app, write why you\'re opening it', 'Unfollow accounts that trigger comparison', 'Add a 10-second pause before every open', 'Plan one screen-free evening per week'] },
      { week: 4, label: 'Sustainable boundaries', tips: ['Write your permanent phone rules', 'Keep only apps that add clear value', 'Celebrate focus gains — note one win daily', 'Review and adjust limits for month 2'] },
    ],
  },
  gaming: {
    title: '30-Day Gaming Balance',
    weeks: [
      { week: 1, label: 'Set hard limits', tips: ['Cap gaming to 1 hour on weekdays', 'Remove games from phone if mobile is the issue', 'Log start and end times honestly', 'Replace one gaming session with a walk'] },
      { week: 2, label: 'Rebuild offline life', tips: ['Schedule one social activity without screens', 'Finish one non-game task before any session', 'Notice irritability when not gaming — it fades', 'Try a creative hobby for 20 minutes daily'] },
      { week: 3, label: 'Mindful play', tips: ['Play only with friends, not solo grinding', 'Set a timer — stop when it rings, no exceptions', 'Review sleep — gaming before bed hurts rest', 'Track mood on gaming vs non-gaming days'] },
      { week: 4, label: 'Long-term balance', tips: ['Define your sustainable weekly hour cap', 'Keep one full day per week game-free', 'Celebrate real-world wins this month', 'Plan month 2 with stricter or looser rules'] },
    ],
  },
  sugar: {
    title: '30-Day Sugar Reset',
    weeks: [
      { week: 1, label: 'Cut the obvious sources', tips: ['Remove sugary drinks and snacks from home', 'Read labels — sugar hides in sauces and bread', 'Expect cravings — they peak days 3–5', 'Eat protein with every meal to stabilize blood sugar'] },
      { week: 2, label: 'Stabilize energy', tips: ['Replace dessert with fruit + nuts', 'Prep healthy snacks on Sunday', 'Notice fewer afternoon crashes', 'Drink water before reaching for sweets'] },
      { week: 3, label: 'Rewire reward pathways', tips: ['Celebrate wins without food rewards', 'Cook one new healthy meal this week', 'Track skin and energy improvements', 'Practice saying no to office treats'] },
      { week: 4, label: 'Sustainable eating', tips: ['Allow one intentional treat per week', 'Calculate money saved on junk food', 'Write your 3 non-negotiable food rules', 'Plan groceries before shopping hungry'] },
    ],
  },
  caffeine: {
    title: '30-Day Caffeine Reset',
    weeks: [
      { week: 1, label: 'Taper, don\'t crash', tips: ['Reduce by one cup or half-caf this week', 'No caffeine after 2 PM', 'Expect headaches days 2–4 — hydrate heavily', 'Replace afternoon coffee with a short walk'] },
      { week: 2, label: 'Find natural energy', tips: ['Prioritize 7+ hours of sleep', 'Morning sunlight within 30 min of waking', 'Try decaf or herbal tea for the ritual', 'Notice anxiety reduction without excess caffeine'] },
      { week: 3, label: 'Steady baseline', tips: ['Cap at 1–2 cups before noon', 'Eat breakfast before coffee', 'Track heart rate if you wear a tracker', 'Exercise boosts energy without jitters'] },
      { week: 4, label: 'Your caffeine rules', tips: ['Decide your permanent daily limit', 'Keep energy drinks out of the house', 'Celebrate better sleep scores', 'Review and adjust for month 2'] },
    ],
  },
  porn: {
    title: '30-Day Recovery Program',
    weeks: [
      { week: 1, label: 'Break the autopilot', tips: ['Install blockers on devices — no shame, just friction', 'Identify your top 3 trigger times and plan alternatives', 'Urges last ~15 minutes — ride them out', 'Tell one trusted person your goal'] },
      { week: 2, label: 'Heal the brain', tips: ['No edging or "just looking" — full abstinence', 'Exercise when urges spike — especially cardio', 'Journal emotions instead of numbing them', 'Sleep 7+ hours — fatigue increases relapse risk'] },
      { week: 3, label: 'Rebuild real connection', tips: ['Spend time with people offline daily', 'Practice boredom without reaching for phone', 'Notice confidence and eye contact improving', 'Avoid isolation — it\'s the biggest trigger'] },
      { week: 4, label: 'Long-term freedom', tips: ['Write your relapse prevention plan', 'List 5 activities for high-risk moments', 'Celebrate integrity — count clean days', 'Consider therapy or a support group if needed'] },
    ],
  },
  masturbation: {
    title: '30-Day Discipline Program',
    weeks: [
      { week: 1, label: 'Establish control', tips: ['Set a clear daily structure — idle time is risky', 'Cold showers or exercise when urges hit', 'Remove triggers from your environment', 'Track urges without acting — build the muscle'] },
      { week: 2, label: 'Redirect energy', tips: ['Channel energy into a physical goal', 'Avoid screens in bed completely', 'Journal what emotions precede urges', 'Sleep and eat well — basics matter'] },
      { week: 3, label: 'Strengthen willpower', tips: ['Practice meditation 5 minutes daily', 'Socialize more — isolation fuels relapse', 'Review your longest stretch so far', 'Replace habit loop with a positive ritual'] },
      { week: 4, label: 'Sustainable discipline', tips: ['Define your ongoing boundaries clearly', 'Plan for high-risk situations in advance', 'Celebrate self-control wins this month', 'Set a 90-day milestone'] },
    ],
  },
  shisha: {
    title: '30-Day Shisha-Free Program',
    weeks: [
      { week: 1, label: 'Skip the sessions', tips: ['Decline shisha invites this week — be direct', 'Nicotine + CO exposure drops within days', 'Replace social shisha with tea or coffee meetups', 'Notice less morning phlegm'] },
      { week: 2, label: 'New social habits', tips: ['Suggest non-shisha activities with friends', 'Calculate weekly shisha spend — shocking motivator', 'Track lung recovery: walk upstairs without wheezing', 'Hydrate — shisha dehydrates heavily'] },
      { week: 3, label: 'Health gains', tips: ['Add cardio 3x this week', 'Notice improved cardiovascular stamina', 'Avoid lounges and triggering environments', 'Journal how you feel vs week 1'] },
      { week: 4, label: 'Stay free', tips: ['Plan how to handle weddings and gatherings', 'Set a 60-day goal', 'Reward yourself with saved session money', 'Get a lung function sense-check if possible'] },
    ],
  },
  custom: {
    title: '30-Day Recovery Program',
    weeks: [
      { week: 1, label: 'Foundation week', tips: ['Name your habit clearly and write your why', 'Remove easy access to the habit', 'Log every urge — time, place, emotion', 'Tell one person about your goal'] },
      { week: 2, label: 'Build new routines', tips: ['Replace the habit with a healthier alternative', 'Plan high-risk times in advance', 'Celebrate small wins daily', 'Review what triggered any slips'] },
      { week: 3, label: 'Strengthen resolve', tips: ['Add exercise or mindfulness daily', 'Reconnect with your original motivation', 'Reduce isolation — connection protects recovery', 'Track mood and energy improvements'] },
      { week: 4, label: 'Lock it in', tips: ['Write your long-term rules for this habit', 'Calculate any money or time saved', 'Set a 60-day milestone', 'Plan how you\'ll handle setbacks'] },
    ],
  },
};

function getProgram(habitType) {
  return RECOVERY_PROGRAMS[habitType] || RECOVERY_PROGRAMS.custom;
}

function currentWeek(cleanDays) {
  if (cleanDays < 7) return 1;
  if (cleanDays < 14) return 2;
  if (cleanDays < 21) return 3;
  return 4;
}

window.RECOVERY_PROGRAMS = RECOVERY_PROGRAMS;
window.ProgramData = { getProgram, currentWeek };
