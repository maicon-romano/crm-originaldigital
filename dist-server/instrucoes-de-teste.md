# Instruções para Testar o Servidor de Emails

Este documento contém instruções detalhadas para testar o servidor de emails criado para o CRM da Original Digital.

## Arquivos Incluídos

Todos os arquivos necessários estão na pasta `dist-server`:

- `server.cjs` - O servidor de emails principal
- `index.js` - Arquivo de entrada que carrega o servidor
- `package.json` - Configuração do pacote Node.js
- `.env` - Arquivo de configuração com credenciais SMTP
- `test-email-server.js` - Script para testar o servidor via linha de comando
- `test-formulario.html` - Interface web para testar o servidor
- `start-local-server.sh` - Script para iniciar o servidor localmente
- `install-server.sh` - Script para instalar o servidor no VPS

## Opção 1: Testar Localmente no seu Computador

Para testar o servidor em seu computador:

1. Faça o download da pasta `dist-server`
2. Abra um terminal na pasta `dist-server`
3. Execute os seguintes comandos:

```bash
# Instalar as dependências
npm install

# Iniciar o servidor
npm start
```

4. Abra o arquivo `test-formulario.html` em seu navegador
5. Preencha os dados e clique em "Enviar Email" para testar

## Opção 2: Usar o Script de Teste Automatizado

Para testar o servidor via linha de comando:

```bash
# Instalar dependências
npm install

# Executar o script de teste
npm test
```

Este script verificará a conexão SMTP e tentará enviar um email de teste.

## Opção 3: Usar o Script Shell para Iniciar o Servidor

Se estiver usando Linux ou macOS:

```bash
# Dar permissão de execução
chmod +x start-local-server.sh

# Executar o script
./start-local-server.sh
```

Este script instalará todas as dependências, iniciará o servidor e abrirá o formulário de teste no navegador.

## Configuração do Servidor VPS

Para instalar o servidor no VPS da Contabo:

1. Faça o upload da pasta `dist-server` para o VPS
2. Edite o arquivo `.env` com as credenciais corretas (se necessário)
3. Execute o script de instalação:

```bash
# Dar permissão de execução
chmod +x install-server.sh

# Executar o script
sudo ./install-server.sh ./
```

Isso instalará o Node.js (se necessário), instalará o PM2 para gerenciamento de processos, instalará as dependências e configurará o servidor para iniciar automaticamente.

## Verificando o Status no VPS

Após a instalação no VPS, você pode verificar o status do servidor com:

```bash
# Ver status do processo
pm2 status

# Ver logs em tempo real
pm2 logs email-server-original-digital
```

## Possíveis Problemas

1. **Erro de conexão SMTP**: Verifique as credenciais no arquivo `.env`
2. **Timeout na conexão**: O servidor pode estar bloqueando a porta 465. Verifique o firewall.
3. **Erro "self-signed certificate"**: Isso é normal quando você usa SSL com um certificado auto-assinado. Você pode desativar a verificação SSL adicionando `secure: false` no arquivo `server.cjs` (linha ~27).

## Usando como API para o CRM

Para integrar o servidor com o CRM, faça requisições POST para o endpoint `/api/invite` com os seguintes parâmetros:

```json
{
  "nome": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "senha": "SenhaTemporaria123",
  "link": "https://crm.originaldigital.com.br"
}
```

A resposta será um objeto JSON com informações sobre o sucesso ou falha do envio.