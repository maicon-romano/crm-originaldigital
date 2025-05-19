import { Express, Request, Response } from 'express';
import { storage } from './storage';
import { getPublicFolderLink } from './share-drive';
import { getFirestoreClientById, updateFirestoreClient } from './firebase-admin';

/**
 * Registra as rotas relacionadas ao Google Drive no aplicativo Express
 */
export function registerDriveRoutes(app: Express): void {
  /**
   * Rota para acessar a pasta do Google Drive de um cliente
   */
  app.get('/api/clients/:id/drive-folder', async (req: Request, res: Response) => {
    try {
      const clientId = req.params.id;
      
      if (!clientId) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID de cliente inválido' 
        });
      }
      
      // Buscar o cliente diretamente do Firestore usando a ID de string
      const client = await getFirestoreClientById(clientId);
      
      if (!client) {
        return res.status(404).json({ 
          success: false, 
          message: 'Cliente não encontrado' 
        });
      }
      
      // Verificar se o cliente tem uma pasta no Google Drive
      if (!client.googleDriveFolderId) {
        return res.status(404).json({ 
          success: false, 
          message: 'Este cliente não possui pasta no Google Drive' 
        });
      }
      
      // Obter o link da pasta
      if (client.googleDriveFolderUrl) {
        return res.json({
          success: true,
          folderUrl: client.googleDriveFolderUrl
        });
      } else {
        // Se não tiver o URL armazenado, criar um com o ID
        const folderUrl = getPublicFolderLink(client.googleDriveFolderId);
        
        // Atualizar o cliente com a URL para uso futuro
        await updateFirestoreClient(clientId, { googleDriveFolderUrl: folderUrl });
        
        return res.json({
          success: true,
          folderUrl
        });
      }
    } catch (error) {
      console.error('Erro ao recuperar pasta do cliente:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao recuperar pasta do cliente' 
      });
    }
  });
}