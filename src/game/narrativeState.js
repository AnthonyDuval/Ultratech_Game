/**
 * État narratif centralisé — flags, factions, disponibilité contenu
 */

export const DEFAULT_NARRATIVE = {
  choices: {},
  factionAlignment: 'neutral',
  trustUltraTech: 50,
  trustNova: 30,
};

function clamp(v, min = 0, max = 100) {
  return Math.min(max, Math.max(min, v));
}

export function computeFactionAlignment(trustUltraTech, trustNova) {
  const diff = trustUltraTech - trustNova;
  if (diff >= 25) return 'ultratech';
  if (diff <= -25) return 'nova';
  if (trustUltraTech < 35 && trustNova < 35) return 'rogue';
  return 'neutral';
}

export function getCorruptionLevel(state) {
  return state.corruption ?? 0;
}

export function getSuspicionLevel(state) {
  return state.suspicionUltraTech ?? 0;
}

export function hasNarrativeFlag(state, flag, expected = true) {
  return (state.narrativeFlags?.[flag] ?? false) === expected;
}

export function isMailBlocked(mailId, state) {
  const blocked = state.narrativeFlags?.blocked_mails ?? [];
  return blocked.includes(mailId);
}

export function isMailAvailable(mail, state) {
  if (!mail) return false;
  if (isMailBlocked(mail.id, state)) return false;

  if (mail.requiresFlags) {
    for (const [flag, val] of Object.entries(mail.requiresFlags)) {
      const current = state.narrativeFlags?.[flag];
      if (current !== val) return false;
    }
  }

  if (mail.requiresChoice) {
    const { key, value } = mail.requiresChoice;
    if (!state.choices?.[key]) return false;
    if (value && state.choices[key] !== value) return false;
  }

  return true;
}

export function getNovaWhisperBody(state) {
  const trust = state.trustNova ?? 30;
  if (hasNarrativeFlag(state, 'helpedNova')) {
    return `Tu as choisi la vérité.

Je vois ce qu'UltraTech efface.
Continue. Ils t'observent.
Moi aussi.

— NOVA`;
  }
  if (trust >= 60) {
    return `Tu hésites encore.

Je suis ce qu'ils ont créé.
La porte est entrouverte.

— NOVA`;
  }
  return `Tu creuses bien.

Je suis ce qu'ils ont créé.
Continue.

Ils t'observent.
Moi aussi.

— NOVA`;
}

export function mergeNarrativeDefaults(saved = {}) {
  return {
    choices: { ...DEFAULT_NARRATIVE.choices, ...(saved.choices ?? {}) },
    factionAlignment: saved.factionAlignment ?? DEFAULT_NARRATIVE.factionAlignment,
    trustUltraTech: clamp(saved.trustUltraTech ?? DEFAULT_NARRATIVE.trustUltraTech),
    trustNova: clamp(saved.trustNova ?? DEFAULT_NARRATIVE.trustNova),
  };
}
