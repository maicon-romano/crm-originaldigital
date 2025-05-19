import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FilesIcon, ExternalLink, FolderOpen, Shield, Lock } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import MainLayout from "@/components/layout/main-layout";

export default function FilesPage() {
  const { user, isLoading } = useAuth();
  const [folderUrl, setFolderUrl] = useState<string | null>(null);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.clientId) {
      loadFolderInfo();
    }
  }, [user]);

  const loadFolderInfo = async () => {
    if (!user || !user.clientId) return;

    setIsLoadingFolder(true);
    try {
      const response = await axios.get(`/api/clients/${user.clientId}/drive-folder`);
      if (response.data.success) {
        setFolderUrl(response.data.folderUrl);
      } else {
        toast({
          title: "Erro ao carregar pasta",
          description: response.data.message || "Não foi possível carregar as informações da pasta",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar pasta:", error);
      toast({
        title: "Erro ao carregar pasta",
        description: "Ocorreu um erro ao buscar informações da sua pasta de arquivos",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFolder(false);
    }
  };

  // Se o usuário não for cliente, mostrar mensagem diferente
  if (user && user.userType !== "client") {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 space-y-6">
          <h1 className="text-3xl font-bold">Arquivos</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Acessar Arquivos dos Clientes</CardTitle>
              <CardDescription>
                Como você não é um cliente, deve acessar os arquivos através do Google Drive ou solicitar acesso direto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Para acessar os arquivos de um cliente específico, vá para a página de detalhes do cliente e clique no botão "Acessar Arquivos".
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Se o usuário estiver carregando, mostrar loader
  if (isLoading || isLoadingFolder) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando seus arquivos...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">Seus Arquivos</h1>
        
        {folderUrl ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-6 w-6 text-primary" />
                Pasta Compartilhada no Google Drive
              </CardTitle>
              <CardDescription>
                Aqui você pode acessar e gerenciar todos os seus arquivos compartilhados conosco
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-start gap-4">
                  <Shield className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-medium mb-1">Acesso Seguro</h3>
                    <p className="text-muted-foreground mb-3">
                      Seus arquivos estão armazenados com segurança no Google Drive e somente você e nossa equipe temos acesso a eles.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4" /> 
                      Compartilhado exclusivamente com {user?.email}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <Button 
                size="lg"
                onClick={() => window.open(folderUrl, '_blank')}
                className="w-full sm:w-auto"
              >
                <FilesIcon className="mr-2 h-5 w-5" /> 
                Acessar Meus Arquivos
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pasta não encontrada</CardTitle>
              <CardDescription>
                Não localizamos uma pasta compartilhada para sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Não foi possível encontrar uma pasta do Google Drive associada à sua conta. 
                Entre em contato com nosso suporte para que possamos resolver este problema.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={loadFolderInfo}
                className="w-full sm:w-auto"
              >
                Tentar novamente
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}