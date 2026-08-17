const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_world_ar_2026';

// Credenciais de acesso da loja
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'worldar123';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Middleware para proteger rotas da API
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
}

// Rota de Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
});

// Rotas Públicas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Criar chamado (Livre para a landing page)
app.post('/api/tickets', async (req, res) => {
  try {
    const { clientName, clientPhone, address, serviceType, description } = req.body;
    const ticket = await prisma.ticket.create({
      data: { clientName, clientPhone, address, serviceType, description }
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error("Erro ao criar chamado:", error);
    res.status(500).json({ error: "Erro ao criar chamado" });
  }
});

// --- ROTAS PROTEGIDAS (Exigem Login) ---

app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    console.error("Erro ao buscar chamados:", error);
    res.status(500).json({ error: "Erro ao buscar chamados" });
  }
});

app.patch('/api/tickets/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedTicket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: { status }
    });

    return res.status(200).json(updatedTicket);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar status.' });
  }
});

app.delete('/api/tickets/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.ticket.delete({
      where: { id: Number(id) }
    });

    return res.status(200).json({ message: 'Chamado excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir chamado:', error);
    return res.status(500).json({ error: 'Erro interno ao excluir chamado.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});