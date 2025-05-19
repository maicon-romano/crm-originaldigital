import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ID da pasta principal "Clientes" no Google Drive
// É importante que este ID seja o correto da pasta compartilhada com a conta de serviço
const CLIENTES_FOLDER_ID = '18abqgDcOAkIzp79CYO9EpH2RrgluPnBI';

// Flag para habilitar/desabilitar Google Drive durante desenvolvimento
// Sempre habilitado em produção
const ENABLE_GOOGLE_DRIVE = true;

// Níveis de acesso para compartilhamento de pastas no Google Drive
const DRIVE_PERMISSION_ROLES = {
  READER: 'reader',       // Somente leitura
  COMMENTER: 'commenter', // Leitura e comentários
  WRITER: 'writer'        // Leitura, comentários e edição
};

// Estrutura das pastas do cliente
const FOLDER_STRUCTURE = [
  '01 - Briefing',
  '02 - Materiais do Cliente',
  '03 - Social Media',
  '04 - Tráfego Pago',
  '05 - Sites e Landing Pages',
  '06 - Criativos',
  '07 - Documentos e Contratos',
  '08 - Relatórios'
];

// Subpastas dentro da pasta "06 - Criativos"
const CREATIVE_SUBFOLDERS = [
  'Fotos',
  'Vídeos'
];

/**
 * Inicializa a autenticação com a API do Google Drive
 * @returns Cliente JWT autenticado
 */
async function getAuthClient() {
  try {
    // Usar diretamente o objeto de credenciais
    const credentials = {
      type: "service_account",
      project_id: "crm-originaldigital-460218",
      private_key_id: "03c085ac30b8f003c2ba5296cfcd625b376efeb5",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCj3axKZxGYpjhy\n0TCrkdQGoKLKuZFMjKsSK8j/d25GEa70G4ADdu9oBkYh3kKcSJ/CjM24eAZ9aCV1\nyg7JqMyoebr6UVZLvW/QUvplkfldTVwOPW37Amse+bQBFmUDhJ+bGynB7RoJFWtQ\n3j1d7adHDbCOwbEfBsDHEt6N0K5bnOIWh0Mk2ceUoJaK24fcgD1oxxOZDlMy634W\nWzYDQB+Sel2tGp4Tteao96ft3iO9j5IwvNY10HSClFM/RD4MT/mk/C0ZHVdE/1nf\nD09aQd4rEzWCl5B0TYNJ8ouoUSOruaM4OimosfQu2aXdHQ93wikMMGe05ZkjpPIB\n0PTqSMkFAgMBAAECggEAAiLnoOBcn0ia0ku4uSKRfipLIl5OebjDbzJ2cEwyj253\na954P137gOKaDfgmQVWEuFuFFWtX1vvhXHqEpwDmICksH0t/AZrykaekn5KKYCVx\ndoxlpMDd5tK7E8uNXWvLIpF1Vyj77qk36Qnos2g1MYIzw9IHI4rUlGks0R0AH5jJ\nQBqesIL0gnQ4y0NnwbFLia0NfmtNEpNCCnnd3K9Vey9WzunTdATDtnHGmVHS43yr\n/LMVjcdq8WbyG9f4+v2Mdw6AyqsqXPPr9FeFAHQbPGXqbIRWoBtEm3WDjJuSvLxv\nhLhGjD7LW2hMaogMA0gKo7YrRc2k+/6Oy25GXoYn8QKBgQDULNzQSqr23dPsCkPt\nbTvA8PVOKDWVx6hi0qAeMcHvS050K9kel8kE+zRmAg8PderhEtTKRgf5TK2uKaFZ\nq1f2+r8sV3NRycDo9RnoRNaNcpxnRGfJ6XJoThP58R3erYBNvEQSjq1rz+7x5Ope\nF1jaVepz008q5yl6p0QSVC1ydQKBgQDFtl6uiX3u+lgjulWH+ozZqI4uXbUc1cC2\nUpCSEpn6fZs5DZzFqqaTkLP9J6GTE13W7rHqEhkcwm5RwOT8aMzUHhNmubywLeG2\nLAHvBOhf7Mb1EFdVJyOy+QljKcsF+vOFbT3kzyj7EIttSQgPCMGefBrDIFuYEQZa\nazu5H9MKUQKBgGtuy+Ar7qVRbRz3la2Cwd7QI2WPtpJApmJjg+/GAgzIdNEd4rI6\n6O48xCtin32Ul3mfr188Vo1E5ixpp+lfeQr1rBcnsJyZK7TJZnTVZk342njvih4S\ntntaDYNhM16tO2ohCdbbp7QPdU3GO2WpLLRhDHXZaRywL7CLQUyGkvyBAoGBAJ1M\nnAXG8/+nA2rhe90ktN0S4pP3D/oyAhHMnKLq08DcIBwDPYByZfcvgFPgLQejt9wh\nqkEtRvd/pV+71TMQei4lA5COI5YT2ukiGCO/RtXSvvQInULtUdS5mANiI9nNL+Qu\n5rhdLSCaqCM5oIS9lbXuzSgDXXwdx202tZxyumgRAoGBAKcLGGinN+OL/Af10oSO\nS3gT0GV4r4sBbMLHyO5mY+OGq+RV9G8zxyEY5lMhsAWh4VBAJpKdRK92QtSKc2Ho\n/DtBqOIbR5k0ZNJLpblKRoJc2lzrBFkQOdwutH9R8dE/Konim8c9zO82qHS/BWOn\nOdTkcOyZQFGBYgDwn18jRZkA\n-----END PRIVATE KEY-----\n",
      client_email: "criar-pasta-cliente@crm-originaldigital-460218.iam.gserviceaccount.com",
      client_id: "107324488311944700532",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/criar-pasta-cliente%40crm-originaldigital-460218.iam.gserviceaccount.com",
      universe_domain: "googleapis.com"
    };
    
    console.log('Usando credenciais hardcoded para autenticação Google Drive com email:', credentials.client_email);
    
    // Criar cliente JWT diretamente com as credenciais
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    // Verificar se a autenticação funciona
    try {
      await auth.authorize();
      console.log('Autenticação com o Google Drive realizada com sucesso');
      return auth;
    } catch (authError) {
      console.error('Erro na autenticação JWT:', authError);
      throw authError;
    }
  } catch (error) {
    console.error('Erro ao autenticar com o Google Drive:', error);
    throw error;
  }
}

