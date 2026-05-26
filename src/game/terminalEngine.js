/**
 * Moteur terminal — commandes interactives, progression missions automatique
 */

import { delay } from '../utils/time.js';
import { getHelpText } from '../data/terminalCommands.js';
import {
  resolveScanTarget,
  resolveConnectTarget,
  resolveDecryptTarget,
} from '../data/terminalTargets.js';
import { recordTerminalProgress } from './missionEngine.js';
import { getObjectiveContext, getHintContext, APPS_HELP } from './terminalHints.js';
import { suggestCommandCorrection, suggestTargetCorrection } from './commandSuggestions.js';
import { getProgressNotification } from './objectiveState.js';
import { markProgress, recordTerminalCommand } from './stuckTimer.js';

async function typeLines(addLine, lines, type = 'info', ms = 100) {
  for (const line of lines) {
    await delay(ms + Math.random() * 60);
    addLine(line, type);
  }
}

function applyFlag(flag, nodeId, state, dispatch) {
  if (state.narrativeFlags?.[flag]) return { applied: false };
  recordTerminalProgress(flag, nodeId, state, dispatch);
  markProgress(state, dispatch);
  return {
    applied: true,
    notification: getProgressNotification(flag, state),
  };
}

function isEarlyGame(state) {
  return !(state.completedMissions ?? []).includes('ghost-signal');
}

function suggestCorrection(addLine, suggestion) {
  if (suggestion) {
    addLine(`Peut-être vouliez-vous taper : ${suggestion}`, 'warn');
  }
}

