// Simulação de envio de email para ambiente de desenvolvimento
// Em produção, isso seria substituído por um serviço real de email

// Interface para os parâmetros do email de convite
interface SendInvitationParams {
  to_email: string;
  to_name: string;
  password: string;
  user_role: string;
}

/**
 * Simula envio de email de convite para novo usuário (modo de desenvolvimento)
 * @param params Parâmetros para o email de convite
 * @returns Promise com o resultado do envio
 */
export const sendInvitationEmail = async (params: SendInvitationParams): Promise<{ success: boolean; message: string }> => {
  try {
    // Verificar se os parâmetros necessários estão presentes
    if (!params.to_email || !params.to_name) {
      throw new Error('Email ou nome do destinatário não informados');
    }
    
    // Log do email que seria enviado
    console.log('=== SIMULAÇÃO DE ENVIO DE CONVITE ===');
    console.log(`Para: ${params.to_email} (${params.to_name})`);
    console.log(`Assunto: Convite para o CRM da Original Digital`);
    console.log(`Senha temporária: ${params.password}`);
    console.log(`Papel/Função: ${params.user_role}`);
    console.log(`URL para login: ${window.location.origin}/login`);
    console.log('=====================================');
    
    // Simulação de request para api (atraso de 1 segundo)
    return new Promise((resolve) => {
      // Simular tempo de processamento (1 segundo)
      setTimeout(() => {
        resolve({ 
          success: true, 
          message: `Simulação: Email de convite enviado para ${params.to_email} com sucesso!` 
        });
      }, 1000);
    });
  } catch (error) {
    console.error('Erro ao simular envio de convite:', error);
    return { 
      success: false, 
      message: 'Erro ao simular envio de convite: ' + (error instanceof Error ? error.message : String(error))
    };
  }
};