import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ID da pasta principal "Clientes" no Google Drive
const CLIENTES_FOLDER_ID = '18abqgDcOAkIzp79CYO9EpH2RrgluPnBI';

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
    // Usar diretamente o arquivo de credenciais JSON
    const keyFilePath = path.resolve(__dirname, '../attached_assets/crm-originaldigital-460218-03c085ac30b8.json');
    
    if (!fs.existsSync(keyFilePath)) {
      console.error('Arquivo de credenciais Google Drive não encontrado:', keyFilePath);
      throw new Error('Arquivo de credenciais do Google Drive não encontrado');
    }
    
    console.log('Usando arquivo de credenciais JSON para autenticação Google Drive:', keyFilePath);
    
    // Criar cliente JWT com o arquivo de credenciais
    const auth = new JWT({
      keyFile: keyFilePath,
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
async function createFolder(auth: JWT, folderName: string, parentFolderId?: string): Promise<string | undefined> {
  try {
    const drive = google.drive({ version: 'v3', auth });

    // Verificar se a pasta já existe para evitar duplicação
    if (parentFolderId) {
      const response = await drive.files.list({
        q: `name='${folderName}' and '${parentFolderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (response.data.files && response.data.files.length > 0) {
        console.log(`Pasta "${folderName}" já existe, reutilizando o ID existente`);
        return response.data.files[0].id;
      }
    }

    // Criar nova pasta
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    console.log(`Pasta "${folderName}" criada com sucesso, ID: ${file.data.id}`);
    return file.data.id;
  } catch (error) {
    console.error(`Erro ao criar pasta "${folderName}":`, error);
    throw error;
  }
}

/**
 * Cria todas as pastas necessárias para um novo cliente
 * @param clientName Nome da empresa do cliente
 * @returns ID da pasta principal do cliente
 */
export async function createClientFolderStructure(clientName: string): Promise<string | null> {
  try {
    console.log(`Iniciando criação da estrutura de pastas para o cliente: ${clientName}`);
    
    // Obter cliente autenticado
    const auth = await getAuthClient();
    
    // 1. Criar pasta principal do cliente
    const clientFolderId = await createFolder(auth, clientName, CLIENTES_FOLDER_ID || "");
    
    if (!clientFolderId) {
      console.error(`Não foi possível criar a pasta principal para o cliente ${clientName}`);
      return null;
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
    return null;
  }
}