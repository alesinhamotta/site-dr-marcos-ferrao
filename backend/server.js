/* ====================================
   SERVER.JS - BACKEND DR. MARCOS FERRÃO
   Express + MongoDB + Dashboard
   ==================================== */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ===== CONEXÃO COM MONGODB =====
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dr-marcos-ferrao', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Conectado ao MongoDB');
}).catch(err => {
  console.error('❌ Erro ao conectar MongoDB:', err);
});

// ===== SCHEMAS =====
const contatoSchema = new mongoose.Schema({
  nome: String,
  email: String,
  whatsapp: String,
  area: String,
  mensagem: String,
  status: { type: String, default: 'novo' }, // novo, respondido, arquivado
  dataContato: { type: Date, default: Date.now },
  dataResposta: Date,
  origem: String, // formulario, whatsapp, email
});

const adminSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  senha: String,
  nome: String,
  dataCriacao: { type: Date, default: Date.now },
});

const Contato = mongoose.model('Contato', contatoSchema);
const Admin = mongoose.model('Admin', adminSchema);

// ===== CONFIGURAÇÃO DE EMAIL =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ===== MIDDLEWARE DE AUTENTICAÇÃO =====
const autenticar = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta');
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ erro: 'Token inválido' });
  }
};

// ===== ROTAS DE AUTENTICAÇÃO =====

// Login
app.post('/api/admin/login', [
  body('email').isEmail(),
  body('senha').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ erros: errors.array() });
  }

  try {
    const { email, senha } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ erro: 'Email ou senha inválidos' });
    }

    const senhaValida = await bcryptjs.compare(senha, admin.senha);
    if (!senhaValida) {
      return res.status(400).json({ erro: 'Email ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET || 'sua-chave-secreta',
      { expiresIn: '24h' }
    );

    res.json({ token, admin: { id: admin._id, email: admin.email, nome: admin.nome } });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// Registrar novo admin (apenas para setup inicial)
app.post('/api/admin/registrar', [
  body('email').isEmail(),
  body('senha').isLength({ min: 6 }),
  body('nome').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ erros: errors.array() });
  }

  try {
    const { email, senha, nome } = req.body;
    
    const adminExistente = await Admin.findOne({ email });
    if (adminExistente) {
      return res.status(400).json({ erro: 'Email já registrado' });
    }

    const senhaHash = await bcryptjs.hash(senha, 10);
    const novoAdmin = new Admin({ email, senha: senhaHash, nome });
    await novoAdmin.save();

    res.json({ mensagem: 'Admin registrado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar admin' });
  }
});

// ===== ROTAS DE CONTATOS =====

// Criar novo contato (formulário)
app.post('/api/contatos', [
  body('nome').notEmpty(),
  body('email').isEmail(),
  body('whatsapp').notEmpty(),
  body('area').notEmpty(),
  body('mensagem').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ erros: errors.array() });
  }

  try {
    const { nome, email, whatsapp, area, mensagem } = req.body;
    
    const novoContato = new Contato({
      nome,
      email,
      whatsapp,
      area,
      mensagem,
      origem: 'formulario',
    });

    await novoContato.save();

    // Enviar email ao escritório
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ESCRITORIO_EMAIL,
      subject: `Novo contato: ${nome} - ${area}`,
      html: `
        <h2>Novo Contato Recebido</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>WhatsApp:</strong> ${whatsapp}</p>
        <p><strong>Área:</strong> ${area}</p>
        <p><strong>Mensagem:</strong> ${mensagem}</p>
        <p><small>Data: ${new Date().toLocaleString('pt-BR')}</small></p>
      `,
    });

    // Enviar confirmação ao cliente
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recebemos seu contato - Dr. Marcos Ferrão',
      html: `
        <h2>Obrigado por entrar em contato!</h2>
        <p>Olá ${nome},</p>
        <p>Recebemos sua mensagem e entraremos em contato em breve.</p>
        <p>Você também pode nos chamar no WhatsApp: <a href="https://wa.me/5521986065322">(21) 98606-5322</a></p>
        <p>Atenciosamente,<br>Dr. Marcos Ferrão</p>
      `,
    });

    res.json({ mensagem: 'Contato recebido com sucesso', id: novoContato._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao salvar contato' });
  }
});

// Listar contatos (protegido)
app.get('/api/contatos', autenticar, async (req, res) => {
  try {
    const { area, status, pagina = 1, limite = 10 } = req.query;
    const filtro = {};

    if (area) filtro.area = area;
    if (status) filtro.status = status;

    const contatos = await Contato.find(filtro)
      .sort({ dataContato: -1 })
      .limit(limite * 1)
      .skip((pagina - 1) * limite);

    const total = await Contato.countDocuments(filtro);

    res.json({
      contatos,
      total,
      paginas: Math.ceil(total / limite),
      paginaAtual: pagina,
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar contatos' });
  }
});

// Obter contato específico (protegido)
app.get('/api/contatos/:id', autenticar, async (req, res) => {
  try {
    const contato = await Contato.findById(req.params.id);
    if (!contato) {
      return res.status(404).json({ erro: 'Contato não encontrado' });
    }
    res.json(contato);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar contato' });
  }
});

// Atualizar status do contato (protegido)
app.put('/api/contatos/:id', autenticar, async (req, res) => {
  try {
    const { status } = req.body;
    const contato = await Contato.findByIdAndUpdate(
      req.params.id,
      { status, dataResposta: new Date() },
      { new: true }
    );
    res.json(contato);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar contato' });
  }
});

// Buscar contatos (protegido)
app.get('/api/contatos/buscar/:termo', autenticar, async (req, res) => {
  try {
    const { termo } = req.params;
    const contatos = await Contato.find({
      $or: [
        { nome: { $regex: termo, $options: 'i' } },
        { email: { $regex: termo, $options: 'i' } },
        { whatsapp: { $regex: termo, $options: 'i' } },
      ],
    });
    res.json(contatos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar contatos' });
  }
});

// Exportar contatos (protegido)
app.get('/api/contatos/exportar/csv', autenticar, async (req, res) => {
  try {
    const contatos = await Contato.find();
    let csv = 'Nome,Email,WhatsApp,Área,Mensagem,Status,Data\n';
    
    contatos.forEach(c => {
      csv += `"${c.nome}","${c.email}","${c.whatsapp}","${c.area}","${c.mensagem}","${c.status}","${c.dataContato}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contatos.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao exportar contatos' });
  }
});

// ===== ROTAS DE ESTATÍSTICAS =====
app.get('/api/stats', autenticar, async (req, res) => {
  try {
    const total = await Contato.countDocuments();
    const novos = await Contato.countDocuments({ status: 'novo' });
    const respondidos = await Contato.countDocuments({ status: 'respondido' });
    const porArea = await Contato.aggregate([
      { $group: { _id: '$area', count: { $sum: 1 } } },
    ]);

    res.json({
      total,
      novos,
      respondidos,
      porArea,
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao obter estatísticas' });
  }
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Dashboard em http://localhost:${PORT}/admin`);
});