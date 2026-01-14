const express = require('express');
const router = express.Router();
const { signToken } = require('../lib/auth');

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email/password required' });

  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPass = process.env.OWNER_PASSWORD;

  if (email === ownerEmail && password === ownerPass) {
    const token = signToken({ email, role: 'owner' });
    return res.json({ ok: true, token, role: 'owner' });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

module.exports = router;
