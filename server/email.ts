import nodemailer from 'nodemailer';

// Configuração do transporte de email com as credenciais da Hostgator
const transporter = nodemailer.createTransport({
  host: 'mail.originaldigital.com.br',
  port: 465,
  secure: true, // true para porta 465, false para porta 587
  auth: {
    user: 'suporte@originaldigital.com.br',
    pass: 'Original.280712'
  }
});

// Interface para os parâmetros do email de convite
export interface SendInvitationParams {
  to: string;
  name: string;
  password: string;
  role: string;
}

/**
 * Envia um email de convite para um novo usuário
 * @param params Parâmetros para o email de convite
 * @returns Promise com o resultado do envio
 */
export const sendInvitationEmail = async (params: SendInvitationParams): Promise<{ success: boolean; message: string }> => {
  try {
    // Verificar parâmetros essenciais
    if (!params.to || !params.name) {
      throw new Error('Email ou nome do destinatário não informados');
    }

    // Construir o conteúdo HTML do email de convite
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #333;">CRM - Original Digital</h1>
        </div>
        
        <p>Olá, <strong>${params.name}</strong>!</p>
        
        <p>Você foi convidado a acessar o sistema CRM da Original Digital como <strong>${params.role}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Suas credenciais de acesso:</strong></p>
          <p style="margin: 10px 0;">E-mail: ${params.to}</p>
          <p style="margin: 10px 0;">Senha temporária: ${params.password}</p>
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

    // Configurar o email
    const mailOptions = {
      from: '"CRM Original Digital" <suporte@originaldigital.com.br>',
      to: params.to,
      subject: 'Convite para acessar o CRM da Original Digital',
      html: html,
      text: `Olá, ${params.name}! Você foi convidado a acessar o sistema CRM da Original Digital como ${params.role}. 
      Suas credenciais de acesso: 
      E-mail: ${params.to} 
      Senha temporária: ${params.password} 
      Acesse: https://d9ad5041-d1af-4f41-a09a-2cf9debfdfd9-00-1km8c6eanlivp.riker.replit.dev/login`
    };

    // Enviar o email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email de convite enviado com sucesso:', info.messageId);
    return {
      success: true,
      message: `Convite enviado com sucesso para ${params.to}`
    };
  } catch (error) {
    console.error('Erro ao enviar email de convite:', error);
    return {
      success: false,
      message: `Falha ao enviar convite: ${error instanceof Error ? error.message : String(error)}`
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
    // Verificar parâmetros essenciais
    if (!email || !resetLink) {
      throw new Error('Email ou link de redefinição não informados');
    }

    // Construir o conteúdo HTML do email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #333;">CRM - Original Digital</h1>
        </div>
        
        <p>Olá!</p>
        
        <p>Recebemos uma solicitação para redefinir sua senha no CRM da Original Digital.</p>
        
        <p>
          <a href="${resetLink}" 
             style="display: inline-block; background-color: #4A6FDC; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px;">
            Redefinir minha senha
          </a>
        </p>
        
        <p>Se você não solicitou a redefinição da senha, ignore este email.</p>
        
        <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
          Este é um email automático, não responda a esta mensagem.
        </p>
      </div>
    `;

    // Configurar o email
    const mailOptions = {
      from: '"CRM Original Digital" <suporte@originaldigital.com.br>',
      to: email,
      subject: 'Redefinição de senha - CRM Original Digital',
      html: html,
      text: `Olá! Recebemos uma solicitação para redefinir sua senha no CRM da Original Digital. 
      Redefinir senha: ${resetLink} 
      Se você não solicitou a redefinição da senha, ignore este email.`
    };

    // Enviar o email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email de redefinição de senha enviado com sucesso:', info.messageId);
    return {
      success: true,
      message: `Email de redefinição de senha enviado com sucesso para ${email}`
    };
  } catch (error) {
    console.error('Erro ao enviar email de redefinição de senha:', error);
    return {
      success: false,
      message: `Falha ao enviar email de redefinição: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};