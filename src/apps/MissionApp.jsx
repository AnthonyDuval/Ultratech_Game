import { memo, useMemo } from 'react';
import {
  MISSIONS,
  getActiveDiscoveredMissions,
  getMissionProgress,
  getCurrentStep,
  getCurrentObjective,
  getSuggestedCommand,
  getNextStepText,
  getStepTarget,
  getStepProtocol,
  getMissionActivityStatus,
  getMissionActivityLabel,
  isGuidedMission,
} from '../data/missions.js';
import { hasAnonScanHelp, shouldRevealScanCommand, isGhostSignalDone } from '../game/missionGuards.js';

const MissionCard = memo(function MissionCard({
  mission,
  narrativeFlags,
  completedMissions,
  readMails,
  unlockedMails,
  openApps,
}) {
  const progress = getMissionProgress(mission, narrativeFlags);
  const step = getCurrentStep(mission, narrativeFlags);
  const stepIndex = step
    ? mission.steps.findIndex((s) => s.flag === step.flag) + 1
    : mission.steps.filter((s) => narrativeFlags[s.flag]).length;
  const stepTotal = mission.steps.length;
  const activity = getMissionActivityStatus(mission, narrativeFlags, completedMissions);
  const activityLabel = getMissionActivityLabel(activity);
  const guided = isGuidedMission(mission);
  const nextStep = getNextStepText(mission, narrativeFlags);
  const currentObjective = getCurrentObjective(mission, narrativeFlags);
  const suggested = getSuggestedCommand(mission, narrativeFlags);
  const target = getStepTarget(mission, narrativeFlags);
  const protocol = getStepProtocol(mission, narrativeFlags);
  const statusClass = activity === 'pending' ? 'ops-status--pending' : 'ops-status--active';

  const isM1ScanPending = mission.id === 'ghost-signal'
    && step?.flag === 'scan_0x7f'
    && !narrativeFlags.scan_0x7f;

  const stateSlice = { readMails, unlockedMails, narrativeFlags };
  const showCommand = isM1ScanPending
    ? shouldRevealScanCommand(stateSlice, openApps)
    : Boolean(suggested);

  const displayObjective = isM1ScanPending ? 'Analyser la cible 0x7f' : currentObjective;
  const displayHint = isM1ScanPending && !hasAnonScanHelp(stateSlice)
    ? 'Un contact anonyme pourrait vous aider si vous hésitez.'
    : step?.hint;

  return (
    <article className={`ops-card ops-card--active ${guided ? 'ops-card--guided' : ''}`}>
      <div className="ops-card-top">
        <span className={`ops-status ${statusClass}`}>{activityLabel}</span>
        <span className="ops-step-count">Étape {stepIndex}/{stepTotal}</span>
        <span className="ops-pct">{Math.round(progress * 100)} %</span>
      </div>

      <div className="ops-card-header">
        <span className="pulse-dot" />
        <strong>{mission.title}</strong>
      </div>

      <div className="mission-progress-bar">
        <div className="mission-progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      {guided ? (
        <div className="ops-journal">
          {nextStep && (
            <div className="ops-journal-block">
              <span className="ops-journal-label">Étape suivante</span>
              <p className="ops-journal-value">{isM1ScanPending ? 'Ouvrir le Terminal' : nextStep}</p>
            </div>
          )}
          <div className="ops-journal-block">
            <span className="ops-journal-label">Objectif</span>
            <p className="ops-journal-value">{displayObjective}</p>
          </div>
          {target && (
            <div className="ops-journal-block ops-journal-block--target">
              <span className="ops-journal-label">Cible</span>
              <p className="ops-journal-value ops-journal-mono">{target}</p>
            </div>
          )}
          {protocol && (
            <div className="ops-journal-block ops-journal-block--protocol">
              <span className="ops-journal-label">Protocole suggéré</span>
              <p className="ops-journal-value ops-journal-mono">{protocol}</p>
            </div>
          )}
          {displayHint && (
            <div className="ops-journal-block ops-journal-block--hint">
              <span className="ops-journal-label">Indice</span>
              <p className="ops-journal-value">{displayHint}</p>
            </div>
          )}
          {showCommand && suggested && (
            <div className="ops-journal-block ops-journal-block--cmd">
              <span className="ops-journal-label">Commande probable</span>
              <code className="ops-journal-cmd">{suggested}</code>
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="ops-current-objective">
            <strong>Objectif : </strong>{currentObjective}
          </p>
          {step?.hint && (
            <p className="ops-hint">
              <strong>Indice : </strong>{step.hint}
            </p>
          )}
        </>
      )}
    </article>
  );
});

export default function MissionApp({ state, openApps = [] }) {
  const {
    discoveredMissions,
    completedMissions,
    narrativeFlags,
    discoveredClues,
    discoveredNodes,
    readMails,
    unlockedMails,
  } = state;

  const active = useMemo(
    () => getActiveDiscoveredMissions(discoveredMissions, completedMissions),
    [discoveredMissions, completedMissions]
  );

  const completed = useMemo(
    () => MISSIONS.filter((m) => completedMissions.includes(m.id)),
    [completedMissions]
  );

  const hasContent = active.length > 0 || completed.length > 0
    || discoveredClues.length > 0 || discoveredNodes.length > 0;

  return (
    <div className="mission-app">
      <header className="mission-header">
        <h2>Opérations</h2>
        <p>Journal de quête — croisez les briefings et le terminal.</p>
      </header>

      <section className="ops-section">
        <h3 className="ops-section-title">
          <span className="ops-section-icon">◎</span>
          Objectifs actifs
        </h3>

        {active.length === 0 ? (
          <p className="ops-empty">
            {isGhostSignalDone(completedMissions)
              ? 'Consultez vos nouveaux messages dans Mails.'
              : 'Aucun objectif actif. Consultez vos Mails pour de nouveaux briefings.'}
          </p>
        ) : (
          active.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              narrativeFlags={narrativeFlags}
              completedMissions={completedMissions}
              readMails={readMails}
              unlockedMails={unlockedMails}
              openApps={openApps}
            />
          ))
        )}
      </section>

      {(discoveredClues.length > 0 || discoveredNodes.length > 0) && (
        <section className="ops-section">
          <h3 className="ops-section-title">
            <span className="ops-section-icon">◈</span>
            Indices découverts
          </h3>
          <div className="ops-clues">
            {discoveredClues.map((clue, i) => (
              <div key={`clue-${i}`} className="ops-clue-item">
                <span className="ops-clue-tag">INDICE</span>
                {clue}
              </div>
            ))}
            {discoveredNodes.map((node) => (
              <div key={`node-${node}`} className="ops-clue-item ops-clue-item--node">
                <span className="ops-clue-tag">NŒUD</span>
                {node}
              </div>
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="ops-section">
          <h3 className="ops-section-title">
            <span className="ops-section-icon">✓</span>
            Missions terminées
          </h3>
          <ul className="ops-completed-list">
            {completed.map((m) => (
              <li key={m.id} className="ops-completed-item">
                <span className="badge badge-done">Terminé</span>
                <div>
                  <strong>{m.title}</strong>
                  <span className="ops-completed-summary">{m.summary}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!hasContent && (
        <div className="mission-empty-state">
          <span className="mission-empty-icon">◎</span>
          <p>Bienvenue, opérateur.</p>
          <p className="mission-empty-hint">
            1. Ouvrez Mails et lisez le briefing de bienvenue<br />
            2. Lisez le signal fantôme — notez cible et protocole<br />
            3. Attendez l&apos;aide anonyme ou composez scan &lt;cible&gt;
          </p>
        </div>
      )}
    </div>
  );
}
