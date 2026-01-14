require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const tradingRoutes = require('./routes/trading');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req,res)=>res.json({ ok:true, service: 'autoshieldtech-backend' }));

app.use('/auth', authRoutes);
app.use('/trading', tradingRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`autoshieldtech-backend running on :${port}`));
