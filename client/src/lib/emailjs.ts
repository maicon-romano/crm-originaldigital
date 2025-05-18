import emailjs from '@emailjs/browser';

// Configuração do EmailJS - valores fixos fornecidos pelo usuário
const SERVICE_ID = 'service_gssy9h5';
const TEMPLATE_ID = 'template_d2v8hoo';
const PUBLIC_KEY = 'UJcIbUb-u84HDhndU';

// Interface para os parâmetros do email de convite
interface SendInvitationParams {
  to_email: string;
  to_name: string;
  password: string;
  user_role: string;
}

/**
 * Envia um email de convite para um novo usuário usando EmailJS
 * @param params Parâmetros para o email de convite
 * @returns Promise com o resultado do envio
 */
export const sendInvitationEmail = async (params: SendInvitationParams): Promise<{ success: boolean; message: string }> => {
  try {
    // Verificar se os parâmetros necessários estão presentes
    if (!params.to_email || !params.to_name) {
      throw new Error('Email ou nome do destinatário não informados');
    }

    // Inicializar o EmailJS com a chave pública
    emailjs.init(PUBLIC_KEY);
    
    console.log('Enviando email de convite para:', params.to_email);
    
    // Preparar os parâmetros do template
    const templateParams = {
      to_email: params.to_email,
      to_name: params.to_name,
      password: params.password || 'Senha123!', // Senha padrão se não fornecida
      user_role: params.user_role || 'Usuário',
      site_name: 'CRM - Original Digital',
      login_url: window.location.origin + '/login'
    };
    
    // Log para debug
    console.log('Parâmetros do template:', JSON.stringify(templateParams));
    console.log('IDs de serviço e template:', SERVICE_ID, TEMPLATE_ID);

    // Enviar o email usando a nova API do EmailJS
    const response = await emailjs.send(
      SERVICE_ID, 
      TEMPLATE_ID, 
      templateParams,
      PUBLIC_KEY // Passando a chave pública como 4º parâmetro (opcional)
    );
    
    console.log('Email de convite enviado com sucesso:', response);
    return { 
      success: true, 
      message: 'Convite enviado com sucesso para ' + params.to_email 
    };
  } catch (error) {
    // Log detalhado do erro
    console.error('Erro ao enviar email de convite:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return { 
      success: false, 
      message: 'Falha ao enviar convite: ' + errorMessage
    };
  }
};