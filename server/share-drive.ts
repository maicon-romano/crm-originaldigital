import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Níveis de acesso para compartilhamento de pastas no Google Drive
const DRIVE_PERMISSION_ROLES = {
  READER: 'reader',       // Somente leitura
  COMMENTER: 'commenter', // Leitura e comentários
  WRITER: 'writer'        // Leitura, comentários e edição
};

/**
 * Compartilha uma pasta do Google Drive com um usuário específico
 * @param folderId ID da pasta a ser compartilhada
 * @param email Email do usuário com quem compartilhar
 * @returns Promise com resultado do compartilhamento e URL da pasta
 */
export async function shareFolderWithUser(folderId: string, email: string): Promise<{success: boolean, folderUrl: string}> {
  try {
    // Obter cliente autenticado
    const auth = new JWT({
      email: "criar-pasta-cliente@crm-originaldigital-460218.iam.gserviceaccount.com",
      key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCj3axKZxGYpjhy\n0TCrkdQGoKLKuZFMjKsSK8j/d25GEa70G4ADdu9oBkYh3kKcSJ/CjM24eAZ9aCV1\nyg7JqMyoebr6UVZLvW/QUvplkfldTVwOPW37Amse+bQBFmUDhJ+bGynB7RoJFWtQ\n3j1d7adHDbCOwbEfBsDHEt6N0K5bnOIWh0Mk2ceUoJaK24fcgD1oxxOZDlMy634W\nWzYDQB+Sel2tGp4Tteao96ft3iO9j5IwvNY10HSClFM/RD4MT/mk/C0ZHVdE/1nf\nD09aQd4rEzWCl5B0TYNJ8ouoUSOruaM4OimosfQu2aXdHQ93wikMMGe05ZkjpPIB\n0PTqSMkFAgMBAAECggEAAiLnoOBcn0ia0ku4uSKRfipLIl5OebjDbzJ2cEwyj253\na954P137gOKaDfgmQVWEuFuFFWtX1vvhXHqEpwDmICksH0t/AZrykaekn5KKYCVx\ndoxlpMDd5tK7E8uNXWvLIpF1Vyj77qk36Qnos2g1MYIzw9IHI4rUlGks0R0AH5jJ\nQBqesIL0gnQ4y0NnwbFLia0NfmtNEpNCCnnd3K9Vey9WzunTdATDtnHGmVHS43yr\n/LMVjcdq8WbyG9f4+v2Mdw6AyqsqXPPr9FeFAHQbPGXqbIRWoBtEm3WDjJuSvLxv\nhLhGjD7LW2hMaogMA0gKo7YrRc2k+/6Oy25GXoYn8QKBgQDULNzQSqr23dPsCkPt\nbTvA8PVOKDWVx6hi0qAeMcHvS050K9kel8kE+zRmAg8PderhEtTKRgf5TK2uKaFZ\nq1f2+r8sV3NRycDo9RnoRNaNcpxnRGfJ6XJoThP58R3erYBNvEQSjq1rz+7x5Ope\nF1jaVepz008q5yl6p0QSVC1ydQKBgQDFtl6uiX3u+lgjulWH+ozZqI4uXbUc1cC2\nUpCSEpn6fZs5DZzFqqaTkLP9J6GTE13W7rHqEhkcwm5RwOT8aMzUHhNmubywLeG2\nLAHvBOhf7Mb1EFdVJyOy+QljKcsF+vOFbT3kzyj7EIttSQgPCMGefBrDIFuYEQZa\nazu5H9MKUQKBgGtuy+Ar7qVRbRz3la2Cwd7QI2WPtpJApmJjg+/GAgzIdNEd4rI6\n6O48xCtin32Ul3mfr188Vo1E5ixpp+lfeQr1rBcnsJyZK7TJZnTVZk342njvih4S\ntntaDYNhM16tO2ohCdbbp7QPdU3GO2WpLLRhDHXZaRywL7CLQUyGkvyBAoGBAJ1M\nnAXG8/+nA2rhe90ktN0S4pP3D/oyAhHMnKLq08DcIBwDPYByZfcvgFPgLQejt9wh\nqkEtRvd/pV+71TMQei4lA5COI5YT2ukiGCO/RtXSvvQInULtUdS5mANiI9nNL+Qu\n5rhdLSCaqCM5oIS9lbXuzSgDXXwdx202tZxyumgRAoGBAKcLGGinN+OL/Af10oSO\nS3gT0GV4r4sBbMLHyO5mY+OGq+RV9G8zxyEY5lMhsAWh4VBAJpKdRK92QtSKc2Ho\n/DtBqOIbR5k0ZNJLpblKRoJc2lzrBFkQOdwutH9R8dE/Konim8c9zO82qHS/BWOn\nOdTkcOyZQFGBYgDwn18jRZkA\n-----END PRIVATE KEY-----\n",
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    // Autorizar o cliente
    await auth.authorize();
    
    // Compartilhar a pasta com o usuário
    const drive = google.drive({ version: 'v3', auth });
    console.log(`Compartilhando pasta ${folderId} com o email ${email}`);
    
    const permissionMetadata = {
      type: 'user',
      role: DRIVE_PERMISSION_ROLES.WRITER, // Permissão de edição para o cliente
      emailAddress: email
    };
    
    const response = await drive.permissions.create({
      fileId: folderId,
      requestBody: permissionMetadata,
      fields: 'id',
      sendNotificationEmail: true,
      emailMessage: 'Você recebeu acesso aos seus arquivos no CRM da Original Digital. Acesse o menu "Arquivos" no nosso sistema para visualizar e gerenciar seus documentos.'
    });
    
    console.log(`Pasta compartilhada com sucesso com ${email}, permissionId: ${response.data.id}`);
    
    // Gerar URL da pasta para o usuário acessar
    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
    
    return {
      success: true,
      folderUrl
    };
  } catch (error) {
    console.error(`Erro ao compartilhar pasta ${folderId} com ${email}:`, error);
    
    // Retornar falha, mas ainda gerar uma URL que pode funcionar se a pasta existir
    return {
      success: false,
      folderUrl: `https://drive.google.com/drive/folders/${folderId}`
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