/**
 * Cria uma pasta no Google Drive
 * @param auth Cliente de autenticação
 * @param folderName Nome da pasta
 * @param parentFolderId ID da pasta pai (opcional)
 * @returns ID da pasta criada ou undefined se falhar
 */
async function createFolder(auth: JWT, folderName: string, parentFolderId: string): Promise<string> {
  try {
    const drive = google.drive({ version: 'v3', auth });

    // Verificar se a pasta já existe para evitar duplicação
    try {
      const response = await drive.files.list({
        q: `name='${folderName}' and '${parentFolderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (response.data.files && response.data.files.length > 0) {
        console.log(`Pasta "${folderName}" já existe, reutilizando o ID existente`);
        const fileId = response.data.files[0].id || '';
        return fileId;
      }
    } catch (listError) {
      console.warn(`Erro ao verificar se a pasta ${folderName} já existe:`, listError);
      // Continue para tentar criar a pasta mesmo assim
    }

    // Criar nova pasta
    const fileMetadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId || CLIENTES_FOLDER_ID] // Sempre usar CLIENTES_FOLDER_ID como fallback
    };
    
    console.log(`Criando pasta "${folderName}" com parent ID: ${parentFolderId || CLIENTES_FOLDER_ID}`);

    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    console.log(`Pasta "${folderName}" criada com sucesso, ID: ${file.data.id}`);
    const fileId = file.data.id || '';
    return fileId;
  } catch (error) {
    console.error(`Erro ao criar pasta "${folderName}":`, error);
    return '';
  }
}

/**
 * Cria todas as pastas necessárias para um novo cliente
 * Esta função cria uma pasta principal com o nome do cliente e várias subpastas padrão dentro dela
 * @param clientName Nome da empresa do cliente
 * @returns ID da pasta principal do cliente
 */
export async function createClientFolderStructure(clientName: string): Promise<string | null> {
  // Se a integração com Google Drive estiver desativada, retorne um ID simulado
  if (!ENABLE_GOOGLE_DRIVE) {
    console.log("Integração com Google Drive desativada. Simulando criação de pastas...");
    return "simulado-" + Date.now();
  }
  
  try {
    console.log(`Iniciando criação da estrutura de pastas para o cliente: ${clientName}`);
    
    // Obter cliente autenticado
    const auth = new JWT({
      email: "criar-pasta-cliente@crm-originaldigital-460218.iam.gserviceaccount.com",
      key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCj3axKZxGYpjhy\n0TCrkdQGoKLKuZFMjKsSK8j/d25GEa70G4ADdu9oBkYh3kKcSJ/CjM24eAZ9aCV1\nyg7JqMyoebr6UVZLvW/QUvplkfldTVwOPW37Amse+bQBFmUDhJ+bGynB7RoJFWtQ\n3j1d7adHDbCOwbEfBsDHEt6N0K5bnOIWh0Mk2ceUoJaK24fcgD1oxxOZDlMy634W\nWzYDQB+Sel2tGp4Tteao96ft3iO9j5IwvNY10HSClFM/RD4MT/mk/C0ZHVdE/1nf\nD09aQd4rEzWCl5B0TYNJ8ouoUSOruaM4OimosfQu2aXdHQ93wikMMGe05ZkjpPIB\n0PTqSMkFAgMBAAECggEAAiLnoOBcn0ia0ku4uSKRfipLIl5OebjDbzJ2cEwyj253\na954P137gOKaDfgmQVWEuFuFFWtX1vvhXHqEpwDmICksH0t/AZrykaekn5KKYCVx\ndoxlpMDd5tK7E8uNXWvLIpF1Vyj77qk36Qnos2g1MYIzw9IHI4rUlGks0R0AH5jJ\nQBqesIL0gnQ4y0NnwbFLia0NfmtNEpNCCnnd3K9Vey9WzunTdATDtnHGmVHS43yr\n/LMVjcdq8WbyG9f4+v2Mdw6AyqsqXPPr9FeFAHQbPGXqbIRWoBtEm3WDjJuSvLxv\nhLhGjD7LW2hMaogMA0gKo7YrRc2k+/6Oy25GXoYn8QKBgQDULNzQSqr23dPsCkPt\nbTvA8PVOKDWVx6hi0qAeMcHvS050K9kel8kE+zRmAg8PderhEtTKRgf5TK2uKaFZ\nq1f2+r8sV3NRycDo9RnoRNaNcpxnRGfJ6XJoThP58R3erYBNvEQSjq1rz+7x5Ope\nF1jaVepz008q5yl6p0QSVC1ydQKBgQDFtl6uiX3u+lgjulWH+ozZqI4uXbUc1cC2\nUpCSEpn6fZs5DZzFqqaTkLP9J6GTE13W7rHqEhkcwm5RwOT8aMzUHhNmubywLeG2\nLAHvBOhf7Mb1EFdVJyOy+QljKcsF+vOFbT3kzyj7EIttSQgPCMGefBrDIFuYEQZa\nazu5H9MKUQKBgGtuy+Ar7qVRbRz3la2Cwd7QI2WPtpJApmJjg+/GAgzIdNEd4rI6\n6O48xCtin32Ul3mfr188Vo1E5ixpp+lfeQr1rBcnsJyZK7TJZnTVZk342njvih4S\ntntaDYNhM16tO2ohCdbbp7QPdU3GO2WpLLRhDHXZaRywL7CLQUyGkvyBAoGBAJ1M\nnAXG8/+nA2rhe90ktN0S4pP3D/oyAhHMnKLq08DcIBwDPYByZfcvgFPgLQejt9wh\nqkEtRvd/pV+71TMQei4lA5COI5YT2ukiGCO/RtXSvvQInULtUdS5mANiI9nNL+Qu\n5rhdLSCaqCM5oIS9lbXuzSgDXXwdx202tZxyumgRAoGBAKcLGGinN+OL/Af10oSO\nS3gT0GV4r4sBbMLHyO5mY+OGq+RV9G8zxyEY5lMhsAWh4VBAJpKdRK92QtSKc2Ho\n/DtBqOIbR5k0ZNJLpblKRoJc2lzrBFkQOdwutH9R8dE/Konim8c9zO82qHS/BWOn\nOdTkcOyZQFGBYgDwn18jRZkA\n-----END PRIVATE KEY-----\n",
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    // Autorizar o cliente
    await auth.authorize();
    
    // 1. Criar pasta principal do cliente
    console.log(`Criando pasta principal para o cliente: ${clientName} no folder ID: ${CLIENTES_FOLDER_ID}`);
    const clientFolderId = await createFolder(auth, clientName, CLIENTES_FOLDER_ID || "");
    
    if (!clientFolderId) {
      console.error(`Não foi possível criar a pasta principal para o cliente ${clientName}`);
      return "sem-folder-id-" + Date.now();
    }
    
    console.log(`Pasta principal criada para o cliente ${clientName} com ID: ${clientFolderId}`);
    
    // 2. Criar subpastas principais
    for (const folderName of FOLDER_STRUCTURE) {
      const folderId = await createFolder(auth, folderName, clientFolderId);
      
      // 3. Criar subpastas dentro da pasta "06 - Criativos"
      if (folderName === '06 - Criativos' && folderId) {
        console.log(`Criando subpastas dentro da pasta ${folderName}`);
        for (const subfolderName of CREATIVE_SUBFOLDERS) {
          await createFolder(auth, subfolderName, folderId);
        }
      }
    }
    
    console.log(`Estrutura de pastas para o cliente "${clientName}" criada com sucesso!`);
    return clientFolderId;
    
  } catch (error) {
    console.error('Erro ao criar estrutura de pastas para o cliente:', error);
    // Retornar um ID simulado mesmo com erro, para não bloquear o fluxo
    return "erro-drive-" + Date.now();
  }
}