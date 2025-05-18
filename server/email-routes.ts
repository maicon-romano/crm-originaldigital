import { Request, Response, Express } from 'express';
import { sendInvitationEmail, verifyEmailConnection } from './email-resend';

/**
 * Registra as rotas relacionadas a email no aplicativo Express
 */
export function registerEmailRoutes(app: Express): void {
  /**
   * Rota para enviar convite por email
   */
  app.post('/api/email/send-invitation', async (req: Request, res: Response) => {
    try {
      const { email, name, password, role } = req.body;

      // Validar dados obrigatórios
      if (!email || !name || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos. É necessário fornecer email, nome, senha e função.'
        });
      }

      // Enviar o email de convite
      const result = await sendInvitationEmail({
        to: email,
        name,
        password,
        role
      });

      // Retornar resultado
      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      console.error('Erro ao processar requisição de envio de convite:', error);
      return res.status(500).json({
        success: false,
        message: `Erro ao processar requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  });

  /**
   * Rota para testar a conexão com o serviço de email
   */
  app.get('/api/email/test', async (req: Request, res: Response) => {
    try {
      const result = await verifyEmailConnection();
      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Erro ao testar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  });
}