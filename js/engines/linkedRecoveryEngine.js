'use strict';
const LinkedRecoveryEngine = (() => {
  const CLUSTERS = () => window.HABIT_CLUSTERS || {};
  const CROSS = () => window.HABIT_CROSS_EFFECTS || {};
  const EQUIV = () => window.SYSTEM_EQUIVALENTS || {};
  const NICOTINE_TYPES = new Set(CLUSTERS().nicotine?.types || ['smoking', 'vape', 'nicotine_pouches', 'shisha']);

  function habitType(h) {
    return h.isCustom ? 'custom' : h.type;
  }

  function hoursClean(quitTime) {
    return RecoveryEngine.hoursClean(quitTime);
  }

  function habitName(h) {
    return State.habitConfig(h.type, h.isCustom, h).name || h.type;
  }

  function otherHabits(allHabits, viewingHabit) {
    return (allHabits || []).filter(h => h.id !== viewingHabit.id);
  }

  function getBaseSystems(type, hrs) {
    return BodyEngine.getBodySystems(type, hrs);
  }

  function systemKey(sys) {
    return (sys.system || sys.label || '').toLowerCase().replace(/\s+/g, '_');
  }

  function keysMatch(a, b) {
    const ka = (a || '').toLowerCase();
    const kb = (b || '').toLowerCase();
    if (!ka || !kb) return false;
    if (ka === kb) return true;
    const setA = new Set([ka, ...(EQUIV()[ka] || [])]);
    const setB = new Set([kb, ...(EQUIV()[kb] || [])]);
    for (const x of setA) if (setB.has(x)) return true;
    return false;
  }

  function findSystemInList(systems, key) {
    return systems.find(s => keysMatch(systemKey(s), key));
  }

  function minPctAcrossHabits(types, targetKey, allHabits) {
    const set = new Set(types);
    let min = 100;
    let found = false;
    for (const h of allHabits || []) {
      if (!set.has(habitType(h))) continue;
      const sys = getBaseSystems(habitType(h), hoursClean(h.quitTime));
      const match = sys.find(s => keysMatch(systemKey(s), targetKey));
      if (match) {
        found = true;
        min = Math.min(min, match.pct);
      }
    }
    return found ? min : null;
  }

  function minHoursInTypes(types, allHabits) {
    const set = new Set(types);
    const relevant = (allHabits || []).filter(h => set.has(habitType(h)));
    if (!relevant.length) return null;
    return Math.min(...relevant.map(h => hoursClean(h.quitTime)));
  }

  function minNicotineHours(allHabits) {
    return minHoursInTypes([...NICOTINE_TYPES], allHabits);
  }

  function applyClusterCaps(type, key, pct, hrs, allHabits) {
    let result = pct;
    let capped = false;
    let capReason = null;

    for (const cluster of Object.values(CLUSTERS())) {
      if (!cluster.types?.includes(type)) continue;
      if (!cluster.sharedSystems?.some(s => keysMatch(key, s))) continue;

      const minPct = minPctAcrossHabits(cluster.types, key, allHabits);
      const minHrs = minHoursInTypes(cluster.types, allHabits);
      if (minPct == null || minHrs == null) continue;

      if (minHrs < hrs - 0.5 && minPct < result) {
        result = Math.round(minPct);
        capped = true;
        capReason = cluster.message;
      }
    }
    return { pct: result, capped, capReason };
  }

  function applyPairwiseCaps(type, key, pct, hrs, viewingHabit, allHabits) {
    let result = pct;
    let capped = false;
    let capReason = null;
    const cross = CROSS()[type] || {};

    for (const other of otherHabits(allHabits, viewingHabit)) {
      const oType = habitType(other);
      const effect = cross[oType];
      if (!effect) continue;

      const oHrs = hoursClean(other.quitTime);
      let weight = null;
      for (const [sys, w] of Object.entries(effect.systems || {})) {
        if (keysMatch(key, sys)) { weight = w; break; }
      }
      if (weight == null) continue;

      const stillActive = oHrs < hrs - 1 || (NICOTINE_TYPES.has(oType) && oHrs <= hrs + 48);
      if (!stillActive) continue;

      const otherSys = getBaseSystems(oType, oHrs);
      const match = findSystemInList(otherSys, key);
      const otherPct = match ? match.pct : 0;
      const blended = Math.round(result * (1 - weight) + Math.min(result, otherPct) * weight);

      if (blended < result) {
        result = blended;
        capped = true;
        capReason = effect.note || `${habitName(other)} still limits ${key} recovery.`;
      }
    }
    return { pct: result, capped, capReason };
  }

  function getLinkedBodySystems(viewingHabit, allHabits) {
    const type = habitType(viewingHabit);
    const hrs = hoursClean(viewingHabit.quitTime);
    const base = getBaseSystems(type, hrs);

    return base.map(sys => {
      const key = systemKey(sys);
      let pct = sys.pct;
      let capped = false;
      let capReason = null;

      const cluster = applyClusterCaps(type, key, pct, hrs, allHabits);
      pct = cluster.pct;
      capped = cluster.capped;
      capReason = cluster.capReason;

      const pair = applyPairwiseCaps(type, key, pct, hrs, viewingHabit, allHabits);
      if (pair.pct < pct) {
        pct = pair.pct;
        capped = true;
        capReason = pair.capReason || capReason;
      } else if (pair.capped && !capped) {
        capped = true;
        capReason = pair.capReason;
      }

      return { ...sys, pct, capped, capReason };
    });
  }

  function getGlobalBodyMap(allHabits) {
    const map = new Map();
    for (const h of allHabits || []) {
      const systems = getLinkedBodySystems(h, allHabits);
      for (const s of systems) {
        const key = systemKey(s);
        const prev = map.get(key);
        if (!prev || s.pct < prev.pct) {
          map.set(key, {
            ...s,
            limitedBy: s.capped ? habitName(h) : prev?.limitedBy,
          });
        }
      }
    }
    return [...map.values()].sort((a, b) => a.pct - b.pct);
  }

  function getBottlenecks(allHabits) {
    if (!allHabits?.length || allHabits.length < 2) return [];
    const scores = allHabits.map(h => {
      const sys = getLinkedBodySystems(h, allHabits);
      const avg = sys.length ? sys.reduce((s, x) => s + x.pct, 0) / sys.length : 0;
      const capped = sys.filter(x => x.capped).length;
      return { habit: h, name: habitName(h), avg: Math.round(avg), capped, hrs: hoursClean(h.quitTime) };
    });
    return scores.sort((a, b) => a.hrs - b.hrs).slice(0, 3);
  }

  function getLinkedDopamine(viewingHabit, allHabits) {
    const type = habitType(viewingHabit);
    const hrs = hoursClean(viewingHabit.quitTime);
    let effectiveHrs = hrs;
    const notes = [];

    const beh = CLUSTERS().behavioural_dopamine;
    if (beh?.types?.includes(type)) {
      const minBeh = minHoursInTypes(beh.types, allHabits);
      if (minBeh != null && minBeh < effectiveHrs - 1) {
        effectiveHrs = minBeh;
        const slowest = (allHabits || [])
          .filter(h => beh.types.includes(habitType(h)))
          .sort((a, b) => hoursClean(a.quitTime) - hoursClean(b.quitTime))[0];
        if (slowest && slowest.id !== viewingHabit.id) {
          notes.push(`Dopamine recovery follows ${habitName(slowest)} (${RecoveryEngine.formatDuration(minBeh)} clean) — reward system heals as one.`);
        }
      }
    }

    if (NICOTINE_TYPES.has(type)) {
      const nicMin = minNicotineHours(allHabits);
      if (nicMin != null && nicMin < effectiveHrs - 1) {
        effectiveHrs = Math.min(effectiveHrs, nicMin);
        notes.push('Nicotine from another source still occupies receptors — dopamine sensitivity recovers with your shortest nicotine-free time.');
      }
    }

    const stage = DopamineEngine.getStage(type, effectiveHrs);
    const progress = DopamineEngine.progressInStage(type, effectiveHrs);
    const soloStage = DopamineEngine.getStage(type, hrs);
    const delayed = effectiveHrs < hrs - 1;

    return {
      stage,
      progress,
      effectiveHrs,
      soloStage,
      delayed,
      note: notes[0] || (delayed ? `${habitName(viewingHabit)}: ${RecoveryEngine.formatDuration(hrs)} so far, but dopamine stage reflects linked recovery at ${RecoveryEngine.formatDuration(effectiveHrs)}.` : null),
    };
  }

  function getInterferences(viewingHabit, allHabits) {
    const type = habitType(viewingHabit);
    const hrs = hoursClean(viewingHabit.quitTime);
    const others = otherHabits(allHabits, viewingHabit);
    const cards = [];
    const seen = new Set();

    function addCard(card) {
      const id = card.title + card.body;
      if (seen.has(id)) return;
      seen.add(id);
      cards.push(card);
    }

    for (const cluster of Object.values(CLUSTERS())) {
      if (!cluster.types?.includes(type)) continue;
      const minHrs = minHoursInTypes(cluster.types, allHabits);
      if (minHrs == null || minHrs >= hrs - 1) continue;
      const limiting = others
        .filter(h => cluster.types.includes(habitType(h)))
        .filter(h => hoursClean(h.quitTime) <= minHrs + 0.5)
        .map(h => habitName(h));
      if (limiting.length) {
        addCard({
          severity: minHrs < 168 ? 'high' : 'medium',
          icon: cluster.label.includes('Nicotine') ? '⚠️' : '🔗',
          title: `${cluster.label} — linked recovery`,
          body: `${cluster.message} Limiting: ${limiting.join(', ')} (${RecoveryEngine.formatDuration(minHrs)}).`,
        });
      }
    }

    for (const other of others) {
      const oType = habitType(other);
      const effect = CROSS()[type]?.[oType];
      if (!effect) continue;
      const oHrs = hoursClean(other.quitTime);
      if (oHrs >= hrs) continue;
      const icon = (window.HABIT_TYPE_ICONS || {})[oType] || '⚡';
      addCard({
        severity: oHrs < 168 ? 'high' : 'medium',
        icon,
        title: `${habitName(other)} affects this recovery`,
        body: effect.note,
      });
    }

    const systems = getLinkedBodySystems(viewingHabit, allHabits);
    const capped = systems.filter(s => s.capped).slice(0, 2);
    for (const s of capped) {
      if (s.capReason && !cards.some(c => c.body === s.capReason)) {
        addCard({
          severity: 'medium',
          icon: s.icon,
          title: `${s.label} — partial recovery`,
          body: s.capReason,
        });
      }
    }

    return cards.slice(0, 6);
  }

  function getSmartInsights(allHabits) {
    if (!allHabits?.length) return [];
    const insights = [];

    if (allHabits.length >= 2) {
      const bottlenecks = getBottlenecks(allHabits);
      if (bottlenecks[0] && hoursClean(bottlenecks[0].habit.quitTime) < 168) {
        insights.push({
          icon: '🎯',
          title: 'Recovery bottleneck',
          body: `${bottlenecks[0].name} is your shortest stretch so far — whole-body healing won't fully accelerate until it catches up.`,
          priority: 1,
        });
      }

      const nicMin = minNicotineHours(allHabits);
      const nicHabits = allHabits.filter(h => NICOTINE_TYPES.has(habitType(h)));
      if (nicHabits.length >= 2 && nicMin != null) {
        const spread = Math.max(...nicHabits.map(h => hoursClean(h.quitTime))) - nicMin;
        if (spread > 168) {
          insights.push({
            icon: '💨',
            title: 'Split nicotine recovery',
            body: `You're ${RecoveryEngine.formatDuration(spread)} ahead on one nicotine habit but only ${RecoveryEngine.formatDuration(nicMin)} fully nicotine-free. Heart and lungs follow the shorter time.`,
            priority: 2,
          });
        }
      }

      const sleepCluster = CLUSTERS().sleep;
      if (sleepCluster) {
        const sleepHabits = allHabits.filter(h => sleepCluster.types.includes(habitType(h)));
        if (sleepHabits.length >= 2) {
          const minSleep = minHoursInTypes(sleepCluster.types, allHabits);
          if (minSleep != null && minSleep < 336) {
            insights.push({
              icon: '🌙',
              title: 'Sleep is linked',
              body: 'Alcohol, caffeine, screens, and compulsive habits all disrupt the same sleep cycles — improving one helps all.',
              priority: 3,
            });
          }
        }
      }

      const score = linkedRecoveryScore(allHabits);
      const soloAvg = allHabits.reduce((s, h) => {
        const t = habitType(h);
        return s + BodyEngine.overallBodyScore(t, hoursClean(h.quitTime));
      }, 0) / allHabits.length;
      if (soloAvg - score > 8) {
        insights.push({
          icon: '🧠',
          title: 'Habits are interacting',
          body: `Linked recovery score is ${score}% vs ${Math.round(soloAvg)}% if counted separately — your body is healing as one system.`,
          priority: 2,
        });
      }
    }

    const comp = CLUSTERS().compulsive_screen;
    if (comp) {
      const active = allHabits.filter(h => comp.types.includes(habitType(h)) && hoursClean(h.quitTime) < 720);
      if (active.length >= 2) {
        insights.push({
          icon: '📱',
          title: 'Shared attention circuits',
          body: 'Gaming, social media, and porn rewire the same focus pathways — progress on one accelerates recovery on the others.',
          priority: 4,
        });
      }
    }

    return insights.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }

  const SYSTEM_ALIASES = {
    cardiovascular: ['heart', 'cardiovascular', 'blood_pressure', 'co_levels'],
    lungs: ['lungs', 'airways'],
    sensory: ['taste', 'smell', 'sensory', 'oral'],
    neurological: ['dopamine', 'brain', 'focus', 'motivation', 'attention'],
    circulation: ['circulation'],
    hair: ['hair'],
    overall: [],
  };

  function milestoneMatchesSystem(milestoneSystem, bodySystem) {
    const key = (bodySystem.system || '').toLowerCase();
    const lbl = (bodySystem.label || '').toLowerCase();
    const ms = (milestoneSystem || '').toLowerCase();
    if (!ms || ms === 'overall' || ms === 'metabolic') return false;
    const aliases = SYSTEM_ALIASES[ms] || EQUIV()[ms] || [ms];
    return aliases.some(a => key.includes(a) || lbl.includes(a) || ms.includes(key));
  }

  function milestoneStatus(viewingHabit, allHabits, milestone, hrs) {
    if (hrs < milestone.hours) return { reached: false, partial: false, blocked: false };
    const systems = getLinkedBodySystems(viewingHabit, allHabits);
    const related = systems.find(s => milestoneMatchesSystem(milestone.system, s));
    if (related?.capped) {
      return {
        reached: true,
        partial: true,
        blocked: false,
        note: `Partial — ${related.capReason || 'another habit limits full healing'}`,
      };
    }
    return { reached: true, partial: false, blocked: false };
  }

  function linkedRecoveryScore(allHabits) {
    if (!allHabits?.length) return 0;
    let total = 0;
    for (const h of allHabits) {
      const type = habitType(h);
      const hrs = hoursClean(h.quitTime);
      const systems = getLinkedBodySystems(h, allHabits);
      const avg = systems.length
        ? systems.reduce((s, x) => s + x.pct, 0) / systems.length
        : BodyEngine.overallBodyScore(type, hrs);
      const relapses = (h.relapses || []).length;
      const penalty = Math.min(40, relapses * 8);
      total += Math.max(0, avg - penalty);
    }
    return Math.round(total / allHabits.length);
  }

  function wholeBodySummary(allHabits) {
    if (!allHabits?.length) return null;
    const global = getGlobalBodyMap(allHabits);
    const weakest = global.slice(0, 3);
    return {
      habitCount: allHabits.length,
      labels: allHabits.map(h => habitName(h)),
      nicotineFreeHours: minNicotineHours(allHabits),
      sleepRecoveryHours: minHoursInTypes(CLUSTERS().sleep?.types || [], allHabits),
      score: linkedRecoveryScore(allHabits),
      weakestSystems: weakest,
      insights: getSmartInsights(allHabits),
    };
  }

  return {
    getLinkedBodySystems,
    getGlobalBodyMap,
    getBottlenecks,
    getLinkedDopamine,
    getInterferences,
    getSmartInsights,
    milestoneStatus,
    linkedRecoveryScore,
    wholeBodySummary,
    minNicotineHours,
  };
})();
window.LinkedRecoveryEngine = LinkedRecoveryEngine;
