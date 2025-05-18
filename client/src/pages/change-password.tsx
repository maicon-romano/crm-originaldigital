import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from '@/hooks/use-toast';

// Esquema de validação de senha
const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Senha atual é obrigatória" }),
  newPassword: z.string().min(8, { message: "Nova senha deve ter no mínimo 8 caracteres" })
    .regex(/[A-Z]/, { message: "Senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[a-z]/, { message: "Senha deve conter pelo menos uma letra minúscula" })
    .regex(/[0-9]/, { message: "Senha deve conter pelo menos um número" })
    .regex(/[^A-Za-z0-9]/, { message: "Senha deve conter pelo menos um caractere especial" }),
  confirmPassword: z.string().min(1, { message: "Confirmação de senha é obrigatória" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ChangePasswordPage() {
  const { user, precisa_redefinir_senha, updateUserAfterPasswordChange } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  
  // Formulário com validação
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    if (!auth.currentUser || !user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para alterar sua senha',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Reautenticar o usuário com a senha atual
      const credential = EmailAuthProvider.credential(
        user.email as string,
        data.currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Atualizar a senha
      await updatePassword(auth.currentUser, data.newPassword);
      
      // Se o usuário estava com flag de alteração obrigatória, atualizar no Firestore
      if (needsPasswordChange) {
        await updateUserAfterPasswordChange();
      }
      
      toast({
        title: 'Senha alterada com sucesso',
        description: 'Sua senha foi atualizada com sucesso.',
      });
      
      // Redirecionar para a página inicial após 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      
      let errorMessage = 'Ocorreu um erro ao alterar sua senha. Tente novamente.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha atual incorreta. Verifique e tente novamente.';
      }
      
      toast({
        title: 'Erro ao alterar senha',
        description: errorMessage,
        variant: 'destructive',
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Alteração de Senha</CardTitle>
          <CardDescription>
            {needsPasswordChange 
              ? 'Você precisa alterar sua senha para continuar usando o sistema.' 
              : 'Altere sua senha para manter sua conta segura.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Digite sua senha atual" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Digite sua nova senha" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirme sua nova senha" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">A senha deve conter:</p>
                <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
                  <li>Pelo menos 8 caracteres</li>
                  <li>Pelo menos uma letra maiúscula</li>
                  <li>Pelo menos uma letra minúscula</li>
                  <li>Pelo menos um número</li>
                  <li>Pelo menos um caractere especial</li>
                </ul>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          {!needsPasswordChange && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}