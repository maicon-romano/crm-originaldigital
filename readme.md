# Servidor de Envio de Emails - Original Digital

Este é um servidor simples dedicado ao envio de emails para o CRM da Original Digital. O servidor foi projetado para ser executado em um VPS da Contabo, onde terá acesso direto às portas SMTP sem restrições.

## Funcionalidades

- Envio de emails de convite para novos usuários
- Template HTML responsivo e profissional
- Verificação de conexão com servidor SMTP
- Tratamento adequado de erros e timeouts
- Logs detalhados

## Configuração

1. Clone este repositório no servidor VPS
2. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
SMTP_HOST=mail.originaldigital.com.br
SMTP_PORT=465
SMTP_USER=suporte@originaldigital.com.br
SMTP_PASS=SUA_SENHA_AQUI
PORT=3000
```

3. Instale as dependências:

```bash
npm install
```

4. Inicie o servidor:

```bash
node server.js
```

## Endpoints

### Teste de Conexão SMTP

```
GET /api/smtp-test
```

Retorna um status 200 se a conexão com o servidor SMTP for bem-sucedida.

### Envio de Convite

```
POST /api/invite
```

**Corpo da requisição:**

```json
{
  "nome": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "senha": "SenhaTemporaria123",
  "link": "https://crm.originaldigital.com.br"
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "message": "Convite enviado com sucesso para usuario@exemplo.com",
  "data": {
    "messageId": "abc123",
    "recipient": "usuario@exemplo.com"
  }
}
```

## Integração com o CRM

Para integrar este serviço ao CRM, faça uma requisição POST para o endpoint `/api/invite` com os dados necessários quando um novo usuário for criado.

Exemplo com fetch:

```javascript
const sendInvitation = async (user) => {
  try {
    const response = await fetch('https://seu-servidor-vps.com/api/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: user.name,
        email: user.email,
        senha: "SenhaTemporaria123",
        link: "https://crm.originaldigital.com.br"
      }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao enviar convite:', error);
    throw error;
  }
};
```

## Verificações e Depuração

- O servidor verifica automaticamente se todas as variáveis de ambiente necessárias estão presentes
- Logs detalhados com timestamps para facilitar a depuração
- Tratamento de erros de conexão SMTP com mensagens claras
- Endpoint de teste para verificar a conexão SMTP

## Segurança

- Use HTTPS em produção
- Configure um firewall para permitir apenas as conexões necessárias
- Nunca exponha as credenciais SMTP em código público
- Considere implementar autenticação para os endpoints se necessário