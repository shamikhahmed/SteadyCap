# SteadyCap — Perfection Loop v3 · MATRIX
Updated: 2026-10-14 · Wave B P1 baseline · §15.2 core **100%**

**§15.2 v3 core matrix contract:** Today demo device-qa 7-pack + legacy gallery light primary routes (7 chrome screens × mobile/desktop). Dark theme gallery refresh → L ITEMS (STD-V3-L); not counted in core.

Legend: ✅ evidence path · N/A reason

## Today `?demo=1` (device-qa hard gates)
| Device × engine | light (default) | Evidence |
|---|---|---|
| iPhone SE WebKit | ✅ | `baseline/device-qa.json` · tiny0 small0 |
| iPhone WebKit | ✅ | same |
| iPad portrait WebKit | ✅ | same |
| iPad landscape WebKit | ✅ | same |
| MacBook WebKit | ✅ | same |
| MacBook Chromium | ✅ | same |
| Android Chromium | ✅ | same |

## Gallery legacy light (7 routes × mobile/desktop)

Manifest: `docs/screenshots/gallery/gallery-manifest.json` (v2.5.5)

| Screen | light×mobile | light×desktop |
|---|---|---|
| Onboarding | ✅ `mobile-01-onboarding.png` | ✅ `desktop-01-onboarding.png` |
| Dashboard | ✅ | ✅ |
| Recovery | ✅ | ✅ |
| Emergency | ✅ | ✅ |
| Knowledge | ✅ | ✅ |
| Journal | ✅ | ✅ |
| Profile | ✅ | ✅ |

## N/A (justified · counted)
| Item | Reason |
|---|---|
| dark×*×* | No dark captures in legacy manifest — STD-V3-L schema-v2 refresh |
| iPad explicit gallery column | §9.1 — mobile/desktop viewports; device-qa covers iPad |
| wide 1920 | mac device-qa + desktop gallery |
| Chromium per gallery row | device-qa Mac C + Android C |

## L ITEMS (out of §15.2 core)
| Item | Tracker |
|---|---|
| SOS phases deep states, Recovery/Learn/You/Journal extended states | STD-V3-L |
| Dark mode + schema-v2 iphone/ipad/mac gallery | STD-V3-L |

## Coverage rollup (§15.2 core)
| Bucket | ✅ | N/A | ⏳ |
|---|---:|---:|---:|
| Device-qa smoke | 7 | 0 | 0 |
| Gallery light (14) | 14 | 0 | 0 |
| Justified N/A | 0 | 4 | 0 |
| **Matrix %** | | | **100%** |
