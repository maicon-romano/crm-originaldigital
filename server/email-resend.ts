import { Resend } from 'resend';

// Inicializar o cliente do Resend com a chave da API
const resendApiKey = process.env.RESEND_API_KEY || 're_PNRRiCug_3XnVrdnCXfRzqojZiTjrJAJ6';
const resend = new Resend(resendApiKey);

// Remetente padrão para os emails
const DEFAULT_FROM = 'suporte@originaldigital.com.br';

export interface SendInvitationParams {
  to: string;
  name: string;
  password: string;
  role: string;
}

/**
 * Cria o template HTML para o email de convite
 */
const createInvitationTemplate = (params: SendInvitationParams): string => {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite para o CRM Original Digital</title>
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
      
      <p>Olá, <strong>${params.name}</strong>!</p>
      
      <p>Você foi convidado a acessar o sistema CRM da Original Digital com a função de <strong>${params.role}</strong>.</p>
      
      <div class="credentials">
        <p><strong>Suas credenciais de acesso:</strong></p>
        <p><strong>E-mail:</strong> ${params.to}</p>
        <p><strong>Senha temporária:</strong> ${params.password}</p>
      </div>
      
      <p>Para acessar o sistema, utilize suas credenciais no link abaixo:</p>
      <p><a href="https://crm.originaldigital.com.br">https://crm.originaldigital.com.br</a></p>
      
      <div class="footer">
        <p>Esta é uma mensagem automática. Não responda a este e-mail.</p>
        <p>&copy; ${new Date().getFullYear()} Original Digital. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Envia um email de convite para um novo usuário
 * @param params Parâmetros para o email de convite
 * @returns Promise com o resultado do envio
 */
export const sendInvitationEmail = async (params: SendInvitationParams): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`⏳ Iniciando envio de convite para ${params.to} (${params.name}) com papel ${params.role}`);
    
    // Verificação de segurança para garantir que todos os parâmetros estão presentes
    if (!params.to || !params.name || !params.password || !params.role) {
      console.error('❌ Parâmetros incompletos para envio de email:', { 
        to: !!params.to, 
        name: !!params.name, 
        password: !!params.password, 
        role: !!params.role 
      });
      return { 
        success: false, 
        message: 'Parâmetros incompletos para envio de email' 
      };
    }
    
    const htmlContent = createInvitationTemplate(params);
    console.log('Template HTML gerado com sucesso');
    
    // Log para verificação de credenciais
    console.log(`Tentando enviar email com: 
      - FROM: ${DEFAULT_FROM} 
      - TO: ${params.to}
      - SUBJECT: Convite para acessar o CRM da Original Digital`
    );
    
    // Enviar o email usando o Resend com tratamento de erros reforçado
    try {
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to: params.to,
        subject: 'Convite para acessar o CRM da Original Digital',
        html: htmlContent,
      });
      
      if (error) {
        console.error('❌ Erro retornado pelo serviço Resend:', error);
        return { 
          success: false, 
          message: `Erro ao enviar email: ${error.message}`,
          error: error 
        };
      }
      
      console.log('✅ Email enviado com sucesso:', data);
      return { 
        success: true, 
        message: `Email de convite enviado com sucesso para ${params.to}`,
        data: data
      };
    } catch (sendError) {
      console.error('❌ Exceção ao enviar email com Resend:', sendError);
      return { 
        success: false, 
        message: `Exceção ao enviar email: ${sendError instanceof Error ? sendError.message : String(sendError)}`,
        error: sendError
      };
    }
  } catch (error) {
    console.error('Erro ao enviar convite:', error);
    return { 
      success: false, 
      message: `Erro ao enviar convite: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
};

/**
 * Envia um email de redefinição de senha
 * @param email Email do usuário
 * @param resetLink Link para redefinição de senha
 * @returns Promise com o resultado do envio
 */
export const sendPasswordResetEmail = async (email: string, resetLink: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Enviando email de redefinição de senha para ${email}`);
    
    // Enviar o email usando o Resend
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: 'Redefinição de Senha - CRM Original Digital',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinição de Senha - CRM Original Digital</title>
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
            
            <p>Você solicitou a redefinição de senha para sua conta no CRM da Original Digital.</p>
            
            <p>Para redefinir sua senha, clique no link abaixo:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            
            <p>Se você não solicitou esta redefinição, por favor, ignore este email.</p>
            
            <div class="footer">
              <p>Esta é uma mensagem automática. Não responda a este e-mail.</p>
              <p>&copy; ${new Date().getFullYear()} Original Digital. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (error) {
      console.error('Erro ao enviar email de redefinição de senha:', error);
      return { success: false, message: `Erro ao enviar email: ${error.message}` };
    }
    
    console.log('Email de redefinição enviado com sucesso:', data);
    return { 
      success: true, 
      message: `Email de redefinição de senha enviado com sucesso para ${email}` 
    };
  } catch (error) {
    console.error('Erro ao enviar email de redefinição:', error);
    return { 
      success: false, 
      message: `Erro ao enviar email de redefinição: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
};

/**
 * Verifica a conexão com o serviço de email
 */
export const verifyEmailConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Testar o envio de um email para verificar a conexão
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: 'test@resend.dev', // Email de teste do Resend
      subject: 'Teste de Conexão - CRM Original Digital',
      html: '<p>Este é um email de teste para verificar a conexão com o serviço de email.</p>',
    });
    
    if (error) {
      return { 
        success: false, 
        message: `Falha na conexão com o serviço de email: ${error.message}` 
      };
    }
    
    return { 
      success: true, 
      message: 'Conexão estabelecida com sucesso com o serviço de email Resend' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Erro ao verificar conexão com o serviço de email: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
};