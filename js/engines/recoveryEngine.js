'use strict';
const RecoveryEngine = (() => {
  function hoursClean(quitTime) {
    return Math.max(0, (Date.now() - new Date(quitTime).getTime()) / 3600000);
  }

  function daysClean(quitTime) {
    return Math.floor(hoursClean(quitTime) / 24);
  }

  function recoveryPhase(hours) {
    if (hours < 72) return { name: 'Withdrawal', color: SCBrand.h_ff3b30, description: 'Your body is clearing the substance. Cravings are most intense now. This is temporary.' };
    if (hours < 336) return { name: 'Adjustment', color: SCBrand.h_ff6b35, description: 'Physical withdrawal easing. Your brain is starting to recalibrate its reward system.' };
    if (hours < 1344) return { name: 'Recalibration', color: SCBrand.h_ffd60a, description: 'Dopamine receptors recovering sensitivity. Everyday rewards becoming meaningful again.' };
    if (hours < 4320) return { name: 'Stabilisation', color: SCBrand.h_4ecdc4, description: 'Neural pathways rewiring. Cravings less frequent and less intense. Momentum building.' };
    return { name: 'Optimisation', color: SCBrand.h_06d6a0, description: 'You have done the hard work. Your recovery is self-sustaining. This is your new baseline.' };
  }

  function getTimeline(habitType) {
    return (window.RECOVERY_TIMELINES && window.RECOVERY_TIMELINES[habitType]) || [];
  }

  function currentMilestone(habitType, quitTime) {
    const h = hoursClean(quitTime);
    const tl = getTimeline(habitType);
    let last = null;
    for (const m of tl) {
      if (h >= m.hours) last = m;
    }
    return last || tl[0] || null;
  }

  function nextMilestone(habitType, quitTime) {
    const h = hoursClean(quitTime);
    const tl = getTimeline(habitType);
    return tl.find(m => m.hours > h) || null;
  }

  function progressToNext(habitType, quitTime) {
    const h = hoursClean(quitTime);
    const tl = getTimeline(habitType);
    const nextIdx = tl.findIndex(m => m.hours > h);
    if (nextIdx === -1) return 100;
    if (nextIdx === 0) return Math.min(100, (h / tl[0].hours) * 100);
    const prev = tl[nextIdx - 1];
    const next = tl[nextIdx];
    return Math.min(100, ((h - prev.hours) / (next.hours - prev.hours)) * 100);
  }

  function timeUntilNext(habitType, quitTime) {
    const next = nextMilestone(habitType, quitTime);
    if (!next) return 'Complete';
    const h = hoursClean(quitTime);
    const remaining = next.hours - h;
    return formatDuration(remaining);
  }

  function recoveryScore(habits) {
    if (!habits || habits.length === 0) return 0;
    if (window.LinkedRecoveryEngine) {
      return LinkedRecoveryEngine.linkedRecoveryScore(habits);
    }
    let total = 0;
    for (const habit of habits) {
      const h = hoursClean(habit.quitTime);
      const relapses = (habit.relapses || []).length;
      const base = Math.min(100, Math.log10(Math.max(1, h) + 1) * 38);
      const penalty = Math.min(50, relapses * 8);
      total += Math.max(0, base - penalty);
    }
    return Math.round(total / habits.length);
  }

  function formatDuration(hours) {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    if (hours < 168) return `${Math.round(hours / 24)}d`;
    if (hours < 720) return `${Math.round(hours / 168)}w`;
    return `${Math.round(hours / 720)}mo`;
  }

  function todayInsight() {
    const insights = window.DAILY_INSIGHTS || [];
    if (!insights.length) return null;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return insights[dayOfYear % insights.length];
  }

  return { hoursClean, daysClean, recoveryPhase, currentMilestone, nextMilestone, progressToNext, timeUntilNext, recoveryScore, formatDuration, todayInsight };
})();
window.RecoveryEngine = RecoveryEngine;
