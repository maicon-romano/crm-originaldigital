import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Loader2, FolderOpen, FileIcon, ExternalLink } from 'lucide-react';

// Tipo para clientes com pastas do Google Drive
interface ClientWithDrive {
  id: number;
  companyName: string;
  googleDriveFolderId?: string;
  googleDriveFolderUrl?: string;
}

export default function FilesPage() {
  const { user, isStaff, isAdmin, isClient } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Estado para armazenar o URL da pasta quando o botão é clicado
  const [selectedFolderUrl, setSelectedFolderUrl] = useState<string | null>(null);

  // Buscar clientes que têm pasta no Google Drive
  const { data: clients, isLoading: isLoadingClients } = useQuery<ClientWithDrive[]>({
    queryKey: ['/api/clients'],
    enabled: !isClient, // Apenas carregar se não for um cliente
  });

  // Para usuários do tipo cliente, buscar apenas sua própria pasta
  const { data: clientData, isLoading: isLoadingClientData } = useQuery<{success: boolean, folderUrl: string}>({
    queryKey: ['/api/clients', user?.clientId, 'drive-folder'],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${user?.clientId}/drive-folder`);
      if (!response.ok) {
        throw new Error('Falha ao buscar pasta do cliente');
      }
      return response.json();
    },
    enabled: !!isClient && !!user?.clientId, // Só carregar se for cliente e tiver clientId
  });

  // Função para abrir a pasta do cliente
  const openFolder = async (clientId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clients/${clientId}/drive-folder`);
      
      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || 'Falha ao acessar a pasta',
          variant: "destructive"
        });
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.folderUrl) {
        // Abrir em uma nova aba
        window.open(data.folderUrl, '_blank');
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível obter o link da pasta",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao acessar a pasta do Google Drive",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Se for um cliente, mostrar apenas sua pasta
  if (isClient) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">Seus Arquivos</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Acesso aos Arquivos</CardTitle>
            <CardDescription>
              Acesse os arquivos compartilhados com você no Google Drive
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoadingClientData ? (
              <div className="flex justify-center p-6">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : clientData?.success ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium">Sua Pasta de Arquivos</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Clique no botão ao lado para acessar seus arquivos
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => window.open(clientData.folderUrl, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir Pasta
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                <p className="text-amber-700 dark:text-amber-400">
                  Não há pasta de arquivos configurada para sua conta.
                  Entre em contato com o suporte para mais informações.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Para administradores e staff, mostrar todas as pastas de clientes
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Gerenciamento de Arquivos</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Pastas de Clientes</CardTitle>
          <CardDescription>
            Acesse as pastas do Google Drive de cada cliente
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoadingClients ? (
            <div className="flex justify-center p-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : clients && clients.length > 0 ? (
            <Table>
              <TableCaption>Lista de pastas de clientes disponíveis</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.companyName}</TableCell>
                    <TableCell className="text-right">
                      {client.googleDriveFolderId ? (
                        <Button
                          variant="outline"
                          onClick={() => openFolder(client.id.toString())}
                          disabled={isLoading}
                          className="gap-2"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FolderOpen className="h-4 w-4" />
                          )}
                          Abrir Pasta
                        </Button>
                      ) : (
                        <Button variant="outline" disabled className="opacity-50">
                          Sem Pasta
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-gray-600 dark:text-gray-400">
                Não há clientes com pastas configuradas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}