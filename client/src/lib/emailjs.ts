import emailjs from 'emailjs-com';

// Configuração do EmailJS
const serviceId = 'service_gssy9h5';
const templateId = 'template_d2v8hoo';
const publicKey = 'UJcIbUb-u84HDhndU';

// Inicializa o EmailJS
emailjs.init(publicKey);

interface SendInvitationParams {
  to_email: string;
  to_name: string;
  password: string;
  user_role: string;
}

/**
 * Envia um email de convite para um novo usuário
 * @param params Parâmetros para o email de convite
 * @returns Promise com o resultado do envio
 */
export const sendInvitationEmail = async (params: SendInvitationParams): Promise<{ success: boolean; message: string }> => {
  try {
    // Definir os parâmetros do template
    const templateParams = {
      to_email: params.to_email,
      to_name: params.to_name,
      password: params.password,
      user_role: params.user_role,
      site_name: 'CRM - Original Digital',
      login_url: window.location.origin + '/login'
    };

    // Enviar o email
    const response = await emailjs.send(serviceId, templateId, templateParams);
    
    console.log('Email de convite enviado com sucesso:', response);
    return { 
      success: true, 
      message: 'Convite enviado com sucesso para ' + params.to_email 
    };
  } catch (error) {
    console.error('Erro ao enviar email de convite:', error);
    return { 
      success: false, 
      message: 'Falha ao enviar convite: ' + (error instanceof Error ? error.message : String(error))
    };
  }
};