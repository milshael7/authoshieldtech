const { resetDailyCounters, fundAIIfNeeded, sweepExcess, resetPercentToFloor } = require('./wallet');
const { isSabbathNow } = require('../lib/sabbath');

function randBetween(min, max) { return Math.random() * (max - min) + min; }
function simulatePnL(notional) { return notional * randBetween(-0.02, 0.02); }

function canTrade(state, now = new Date()) {
  if (isSabbathNow(now)) return { ok: false, reason: 'Sabbath pause' };
  resetDailyCounters(state, now);
  const maxTrades = parseInt(process.env.AI_TRADES_PER_DAY || '3', 10);
  if (state.aiWallet.tradesToday >= maxTrades) return { ok: false, reason: 'Daily limit reached' };
  return { ok: true };
}

function applyLossRules(state, pnl) {
  if (pnl < 0) state.aiWallet.consecutiveLosses += 1;
  else state.aiWallet.consecutiveLosses = 0;
  if (state.aiWallet.consecutiveLosses >= 2) resetPercentToFloor(state);
}

function executeAITrade(state, { confidence = false } = {}) {
  const now = new Date();
  const gate = canTrade(state, now);
  if (!gate.ok) return { ok: false, ...gate };

  const funded = fundAIIfNeeded(state);
  const percent = state.aiWallet.activePercent / 100;
  const notional = Math.max(0, state.aiWallet.balance * percent);
  if (notional <= 0) return { ok: false, reason: 'No funds to trade' };

  const pnl = simulatePnL(notional);
  state.aiWallet.balance += pnl;
  state.aiWallet.tradesToday += 1;

  applyLossRules(state, pnl);
  const swept = sweepExcess(state);

  return { ok: true, confidence, timestamp: Date.now(), notional, pnl, funded, swept,
    aiWallet: state.aiWallet, storehouse: state.storehouse };
}

module.exports = { executeAITrade };
