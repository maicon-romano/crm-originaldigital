import { Express } from 'express';
import { sendInvitation, testEmailConnection } from './nodemailer-service';

/**
 * Registra as rotas relacionadas a email no aplicativo Express
 */
export function registerEmailRoutes(app: Express): void {
  // Rota para testar a conexão com o servidor de email
  app.get('/api/email/test', async (req, res) => {
    try {
      const result = await testEmailConnection();
      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('Erro ao testar conexão de email:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao testar conexão de email',
        error: error.message
      });
    }
  });

  // Rota para enviar convite por email
  app.post('/api/email/send-invitation', async (req, res) => {
    try {
      const { email, name, password, role } = req.body;
      
      // Validar parâmetros necessários
      if (!email || !name) {
        return res.status(400).json({
          success: false,
          message: 'Dados insuficientes. Email e nome são obrigatórios.'
        });
      }
      
      console.log(`Enviando convite via Nodemailer para ${email} (${name})`);
      
      // Enviar o email de convite
      const result = await sendInvitation({
        to: email,
        name,
        password: password || 'Senha123!',
        role: role || 'Usuário'
      });
      
      // Retornar o resultado
      return res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('Erro ao processar solicitação de envio de convite:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar convite',
        error: error.message
      });
    }
  });
}