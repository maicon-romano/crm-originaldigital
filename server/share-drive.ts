import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

// Caminho para o arquivo de credenciais do Google Drive
const CREDENTIALS_PATH = path.join(process.cwd(), 'attached_assets/crm-originaldigital-460218-03c085ac30b8.json');

// Escopos de permissão para o Google Drive
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file'
];

/**
 * Obtém cliente JWT autenticado para operações com o Google Drive
 */
async function getJWTClient(): Promise<JWT> {
  try {
    // Verificar se o arquivo de credenciais existe
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`Arquivo de credenciais não encontrado: ${CREDENTIALS_PATH}`);
    }

    // Ler as credenciais do arquivo
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));

    // Criar e autorizar um cliente JWT
    const client = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: SCOPES,
    });

    // Autorizar o cliente
    await client.authorize();
    return client;
  } catch (error) {
    console.error('Erro ao obter cliente JWT para o Google Drive:', error);
    throw error;
  }
}

/**
 * Compartilha uma pasta do Google Drive com um usuário específico
 * @param folderId ID da pasta a ser compartilhada
 * @param email Email do usuário com quem compartilhar
 * @returns Promise com resultado do compartilhamento e URL da pasta
 */
export async function shareFolderWithUser(folderId: string, email: string): Promise<{success: boolean, folderUrl: string}> {
  try {
    // Obter cliente JWT autenticado
    const auth = await getJWTClient();
    
    // Criar cliente do Google Drive
    const drive = google.drive({ version: 'v3', auth });
    
    // Compartilhar a pasta com o usuário (permissão de leitura)
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'reader',
        type: 'user',
        emailAddress: email
      },
      fields: 'id',
    });
    
    // Obter a URL pública da pasta
    const folderUrl = getPublicFolderLink(folderId);
    
    return {
      success: true,
      folderUrl
    };
  } catch (error) {
    console.error('Erro ao compartilhar pasta com o usuário:', error);
    return {
      success: false,
      folderUrl: ''
    };
  }
}

/**
 * Obtém o link público para uma pasta do Google Drive
 * @param folderId ID da pasta
 * @returns Link público da pasta
 */
export function getPublicFolderLink(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}