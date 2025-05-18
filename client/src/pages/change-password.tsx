import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Eye, EyeOff, Check, X } from 'lucide-react';

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
  
  // Estados para controlar a visibilidade das senhas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados para validação de requisitos de senha
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    matches: false
  });
  
  // Formulário com validação
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // Adiciona efeito para monitorar as mudanças nos campos de senha
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'newPassword' || name === 'confirmPassword' || !name) {
        const newPassword = value.newPassword || '';
        const confirmPassword = value.confirmPassword || '';
        
        setPasswordRequirements({
          minLength: newPassword.length >= 8,
          hasUppercase: /[A-Z]/.test(newPassword),
          hasLowercase: /[a-z]/.test(newPassword),
          hasNumber: /[0-9]/.test(newPassword),
          hasSpecialChar: /[^A-Za-z0-9]/.test(newPassword),
          matches: newPassword === confirmPassword && 
                  newPassword.length > 0 && 
                  confirmPassword.length > 0
        });
      }
    });
    
    // Limpeza da assinatura quando o componente desmontar
    return () => subscription.unsubscribe();
  }, [form]);

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
      if (precisa_redefinir_senha) {
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
            {precisa_redefinir_senha 
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
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showCurrentPassword ? "text" : "password"} 
                          placeholder="Digite sua senha atual" 
                          {...field} 
                        />
                      </FormControl>
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
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
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showNewPassword ? "text" : "password"} 
                          placeholder="Digite sua nova senha" 
                          {...field} 
                        />
                      </FormControl>
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
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
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="Confirme sua nova senha" 
                          {...field} 
                        />
                      </FormControl>
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="mt-4 mb-4">
                <p className="text-sm font-medium mb-2">Requisitos de senha:</p>
                <ul className="space-y-2">
                  <li className={`text-xs flex items-center ${passwordRequirements.minLength ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordRequirements.minLength ? <Check size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
                    Pelo menos 8 caracteres
                  </li>
                  <li className={`text-xs flex items-center ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordRequirements.hasUppercase ? <Check size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
                    Pelo menos uma letra maiúscula
                  </li>
                  <li className={`text-xs flex items-center ${passwordRequirements.hasLowercase ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordRequirements.hasLowercase ? <Check size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
                    Pelo menos uma letra minúscula
                  </li>
                  <li className={`text-xs flex items-center ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordRequirements.hasNumber ? <Check size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
                    Pelo menos um número
                  </li>
                  <li className={`text-xs flex items-center ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordRequirements.hasSpecialChar ? <Check size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
                    Pelo menos um caractere especial
                  </li>
                  <li className={`text-xs flex items-center ${passwordRequirements.matches ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordRequirements.matches ? <Check size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
                    As senhas coincidem
                  </li>
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
          {!precisa_redefinir_senha && (
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