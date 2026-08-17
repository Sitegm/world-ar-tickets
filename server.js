const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Aponta para a pasta public onde estão o index.html e o admin.html
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API para criar chamado (com o campo address)
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

// API para listar chamados
app.get('/api/tickets', async (req, res) => {
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

// API para atualizar status do chamado
app.patch('/api/tickets/:id/status', async (req, res) => {
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
    return res.status(500).json({ error: 'Erro interno ao atualizar status do chamado.' });
  }
});

// API para apagar chamado
app.delete('/api/tickets/:id', async (req, res) => {
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