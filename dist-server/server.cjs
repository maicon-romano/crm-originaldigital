/**
 * Servidor Standalone para Envio de Emails por SMTP
 * 
 * Este servidor é dedicado apenas para a funcionalidade de envio
 * de emails de convite. Ele deve ser executado no VPS da Contabo
 * onde tem acesso direto às portas SMTP sem restrições.
 */

// Importar dependências
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

// Criar servidor Express
const app = express();
app.use(express.json());
app.use(cors());

// Verificar variáveis de ambiente obrigatórias
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Erro: Faltam variáveis de ambiente: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Configurar transporte de email usando variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true para porta 465 (SSL)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  debug: true, // Habilitar logs para debug
  connectionTimeout: 10000 // Timeout de 10 segundos
});

// Template HTML para o email de convite
const emailTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite CRM Original Digital</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    .header h1 {
      color: #4A6FDC;
      margin-top: 0;
    }
    .credentials {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .credentials p {
      margin: 10px 0;
    }
    .button {
      display: inline-block;
      background-color: #4A6FDC;
      color: white !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CRM Original Digital</h1>
    </div>
    
    <p>Olá, <strong>{{nome}}</strong>!</p>
    
    <p>Você foi convidado a acessar o sistema CRM da Original Digital.</p>
    
    <div class="credentials">
      <p><strong>Suas credenciais de acesso:</strong></p>
      <p><strong>E-mail:</strong> {{email}}</p>
      <p><strong>Senha temporária:</strong> {{senha}}</p>
    </div>
    
    <p>Para acessar o sistema, clique no botão abaixo:</p>
    
    <a href="{{link}}" class="button">Acessar o CRM</a>
    
    <p>Caso o botão não funcione, copie e cole o link abaixo no seu navegador:</p>
    <p>{{link}}</p>
    
    <div class="footer">
      <p>Esta é uma mensagem automática. Não responda a este e-mail.</p>
      <p>&copy; 2025 Original Digital. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

// Endpoint para envio de convites
app.post('/api/invite', async (req, res) => {
  try {
    // Extrair dados da requisição
    const { nome, email, senha, link } = req.body;
    
    // Validar dados obrigatórios
    if (!nome || !email || !senha || !link) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos. É necessário fornecer nome, email, senha e link.'
      });
    }
    
    console.log(`[${new Date().toISOString()}] Processando envio de convite para ${email} (${nome})`);
    
    // Preencher placeholders no template
    const htmlContent = emailTemplate
      .replace(/{{nome}}/g, nome)
      .replace(/{{email}}/g, email)
      .replace(/{{senha}}/g, senha)
      .replace(/{{link}}/g, link);
    
    // Texto alternativo para clientes que não suportam HTML
    const textContent = `
      Olá, ${nome}!
      
      Você foi convidado a acessar o sistema CRM da Original Digital.
      
      Suas credenciais de acesso:
      E-mail: ${email}
      Senha temporária: ${senha}
      
      Para acessar o sistema, utilize o link abaixo:
      ${link}
      
      Esta é uma mensagem automática. Não responda a este e-mail.
      © 2025 Original Digital. Todos os direitos reservados.
    `;
    
    // Configurar email para envio
    const mailOptions = {
      from: `"CRM Original Digital" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Convite para acessar o CRM da Original Digital',
      html: htmlContent,
      text: textContent
    };
    
    // Enviar o email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[${new Date().toISOString()}] Email de convite enviado com sucesso:`, {
      messageId: info.messageId,
      recipient: email
    });
    
    // Retornar resposta de sucesso
    return res.status(200).json({
      success: true,
      message: `Convite enviado com sucesso para ${email}`,
      data: {
        messageId: info.messageId,
        recipient: email
      }
    });
  } catch (error) {
    // Log detalhado de erro
    console.error(`[${new Date().toISOString()}] Erro ao enviar convite:`, error);
    
    // Resposta de erro tratada
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar convite',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Endpoint para testar conexão SMTP
app.get('/api/smtp-test', async (req, res) => {
  try {
    // Verificar conexão com o servidor SMTP
    await transporter.verify();
    
    return res.status(200).json({
      success: true,
      message: 'Conexão com servidor SMTP estabelecida com sucesso',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER?.split('@')[0] + '@' + '***'
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao verificar conexão SMTP:`, error);
    
    return res.status(500).json({
      success: false,
      message: 'Falha na conexão com servidor SMTP',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Rota raiz para verificar se o servidor está rodando
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Servidor de Emails - Original Digital</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #4A6FDC; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
          .endpoints { margin-top: 30px; }
          .endpoint { margin-bottom: 20px; }
          .method { display: inline-block; background: #4A6FDC; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          .url { font-family: monospace; margin-left: 10px; }
        </style>
      </head>
      <body>
        <h1>Servidor de Emails - Original Digital</h1>
        <p>Este servidor está ativo e pronto para processar envios de emails.</p>
        
        <div class="endpoints">
          <h2>Endpoints Disponíveis:</h2>
          
          <div class="endpoint">
            <span class="method">POST</span>
            <span class="url">/api/invite</span>
            <p>Envia um email de convite para um novo usuário.</p>
            <pre>
{
  "nome": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "senha": "SenhaTemporaria123",
  "link": "https://crm.originaldigital.com.br"
}
            </pre>
          </div>
          
          <div class="endpoint">
            <span class="method">GET</span>
            <span class="url">/api/smtp-test</span>
            <p>Testa a conexão com o servidor SMTP.</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Servidor de emails rodando na porta ${PORT}`);
  console.log(`[${new Date().toISOString()}] Configuração SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
  console.log(`[${new Date().toISOString()}] Usuário SMTP: ${process.env.SMTP_USER}`);
});