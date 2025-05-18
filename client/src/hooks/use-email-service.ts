/**
 * Hook para gerenciar o envio de emails através da API do servidor
 */

export interface SendInvitationParams {
  email: string;
  name: string;
  password?: string;
  role?: string;
}

/**
 * Hook para usar o serviço de email
 */
export function useEmailService() {
  /**
   * Envia um convite por email para um usuário
   */
  const sendInvitation = async (params: SendInvitationParams) => {
    try {
      console.log('Enviando convite para:', params.email);
      
      // Chamar a API do backend para enviar o email
      const response = await fetch('/api/email/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: params.email,
          name: params.name,
          password: params.password || 'Senha123!',
          role: params.role || 'Usuário',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar convite');
      }
      
      return {
        success: true,
        message: data.message || `Convite enviado com sucesso para ${params.email}`
      };
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar convite'
      };
    }
  };

  /**
   * Testa a conexão com o servidor de email
   */
  const testEmailConnection = async () => {
    try {
      const response = await fetch('/api/email/test');
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('Erro ao testar conexão com servidor de email:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  return {
    sendInvitation,
    testEmailConnection
  };
}