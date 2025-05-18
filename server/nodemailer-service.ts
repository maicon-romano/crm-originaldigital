import nodemailer from 'nodemailer';

// Configurar transporte de email usando as credenciais da Hostgator
const transporter = nodemailer.createTransport({
  host: 'mail.originaldigital.com.br',
  port: 465,
  secure: true,
  auth: {
    user: 'suporte@originaldigital.com.br',
    pass: 'Original.280712'
  }
});

interface InvitationEmailData {
  to: string;
  name: string;
  password: string;
  role: string;
}

/**
 * Envia um email de convite para um novo usuário
 */
export async function sendInvitation(data: InvitationEmailData): Promise<{success: boolean; message: string}> {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #333;">CRM - Original Digital</h1>
        </div>
        
        <p>Olá, <strong>${data.name}</strong>!</p>
        
        <p>Você foi convidado a acessar o sistema CRM da Original Digital como <strong>${data.role}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Suas credenciais de acesso:</strong></p>
          <p style="margin: 10px 0;">E-mail: ${data.to}</p>
          <p style="margin: 10px 0;">Senha temporária: ${data.password}</p>
        </div>
        
        <p>
          <a href="https://d9ad5041-d1af-4f41-a09a-2cf9debfdfd9-00-1km8c6eanlivp.riker.replit.dev/login" 
             style="display: inline-block; background-color: #4A6FDC; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px;">
            Acessar o CRM
          </a>
        </p>
        
        <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
          Este é um email automático, não responda a esta mensagem.
        </p>
      </div>
    `;

    // Enviar o email
    const info = await transporter.sendMail({
      from: '"CRM Original Digital" <suporte@originaldigital.com.br>', 
      to: data.to,
      subject: 'Convite para acessar o CRM da Original Digital',
      html: htmlContent,
      text: `Olá ${data.name}, você foi convidado a acessar o CRM da Original Digital como ${data.role}. 
      Suas credenciais são: 
      Email: ${data.to}
      Senha: ${data.password}
      Acesse: https://d9ad5041-d1af-4f41-a09a-2cf9debfdfd9-00-1km8c6eanlivp.riker.replit.dev/login`
    });

    console.log('Email enviado com sucesso:', info.messageId);
    return {
      success: true,
      message: `Email de convite enviado com sucesso para ${data.to}`
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar email'
    };
  }
}

/**
 * Testa a conexão com o servidor de email
 */
export async function testEmailConnection(): Promise<{success: boolean; message: string}> {
  try {
    await transporter.verify();
    return {
      success: true,
      message: 'Conexão com servidor de email estabelecida com sucesso'
    };
  } catch (error) {
    console.error('Erro ao verificar conexão com servidor de email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao verificar conexão'
    };
  }
}