import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Bell,
  Save,
  Moon,
  Sun,
  PaintBucket,
} from 'lucide-react';

// Define profile schema
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  phone: z.string().optional(),
  position: z.string().optional(),
  bio: z.string().optional(),
});

// Define password schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Define notification schema
const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  taskReminders: z.boolean().default(true),
  invoiceAlerts: z.boolean().default(true),
  proposalUpdates: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

// Define appearance schema
const appearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  colorScheme: z.enum(['blue', 'green', 'purple', 'orange']).default('blue'),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  compactMode: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type NotificationFormValues = z.infer<typeof notificationSchema>;
type AppearanceFormValues = z.infer<typeof appearanceSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      position: '',
      bio: '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      taskReminders: true,
      invoiceAlerts: true,
      proposalUpdates: true,
      marketingEmails: false,
    },
  });

  // Appearance form
  const appearanceForm = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: 'system',
      colorScheme: 'blue',
      fontSize: 'medium',
      compactMode: false,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // This would be a call to update the user's profile in a real app
      // For this demo, we'll just simulate a successful update
      return new Promise(resolve => setTimeout(() => resolve(data), 500));
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update profile: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      // This would be a call to change the password in a real app
      // For this demo, we'll just simulate a successful update
      return new Promise(resolve => setTimeout(() => resolve(data), 500));
    },
    onSuccess: () => {
      passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to change password: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      // This would be a call to update notification preferences in a real app
      // For this demo, we'll just simulate a successful update
      return new Promise(resolve => setTimeout(() => resolve(data), 500));
    },
    onSuccess: () => {
      toast({
        title: 'Notification settings updated',
        description: 'Your notification preferences have been saved',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update notification settings: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Update appearance settings mutation
  const updateAppearanceMutation = useMutation({
    mutationFn: async (data: AppearanceFormValues) => {
      // This would be a call to update appearance settings in a real app
      // For this demo, we'll just simulate a successful update
      return new Promise(resolve => setTimeout(() => resolve(data), 500));
    },
    onSuccess: () => {
      toast({
        title: 'Appearance settings updated',
        description: 'Your display preferences have been saved',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update appearance settings: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Form submit handlers
  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  const onSubmitNotifications = (data: NotificationFormValues) => {
    updateNotificationsMutation.mutate(data);
  };

  const onSubmitAppearance = (data: AppearanceFormValues) => {
    updateAppearanceMutation.mutate(data);
  };

  // Handle avatar upload
  const handleAvatarUpload = () => {
    // In a real app, this would open a file dialog
    // For this demo, we'll just simulate with a placeholder image
    setAvatarPreview('https://randomuser.me/api/portraits/men/32.jpg');
    
    toast({
      title: 'Avatar updated',
      description: 'Your profile picture has been updated',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">My Profile</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 md:grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Lock className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center">
            <PaintBucket className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and public profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 mb-6">
                <div className="flex flex-col items-center space-y-3">
                  <div className="h-32 w-32 rounded-full border-2 border-primary/50 flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Profile avatar" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAvatarUpload}
                    className="flex items-center"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Picture
                  </Button>
                </div>

                <div className="flex-1">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="your.email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position / Title</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Project Manager" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="A brief description about yourself" 
                                rows={4} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="flex items-center"
                          disabled={updateProfileMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to maintain security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your current password" 
                            type="password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your new password" 
                              type="password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            At least 6 characters with a mix of letters, numbers & symbols
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Confirm your new password" 
                              type="password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="flex items-center"
                      disabled={updatePasswordMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Control which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-4">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                        <div>
                          <FormLabel>Email Notifications</FormLabel>
                          <FormDescription>Receive notifications via email</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="taskReminders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                        <div>
                          <FormLabel>Task Reminders</FormLabel>
                          <FormDescription>Get reminders about upcoming tasks</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="invoiceAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                        <div>
                          <FormLabel>Invoice Alerts</FormLabel>
                          <FormDescription>Notifications about invoice status changes</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="proposalUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                        <div>
                          <FormLabel>Proposal Updates</FormLabel>
                          <FormDescription>Get notified when proposals are updated</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                        <div>
                          <FormLabel>Marketing Emails</FormLabel>
                          <FormDescription>Receive newsletters and feature updates</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="flex items-center"
                      disabled={updateNotificationsMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateNotificationsMutation.isPending ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PaintBucket className="h-5 w-5 mr-2 text-primary" />
                Display Settings
              </CardTitle>
              <CardDescription>
                Customize the appearance of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...appearanceForm}>
                <form onSubmit={appearanceForm.handleSubmit(onSubmitAppearance)} className="space-y-6">
                  <FormField
                    control={appearanceForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme</FormLabel>
                        <div className="grid grid-cols-3 gap-4 pt-2">
                          <div 
                            className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${field.value === 'light' ? 'border-primary bg-primary/10' : ''}`}
                            onClick={() => field.onChange('light')}
                          >
                            <Sun className="h-10 w-10 mb-2 text-yellow-500" />
                            <span>Light</span>
                          </div>
                          <div 
                            className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${field.value === 'dark' ? 'border-primary bg-primary/10' : ''}`}
                            onClick={() => field.onChange('dark')}
                          >
                            <Moon className="h-10 w-10 mb-2 text-indigo-500" />
                            <span>Dark</span>
                          </div>
                          <div 
                            className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${field.value === 'system' ? 'border-primary bg-primary/10' : ''}`}
                            onClick={() => field.onChange('system')}
                          >
                            <div className="flex h-10 mb-2">
                              <Sun className="h-10 w-5 text-yellow-500" />
                              <Moon className="h-10 w-5 text-indigo-500" />
                            </div>
                            <span>System</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appearanceForm.control}
                    name="colorScheme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Scheme</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select color scheme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="purple">Purple</SelectItem>
                            <SelectItem value="orange">Orange</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appearanceForm.control}
                    name="fontSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Font Size</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select font size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appearanceForm.control}
                    name="compactMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                        <div>
                          <FormLabel>Compact Mode</FormLabel>
                          <FormDescription>Reduce spacing for more content</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="flex items-center"
                      disabled={updateAppearanceMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateAppearanceMutation.isPending ? 'Saving...' : 'Save Appearance'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}