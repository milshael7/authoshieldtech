function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function parsePercents() {
  const raw = process.env.AI_ALLOWED_PERCENTS || '3,5,10,15,20,25,30,35,40,45,50';
  return raw.split(',').map(x => parseInt(x.trim(), 10)).filter(Boolean);
}
function defaultState() {
  return {
    aiWallet: {
      balance: 1000,
      maxCap: parseFloat(process.env.AI_WALLET_MAX || '50000'),
      allowedPercents: parsePercents(),
      activePercent: parseFloat(process.env.AI_START_PERCENT || '30'),
      minBalance: parseFloat(process.env.AI_WALLET_MIN || '500'),
      targetBalance: parseFloat(process.env.AI_WALLET_TARGET || '1000'),
      consecutiveLosses: 0,
      tradesToday: 0,
      lastTradeDay: null
    },
    storehouse: {
      balance: 50000,
      minimumReserve: parseFloat(process.env.STOREHOUSE_MIN_RESERVE || '10000')
    }
  };
}
function resetDailyCounters(state, now = new Date()) {
  const day = now.toISOString().slice(0,10);
  if (state.aiWallet.lastTradeDay !== day) {
    state.aiWallet.lastTradeDay = day;
    state.aiWallet.tradesToday = 0;
    state.aiWallet.consecutiveLosses = 0;
  }
}
function fundAIIfNeeded(state) {
  const ai = state.aiWallet;
  const sh = state.storehouse;
  if (ai.balance <= ai.minBalance) {
    const needed = ai.targetBalance - ai.balance;
    const available = sh.balance - sh.minimumReserve;
    if (available > 0) {
      const amount = clamp(needed, 0, available);
      ai.balance += amount;
      sh.balance -= amount;
      return { funded: true, amount };
    }
  }
  return { funded: false, amount: 0 };
}
function sweepExcess(state) {
  const ai = state.aiWallet;
  const sh = state.storehouse;
  if (ai.balance > ai.maxCap) {
    const excess = ai.balance - ai.maxCap;
    ai.balance = ai.maxCap;
    sh.balance += excess;
    return { swept: true, amount: excess };
  }
  return { swept: false, amount: 0 };
}
function resetPercentToFloor(state) {
  const allowed = state.aiWallet.allowedPercents.slice().sort((a,b)=>a-b);
  state.aiWallet.activePercent = allowed[0];
}
module.exports = { defaultState, resetDailyCounters, fundAIIfNeeded, sweepExcess, resetPercentToFloor };
