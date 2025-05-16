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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Copy } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um endereço de email válido' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, demoCredentials } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const fillDemoCredentials = () => {
    form.setValue('email', demoCredentials.email);
    form.setValue('password', demoCredentials.password);
  };

  const copyCredentials = () => {
    const text = `Email: ${demoCredentials.email}\nSenha: ${demoCredentials.password}`;
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Credenciais copiadas',
        description: 'As credenciais de demonstração foram copiadas para a área de transferência',
      });
    });
  };

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (success) {
        navigate('/dashboard');
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
      toast({
        title: 'Erro de login',
        description: 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Bem-vindo</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Faça login na sua conta CRM</p>
        </div>

        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
            Credenciais de demonstração
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full" 
              onClick={copyCredentials}
              title="Copiar credenciais"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span className="font-medium">Email:</span>
              <span>{demoCredentials.email}</span>
              <span className="font-medium">Senha:</span>
              <span>{demoCredentials.password}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full bg-white dark:bg-gray-800 text-blue-600 border-blue-300 hover:bg-blue-50"
              onClick={fillDemoCredentials}
            >
              Preencher automaticamente
            </Button>
          </AlertDescription>
        </Alert>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm cursor-pointer">Lembrar-me</FormLabel>
                    </FormItem>
                  )}
                />

                <a
                  href="#"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    toast({
                      title: 'Redefinição de senha',
                      description: 'A funcionalidade de redefinição de senha é simulada nesta demonstração.',
                    });
                  }}
                >
                  Esqueceu sua senha?
                </a>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Não tem uma conta?{' '}
                  <a
                    href="/register"
                    className="font-medium text-primary hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/register');
                    }}
                  >
                    Registre-se
                  </a>
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}