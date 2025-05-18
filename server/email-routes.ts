import { Express, Request, Response } from 'express';
import { sendInvitation, testEmailConnection } from './nodemailer-service';

/**
 * Registra as rotas relacionadas a email no aplicativo Express
 */
export function registerEmailRoutes(app: Express): void {
  // Endpoint para simular envio de convite (para desenvolvimento)
  app.post('/api/email/send-invitation', async (req: Request, res: Response) => {
    try {
      const { email, name, password, role } = req.body;
      
      // Validar parâmetros necessários
      if (!email || !name) {
        return res.json({
          success: false,
          message: 'Dados insuficientes. Email e nome são obrigatórios.'
        });
      }
      
      console.log(`[SIMULAÇÃO] Enviando convite para ${email} (${name}) com papel ${role || 'Usuário'}`);
      
      // Simulação de envio (em ambiente de desenvolvimento)
      // Em produção, descomentar o bloco abaixo para usar o Nodemailer
      /*
      const result = await sendInvitation({
        to: email,
        name,
        password: password || 'Senha123!',
        role: role || 'Usuário'
      });
      */
      
      // Resposta simulada para evitar problemas com servidores SMTP
      const result = {
        success: true,
        message: `[SIMULAÇÃO] Email de convite enviado com sucesso para ${email}`
      };
      
      return res.json(result);
    } catch (error: any) {
      console.error('Erro ao processar solicitação de envio de convite:', error);
      return res.json({
        success: false,
        message: `Erro ao enviar convite: ${error.message}`
      });
    }
  });
  
  // Rota para testar a conexão com o servidor de email
  app.get('/api/email/test', async (req: Request, res: Response) => {
    try {
      const result = await testEmailConnection();
      return res.json(result);
    } catch (error: any) {
      console.error('Erro ao testar conexão de email:', error);
      return res.json({
        success: false,
        message: `Erro ao testar conexão de email: ${error.message}`
      });
    }
  });
}