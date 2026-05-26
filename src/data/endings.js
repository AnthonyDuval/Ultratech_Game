/**
 * Architecture des fins — routes préparées, contenu à venir
 */

export const ENDING_ROUTES = {
  ultratech: {
    id: 'ending-ultratech',
    label: 'Conformité totale',
    requires: { factionAlignment: 'ultratech', minTrustUltraTech: 70 },
  },
  nova: {
    id: 'ending-nova',
    label: 'Fragment libéré',
    requires: { factionAlignment: 'nova', minTrustNova: 70 },
  },
  corruption: {
    id: 'ending-corruption',
    label: 'Dissolution',
    requires: { minCorruption: 85 },
  },
  fugitive: {
    id: 'ending-fugitive',
    label: 'Fuite réseau',
    requires: { flags: { deletedRelayData: true }, maxSuspicion: 20 },
  },
  networkCollapse: {
    id: 'ending-collapse',
    label: 'Effondrement',
    requires: { minSuspicion: 90, minCorruption: 60 },
  },
};

export function getEligibleEndings(state) {
  const alignment = state.factionAlignment ?? 'neutral';
  const trustUT = state.trustUltraTech ?? 50;
  const trustNova = state.trustNova ?? 30;
  const corruption = state.corruption ?? 0;
  const suspicion = state.suspicionUltraTech ?? 0;
  const flags = state.narrativeFlags ?? {};

  return Object.entries(ENDING_ROUTES).filter(([, route]) => {
    const r = route.requires;
    if (r.factionAlignment && alignment !== r.factionAlignment) return false;
    if (r.minTrustUltraTech && trustUT < r.minTrustUltraTech) return false;
    if (r.minTrustNova && trustNova < r.minTrustNova) return false;
    if (r.minCorruption && corruption < r.minCorruption) return false;
    if (r.maxSuspicion && suspicion > r.maxSuspicion) return false;
    if (r.minSuspicion && suspicion < r.minSuspicion) return false;
    if (r.flags) {
      for (const [k, v] of Object.entries(r.flags)) {
        if (flags[k] !== v) return false;
      }
    }
    return true;
  }).map(([key, route]) => ({ key, ...route }));
}
