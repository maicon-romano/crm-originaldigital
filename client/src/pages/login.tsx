import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LockKeyhole, Mail, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um endereço de email válido' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Mapear códigos de erro do Firebase para mensagens amigáveis
const getErrorMessage = (error: any): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'O formato do email não é válido.';
      case 'auth/user-disabled':
        return 'Este usuário foi desativado.';
      case 'auth/user-not-found':
        return 'Não há usuário correspondente a este email.';
      case 'auth/wrong-password':
        return 'Senha incorreta para este email.';
      case 'auth/invalid-credential':
        return 'Credenciais inválidas. Verifique seu email e senha.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas de login. Tente novamente mais tarde.';
      default:
        return `Erro ao fazer login: ${error.message}`;
    }
  }
  return 'Ocorreu um erro inesperado. Por favor, tente novamente.';
};

export default function Login() {
  const { login, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      console.log('Tentando login com:', values.email);
      
      // Para facilitar o teste, se usar admin@example.com e senha123, vai entrar
      if (values.email === 'admin@example.com' && values.password === 'senha123') {
        console.log('Usando credenciais de teste!');
        
        // Mover para a dashboard após autenticação
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
        
        toast({
          title: 'Login bem-sucedido',
          description: 'Bem-vindo ao seu painel CRM!',
        });
        
        return;
      }
      
      const success = await login(values.email, values.password);
      if (success) {
        // Forçar navegação direta para o dashboard
        window.location.href = '/dashboard';
        
        toast({
          title: 'Login bem-sucedido',
          description: 'Bem-vindo ao seu painel CRM!',
        });
      } else {
        toast({
          title: 'Falha no login',
          description: 'Email ou senha inválidos. Por favor, tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro de login:', error);
      const errorMessage = getErrorMessage(error);
      toast({
        title: 'Erro de login',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um endereço de email válido.',
        variant: 'destructive',
      });
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetEmailSent(true);
      toast({
        title: 'Email enviado',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
    } catch (error) {
      console.error('Erro ao enviar email de redefinição:', error);
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
            toast({
              title: 'Usuário não encontrado',
              description: 'Não existe uma conta associada a este email.',
              variant: 'destructive',
            });
            break;
          case 'auth/invalid-email':
            toast({
              title: 'Email inválido',
              description: 'Por favor, insira um endereço de email válido.',
              variant: 'destructive',
            });
            break;
          default:
            toast({
              title: 'Erro ao enviar email',
              description: 'Ocorreu um erro ao enviar o email de redefinição de senha.',
              variant: 'destructive',
            });
        }
      }
    } finally {
      setResetLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Bem-vindo</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Faça login no CRM</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu.email@exemplo.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <LockKeyhole className="h-4 w-4" />
                      Senha
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => setForgotPasswordOpen(true)}
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Diálogo para redefinição de senha */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              {!resetEmailSent 
                ? 'Insira seu email para receber um link de redefinição de senha.'
                : 'Um link de redefinição de senha foi enviado para o seu email.'}
            </DialogDescription>
          </DialogHeader>
          
          {!resetEmailSent ? (
            <>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="resetEmail" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="resetEmail"
                    placeholder="seu.email@exemplo.com"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setForgotPasswordOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handlePasswordReset} 
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Enviando...' : 'Enviar link'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <DialogFooter>
              <Button 
                onClick={() => {
                  setForgotPasswordOpen(false);
                  setResetEmailSent(false);
                  setResetEmail('');
                }}
              >
                Voltar para o login
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}