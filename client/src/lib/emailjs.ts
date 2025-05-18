import * as emailjs from '@emailjs/browser';

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

// Função de utilidade para obter mensagem de erro formatada
const getErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error);
  }
  
  return String(error);
};

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
    
    console.log('Parâmetros do template:', JSON.stringify(templateParams));
    console.log('IDs de serviço e template:', SERVICE_ID, TEMPLATE_ID);

    // Usar método alternativo para enviar o email (approach via Promise)
    try {
      // Tentar com método sendForm
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        templateParams,
        PUBLIC_KEY
      );
      
      console.log('Email de convite enviado com sucesso!');
      return { 
        success: true, 
        message: 'Convite enviado com sucesso para ' + params.to_email 
      };
    } catch (sendError) {
      console.warn('Erro no primeiro método de envio:', sendError);
      
      // Tentar com método alternativo
      const form = document.createElement('form');
      
      // Adicionar campos para EmailJS
      Object.entries(templateParams).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });
      
      // Enviar usando o método sendForm
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form, PUBLIC_KEY);
      
      console.log('Email de convite enviado com sucesso (método alternativo)!');
      return { 
        success: true, 
        message: 'Convite enviado com sucesso para ' + params.to_email 
      };
    }
  } catch (error) {
    // Log detalhado do erro
    console.error('Erro ao enviar email de convite:', error);
    
    // Formatar mensagem de erro adequadamente
    const errorMessage = getErrorMessage(error);
    
    return { 
      success: false, 
      message: 'Falha ao enviar convite: ' + errorMessage
    };
  }
};