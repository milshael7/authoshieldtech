const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../lib/auth');
const { readDb, writeDb } = require('../lib/db');
const { defaultState } = require('../trading/wallet');
const { executeAITrade } = require('../trading/engine');

function loadState(db) { if (!db.state) db.state = defaultState(); return db.state; }

router.get('/wallets', authMiddleware, (req, res) => {
  const db = readDb();
  const state = loadState(db);
  writeDb(db);
  res.json({ ok: true, aiWallet: state.aiWallet, storehouse: state.storehouse });
});

router.post('/ai', authMiddleware, (req, res) => {
  const db = readDb();
  const state = loadState(db);
  const result = executeAITrade(state, { confidence: !!req.body?.confidence });
  db.logs = db.logs || [];
  db.logs.push({ type: 'ai_trade', ...result });
  writeDb(db);
  res.json(result);
});

router.get('/logs', authMiddleware, (req, res) => {
  const db = readDb();
  res.json({ ok: true, logs: db.logs || [] });
});

router.post('/config/percent', authMiddleware, (req, res) => {
  const { percent } = req.body || {};
  const db = readDb();
  const state = loadState(db);
  const allowed = state.aiWallet.allowedPercents;
  const p = parseFloat(percent);
  if (!allowed.includes(p)) return res.status(400).json({ error: 'Percent not allowed', allowed });
  state.aiWallet.activePercent = p;
  writeDb(db);
  res.json({ ok: true, activePercent: state.aiWallet.activePercent });
});

module.exports = router;