export async function executeTerminalCommand(cmd, state, dispatch, addLine) {
  const trimmed = cmd.trim();
  const parts = trimmed.split(/\s+/);
  const command = parts[0]?.toLowerCase() ?? '';
  const arg = parts.slice(1).join(' ').trim();

  recordTerminalCommand(state, dispatch, trimmed);

  switch (command) {
    case 'help':
      if (!state.narrativeFlags?.used_help) {
        dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'used_help', value: true });
      }
      addLine(getHelpText(state, arg || undefined), 'info');
      break;

    case 'objectif': {
      const ctx = getObjectiveContext(state);
      addLine(`[${ctx.title}]`, 'system');
      ctx.lines.forEach((line) => addLine(`  ${line}`, 'info'));
      break;
    }

    case 'hint':
    case 'indice': {
      const ctx = getHintContext(state);
      addLine(`[${ctx.title}]`, 'system');
      ctx.lines.forEach((line) => addLine(`  ${line}`, 'warn'));
      break;
    }

    case 'apps':
      APPS_HELP.forEach((line) => addLine(line, 'info'));
      break;

    case 'clear':
      return { action: 'clear' };

    case 'status':
      await delay(180);
      addLine(`Opérateur : ${state.username}`, 'info');
      addLine(`BitTek : ${state.bittek} ₮ | Réputation : ${state.reputation}`, 'info');
      addLine(`Corruption : ${state.corruption}% | Intégrité : ${100 - state.corruption}%`, 'info');
      addLine(`Surveillance UltraTech : ${state.suspicionUltraTech ?? 0}%`, state.suspicionUltraTech > 30 ? 'warn' : 'info');
      if (state.discoveredNodes?.length) {
        addLine(`Nœuds repérés : ${state.discoveredNodes.join(', ')}`, 'info');
      }
      break;

    case 'scan':
      addLine('[SCAN] Initialisation...', 'info');
      await delay(350);
      if (!arg) {
        addLine('Usage : scan <cible>. Exemple : scan 0x7f', 'warn');
        break;
      }
      {
        const resolved = resolveScanTarget(arg);
        if (!resolved) {
          addLine(`[SCAN] Cible "${arg}" — aucune correspondance`, 'error');
          suggestCorrection(addLine, suggestTargetCorrection('scan', arg, state));
          addLine('Tapez objectif ou hint pour un rappel.', 'info');
          break;
        }
        const { cfg } = resolved;
        if (cfg.requiresFlag && !state.narrativeFlags?.[cfg.requiresFlag]) {
          addLine('[SCAN] Données insuffisantes pour cette cible.', 'warn');
          break;
        }
        await typeLines(addLine, cfg.responses, 'warn');
        const result = applyFlag(cfg.flag, cfg.nodeId, state, dispatch);
        dispatch({ type: 'ADD_SUSPICION', amount: 3 });
        if (result.notification) {
          addLine(`[SYS] ${result.notification.title} — ${result.notification.message}`, 'system');
          return { action: 'none', notification: result.notification };
        }
      }
      break;

    case 'connect':
      if (!arg) {
        addLine('Usage : connect <cible>. Exemple : connect 0x7f', 'warn');
        break;
      }
      {
        const resolved = resolveConnectTarget(arg);
        if (!resolved) {
          addLine(`[CONNECT] Cible "${arg}" — refusée`, 'error');
          suggestCorrection(addLine, suggestTargetCorrection('connect', arg, state));
          break;
        }
        const { cfg } = resolved;
        if (cfg.requiresFlag && !state.narrativeFlags?.[cfg.requiresFlag]) {
          addLine('[CONNECT] Scan préalable requis. Effectuez d\'abord un scan.', 'warn');
          if (isEarlyGame(state)) {
            addLine('Exemple : scan 0x7f puis connect 0x7f', 'info');
          }
          break;
        }
        await typeLines(addLine, cfg.responses, 'system');
        const result = applyFlag(cfg.flag, cfg.nodeId, state, dispatch);
        dispatch({ type: 'ADD_SUSPICION', amount: 5 });
        if (result.notification) {
          addLine(`[SYS] ${result.notification.title} — ${result.notification.message}`, 'system');
          if (result.notification.rewards) {
            addLine(
              `[SYS] Récompenses : +${result.notification.rewards.bittek} ₮ · +${result.notification.rewards.reputation} réputation`,
              'system'
            );
          }
          return { action: 'none', notification: result.notification };
        }
      }
      break;

    case 'decrypt':
      if (!arg) {
        addLine('Usage : decrypt <identifiant>. Exemple : decrypt archive_2077', 'warn');
        break;
      }
      {
        const resolved = resolveDecryptTarget(arg);
        if (!resolved) {
          await delay(300);
          addLine(`[DECRYPT] Protocole incompatible — "${arg}"`, 'error');
          break;
        }
        addLine('[DECRYPT] Analyse du protocole...', 'info');
        await delay(450);
        await typeLines(addLine, resolved.cfg.responses, 'ghost', 120);
        applyFlag(resolved.cfg.flag, resolved.cfg.nodeId, state, dispatch);
        dispatch({ type: 'ADD_SUSPICION', amount: 8 });
      }
      break;

    case 'trace':
      addLine('[TRACE] Analyse des empreintes réseau...', 'info');
      await delay(400);
      addLine(`[TRACE] Surveillance UltraTech : ${state.suspicionUltraTech ?? 0}%`, 'warn');
      if ((state.suspicionUltraTech ?? 0) > 15 && !state.narrativeFlags?.trace_cleared) {
        addLine('[TRACE] Effacement partiel des logs...', 'info');
        await delay(350);
        addLine('[TRACE] Empreinte atténuée.', 'system');
        applyFlag('trace_cleared', null, state, dispatch);
        dispatch({ type: 'ADD_SUSPICION', amount: -15 });
      } else if (state.narrativeFlags?.trace_cleared) {
        addLine('[TRACE] Traces déjà atténuées.', 'info');
      } else {
        addLine('[TRACE] Niveau de surveillance nominal.', 'info');
      }
      break;

    case 'logs': {
      const logs = state.terminalLogs ?? [];
      if (!logs.length) addLine('[LOGS] Aucun log enregistré.', 'info');
      else {
        addLine(`[LOGS] ${Math.min(8, logs.length)} dernières entrées :`, 'info');
        logs.slice(-8).forEach((l) => addLine(`  ${l}`, 'info'));
      }
      break;
    }

    case '':
      break;

    default: {
      addLine('Commande non reconnue. Le protocole UltraTech recommande : help, objectif ou hint.', 'error');
      const correction = suggestCommandCorrection(trimmed);
      suggestCorrection(addLine, correction);
    }
  }

  return { action: 'none' };
}
