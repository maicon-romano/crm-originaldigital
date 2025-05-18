#!/bin/bash
# Script de instalação do Servidor de Email - Original Digital

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}  INSTALAÇÃO DO SERVIDOR DE EMAIL - ORIGINAL DIGITAL${NC}"
echo -e "${GREEN}==================================================${NC}\n"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js não está instalado. Instalando...${NC}"
    # Instalar curl se não estiver instalado
    if ! command -v curl &> /dev/null; then
        apt-get update
        apt-get install -y curl
    fi
    
    # Instalar Node.js (versão LTS)
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    echo -e "${GREEN}Node.js instalado com sucesso!${NC}"
else
    echo -e "${GREEN}Node.js já está instalado: $(node -v)${NC}"
fi

# Verificar se PM2 está instalado (para execução em segundo plano)
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 não está instalado. Instalando...${NC}"
    npm install -g pm2
    echo -e "${GREEN}PM2 instalado com sucesso!${NC}"
else
    echo -e "${GREEN}PM2 já está instalado: $(pm2 -v)${NC}"
fi

# Criar diretório para o servidor
mkdir -p /opt/original-digital/email-server
cd /opt/original-digital/email-server

echo -e "\n${YELLOW}Copiando arquivos...${NC}"

# Copiar o arquivo server.cjs para o diretório de instalação
cp $1/server.cjs ./server.cjs
cp $1/package-server.json ./package.json
cp $1/.env ./.env

echo -e "${GREEN}Arquivos copiados com sucesso!${NC}"

# Instalar dependências
echo -e "\n${YELLOW}Instalando dependências...${NC}"
npm install
echo -e "${GREEN}Dependências instaladas com sucesso!${NC}"

# Configurar PM2 para iniciar o servidor automaticamente
echo -e "\n${YELLOW}Configurando PM2 para iniciar o servidor automaticamente...${NC}"
pm2 start server.cjs --name "email-server-original-digital"
pm2 save
pm2 startup

echo -e "\n${GREEN}==================================================${NC}"
echo -e "${GREEN}  INSTALAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo -e "${GREEN}==================================================${NC}\n"

echo -e "O servidor de email está rodando em segundo plano usando PM2."
echo -e "Para verificar o status: ${YELLOW}pm2 status${NC}"
echo -e "Para ver os logs: ${YELLOW}pm2 logs email-server-original-digital${NC}"
echo -e "Acesse o servidor em: ${YELLOW}http://localhost:3000${NC}"

echo -e "\n${YELLOW}Testando a conexão SMTP...${NC}"
curl -s http://localhost:3000/api/smtp-test | grep -q "success\":true" && \
    echo -e "${GREEN}Conexão SMTP estabelecida com sucesso!${NC}" || \
    echo -e "${RED}Falha ao conectar com o servidor SMTP. Verifique as configurações no arquivo .env${NC}"

echo -e "\n${GREEN}Instalação finalizada!${NC}"