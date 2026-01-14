import React, { useEffect, useState } from 'react';
import { api } from './api';

const TITLE = "AutoShield TECH (Security Platform)";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [wallets, setWallets] = useState(null);
  const [logs, setLogs] = useState([]);
  const [percent, setPercent] = useState(30);

  async function login(e) {
    e.preventDefault();
    try {
      setStatus('Logging in...');
      const data = await api('/auth/login', { method:'POST', body: { email, password }});
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setStatus('Logged in.');
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function refresh() {
    if (!token) return;
    try {
      const w = await api('/trading/wallets', { token });
      setWallets(w);
      const l = await api('/trading/logs', { token });
      setLogs(l.logs || []);
      setPercent(w.aiWallet?.activePercent ?? 30);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function runAI(confidence=false) {
    try {
      const r = await api('/trading/ai', { method:'POST', token, body: { confidence }});
      setStatus(r.ok ? `Trade ran. PnL: $${r.pnl.toFixed(2)}` : r.reason);
      await refresh();
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function setActivePercent() {
    try {
      await api('/trading/config/percent', { method:'POST', token, body: { percent }});
      await refresh();
      setStatus('Percent updated.');
    } catch (err) {
      setStatus(err.message);
    }
  }

  function logout() {
    setToken('');
    localStorage.removeItem('token');
    setWallets(null);
    setLogs([]);
  }

  useEffect(() => { refresh(); }, [token]);

  if (!token) {
    return (
      <div className="container">
        <h1>{TITLE}</h1>
        <p className="muted">Owner-only login (set credentials in backend .env)</p>
        <form onSubmit={login} className="card">
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="owner@example.com" />
          <label>Password</label>
          <input value={password} type="password" onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          <button type="submit">Sign in</button>
        </form>
        <p className="status">{status}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="topbar">
        <h1>{TITLE}</h1>
        <button onClick={logout} className="secondary">Log out</button>
      </div>

      <div className="grid">
        <div className="card">
          <h2>AI Wallet</h2>
          {wallets ? (
            <>
              <div className="kv"><span>Balance</span><span>${wallets.aiWallet.balance.toFixed(2)}</span></div>
              <div className="kv"><span>Max Cap</span><span>${wallets.aiWallet.maxCap}</span></div>
              <div className="kv"><span>Active %</span><span>{wallets.aiWallet.activePercent}%</span></div>
              <div className="kv"><span>Trades Today</span><span>{wallets.aiWallet.tradesToday}</span></div>
              <div className="kv"><span>Consecutive Losses</span><span>{wallets.aiWallet.consecutiveLosses}</span></div>
            </>
          ) : <p>Loading…</p>}
        </div>

        <div className="card">
          <h2>Storehouse</h2>
          {wallets ? (
            <>
              <div className="kv"><span>Balance</span><span>${wallets.storehouse.balance.toFixed(2)}</span></div>
              <div className="kv"><span>Minimum Reserve</span><span>${wallets.storehouse.minimumReserve}</span></div>
            </>
          ) : <p>Loading…</p>}
        </div>

        <div className="card">
          <h2>Controls</h2>
          <div className="row">
            <button onClick={()=>runAI(false)}>Run AI Trade</button>
            <button onClick={()=>runAI(true)} className="secondary">Confidence Trade</button>
          </div>
          <div className="row" style={{marginTop:12}}>
            <input type="number" value={percent} onChange={e=>setPercent(parseFloat(e.target.value))} />
            <button onClick={setActivePercent} className="secondary">Set %</button>
          </div>
          <p className="muted">Rules: 3 trades/day, sabbath pause, auto-refill if AI wallet ≤ min, reset % after 2 losses.</p>
        </div>

        <div className="card">
          <h2>Logs</h2>
          <div className="logs">
            {logs.slice().reverse().slice(0,30).map((l, i) => (
              <div key={i} className="logline">
                <span className="muted">{new Date(l.timestamp||Date.now()).toLocaleString()}</span>
                <span> {l.ok ? `PnL $${(l.pnl||0).toFixed(2)}` : `Blocked: ${l.reason}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="status">{status}</p>
    </div>
  );
}
