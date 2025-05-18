#!/bin/bash
# Script para iniciar o servidor de emails localmente para testes

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}  INICIANDO SERVIDOR DE EMAIL PARA TESTES${NC}"
echo -e "${GREEN}==================================================${NC}\n"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js não está instalado! Por favor, instale o Node.js para continuar.${NC}"
    exit 1
fi

# Verificar se o arquivo server.cjs existe
if [ ! -f "server.cjs" ]; then
    echo -e "${YELLOW}Arquivo server.cjs não encontrado! Certifique-se de que está no diretório correto.${NC}"
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Arquivo .env não encontrado! Criando um .env de exemplo...${NC}"
    echo -e "SMTP_HOST=mail.originaldigital.com.br\nSMTP_PORT=465\nSMTP_USER=suporte@originaldigital.com.br\nSMTP_PASS=Original.280712\nPORT=3000" > .env
    echo -e "${GREEN}Arquivo .env criado com valores padrão! Edite-o se necessário.${NC}"
fi

# Instalar dependências caso não existam
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando dependências...${NC}"
    npm install express nodemailer cors dotenv
    echo -e "${GREEN}Dependências instaladas com sucesso!${NC}"
fi

# Abrir o formulário de teste em um navegador
echo -e "${YELLOW}Abrindo formulário de teste no navegador (se disponível)...${NC}"
if command -v xdg-open &> /dev/null; then
    xdg-open test-formulario.html &
elif command -v open &> /dev/null; then
    open test-formulario.html &
elif command -v start &> /dev/null; then
    start test-formulario.html &
else
    echo -e "${YELLOW}Não foi possível abrir o navegador automaticamente.${NC}"
    echo -e "${YELLOW}Por favor, abra o arquivo test-formulario.html manualmente em seu navegador.${NC}"
fi

# Iniciar o servidor
echo -e "${GREEN}Iniciando o servidor de email...${NC}"
echo -e "${YELLOW}Pressione Ctrl+C para encerrar o servidor quando terminar os testes.${NC}\n"

node server.cjs