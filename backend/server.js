import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const dbFile = path.resolve('backend', 'db.json');

function readDb() {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ users: [], transactions: [], reviews: [] }, null, 2));
  }

  const raw = fs.readFileSync(dbFile, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

app.get('/api/users', (req, res) => {
  const db = readDb();
  const { type, email } = req.query;

  let users = db.users;
  if (type) {
    users = users.filter((user) => user.userType === type);
  }
  if (email) {
    users = users.filter((user) => user.email === String(email));
  }

  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const db = readDb();
  const payload = req.body;
  if (db.users.some((u) => u.email === payload.email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const nextId = db.users.length > 0 ? Math.max(...db.users.map((user) => user.id)) + 1 : 1;
  const newUser = {
    id: nextId,
    ...payload,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    loginAttempts: 0,
    accountLocked: false,
    isActive: true,
  };
  db.users.push(newUser);
  writeDb(db);
  res.status(201).json(newUser);
});

app.patch('/api/users/:id', (req, res) => {
  const db = readDb();
  const userId = Number(req.params.id);
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updates = req.body;
  Object.assign(user, updates);
  writeDb(db);
  res.json(user);
});

app.get('/api/providers', (req, res) => {
  const db = readDb();
  const providers = db.users.filter((user) => user.userType === 'provider');
  res.json(providers);
});

app.get('/api/transactions', (req, res) => {
  const db = readDb();
  res.json(db.transactions);
});

app.post('/api/transactions', (req, res) => {
  const db = readDb();
  const payload = req.body;
  const nextId = db.transactions.length > 0 ? Math.max(...db.transactions.map((item) => item.id)) + 1 : 1;
  const newTransaction = {
    id: nextId,
    ...payload,
    date: new Date().toISOString(),
  };
  db.transactions.push(newTransaction);
  writeDb(db);
  res.status(201).json(newTransaction);
});

app.patch('/api/transactions/:id/status', (req, res) => {
  const db = readDb();
  const transactionId = Number(req.params.id);
  const transaction = db.transactions.find((item) => item.id === transactionId);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  transaction.status = req.body.status;
  writeDb(db);
  res.json(transaction);
});

app.get('/api/reviews', (req, res) => {
  const db = readDb();
  res.json(db.reviews);
});

app.get('/api/reviews/provider/:providerId', (req, res) => {
  const db = readDb();
  const providerId = Number(req.params.providerId);
  const reviews = db.reviews.filter((review) => review.providerId === providerId);
  res.json(reviews);
});

app.post('/api/reviews', (req, res) => {
  const db = readDb();
  const payload = req.body;
  const nextId = db.reviews.length > 0 ? Math.max(...db.reviews.map((item) => item.id)) + 1 : 1;
  const newReview = {
    id: nextId,
    ...payload,
    date: new Date().toISOString(),
  };
  db.reviews.push(newReview);
  writeDb(db);
  res.status(201).json(newReview);
});

app.get('/api/admin/stats', (req, res) => {
  const db = readDb();
  const customers = db.users.filter((u) => u.userType === 'customer').length;
  const providers = db.users.filter((u) => u.userType === 'provider').length;
  const completedOrders = db.transactions.filter((t) => t.status === 'completed').length;
  const revenue = db.transactions.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  res.json({ totalUsers: customers + providers, customers, providers, completedOrders, revenue });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Backend API server is running on http://localhost:${port}`);
});
