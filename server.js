const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta public (HTML, CSS, JS, Imagens) com charset UTF-8
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// Criar Chamado
app.post('/api/tickets', async (req, res) => {
  try {
    const { clientName, clientPhone, serviceType, description } = req.body;

    if (!clientName || !clientPhone || !serviceType) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    const newTicket = await prisma.ticket.create({
      data: {
        clientName,
        clientPhone,
        serviceType,
        description: description || '',
        status: 'PENDING'
      }
    });

    return res.status(201).json(newTicket);
  } catch (error) {
    console.error('Erro ao salvar chamado:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar chamado.' });
  }
});

// Listar Chamados
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(tickets);
  } catch (error) {
    console.error('Erro ao buscar chamados:', error);
    return res.status(500).json({ error: 'Erro ao buscar chamados.' });
  }
});

// Atualizar Status do Chamado
app.patch('/api/tickets/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    return res.json(updatedTicket);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return res.status(500).json({ error: 'Erro ao atualizar status do chamado.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Excluir Chamado
app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.ticket.delete({
      where: { id: parseInt(id) }
    });
    return res.json({ message: 'Chamado excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir chamado:', error);
    return res.status(500).json({ error: 'Erro ao excluir chamado.' });
  }
});