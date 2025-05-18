/**
 * Script de teste para o Servidor de Email
 * 
 * Este script envia uma requisição de teste para o servidor de emails
 * para verificar se ele está operando corretamente.
 */

const fetch = require('node-fetch');

// URL do servidor - altere conforme necessário
const SERVER_URL = 'http://localhost:3000';

// Função para testar a conexão SMTP
async function testSmtpConnection() {
  try {
    console.log('Testando conexão SMTP...');
    
    const response = await fetch(`${SERVER_URL}/api/smtp-test`);
    const result = await response.json();
    
    console.log('\n========== RESULTADO DO TESTE SMTP ==========');
    console.log(JSON.stringify(result, null, 2));
    console.log('============================================\n');
    
    return result.success;
  } catch (error) {
    console.error('Erro ao testar conexão SMTP:', error.message);
    return false;
  }
}

// Função para enviar um email de teste
async function sendTestEmail() {
  try {
    console.log('Enviando email de teste...');
    
    // Dados de teste
    const testData = {
      nome: 'Usuário de Teste',
      email: 'maicon.romano@originaldigital.com.br', // Altere para um email válido para teste
      senha: 'Senha123!',
      link: 'https://crm.originaldigital.com.br'
    };
    
    const response = await fetch(`${SERVER_URL}/api/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('\n========== RESULTADO DO ENVIO DE EMAIL ==========');
    console.log(JSON.stringify(result, null, 2));
    console.log('=================================================\n');
    
    return result.success;
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error.message);
    return false;
  }
}

// Função principal que executa os testes
async function runTests() {
  console.log('=======================================================');
  console.log('  TESTE DO SERVIDOR DE EMAILS - ORIGINAL DIGITAL');
  console.log('=======================================================\n');
  
  // Primeiro testar conexão SMTP
  const smtpTestResult = await testSmtpConnection();
  
  if (!smtpTestResult) {
    console.log('\n⚠️  A conexão SMTP falhou. Verificar configurações no arquivo .env');
    console.log('Certifique-se que:');
    console.log('1. O servidor está rodando (node server.cjs)');
    console.log('2. As credenciais SMTP estão corretas');
    console.log('3. Não há bloqueio de firewall ou restrição de porta');
    process.exit(1);
  }
  
  console.log('✅ Conexão SMTP bem-sucedida!');
  
  // Se a conexão SMTP estiver ok, enviar um email de teste
  const emailTestResult = await sendTestEmail();
  
  if (!emailTestResult) {
    console.log('\n⚠️  O envio de email falhou, mas a conexão SMTP está funcionando.');
    console.log('Verificar logs do servidor para mais detalhes.');
    process.exit(1);
  }
  
  console.log('✅ Email de teste enviado com sucesso!');
  console.log('\nTodos os testes foram concluídos com sucesso! O servidor está operacional.');
}

// Executar os testes
runTests().catch(error => {
  console.error('Erro ao executar testes:', error);
  process.exit(1);
});