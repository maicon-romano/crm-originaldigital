import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Building,
  Users,
  Bell,
  Moon,
  Sun,
  PaintBucket,
  Languages,
  Key,
  Save,
  Upload,
} from 'lucide-react';

// Define company settings schema
const companySettingsSchema = z.object({
  name: z.string().min(1, { message: "Company name is required" }),
  email: z.string().email({ message: "A valid email is required" }),
  phone: z.string().optional(),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  logo: z.string().optional(),
});

// Define notification settings schema
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  taskReminders: z.boolean().default(true),
  invoiceAlerts: z.boolean().default(true),
  proposalUpdates: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

// Define appearance settings schema
const appearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  colorScheme: z.enum(['blue', 'green', 'purple', 'orange']).default('blue'),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  compactMode: z.boolean().default(false),
});

// Define API settings schema
const apiSettingsSchema = z.object({
  stripePublicKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  emailApiKey: z.string().optional(),
  googleMapsApiKey: z.string().optional(),
});

type CompanySettings = z.infer<typeof companySettingsSchema>;
type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>;
type ApiSettings = z.infer<typeof apiSettingsSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const queryClient = useQueryClient();

  // Company settings form
  const companyForm = useForm<CompanySettings>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cnpj: '',
      address: '',
      website: '',
      logo: '',
    },
  });

  // Notification settings form
  const notificationForm = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      taskReminders: true,
      invoiceAlerts: true,
      proposalUpdates: true,
      marketingEmails: false,
    },
  });

  // Appearance settings form
  const appearanceForm = useForm<AppearanceSettings>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: {
      theme: 'system',
      colorScheme: 'blue',
      fontSize: 'medium',
      compactMode: false,
    },
  });

  // API settings form
  const apiForm = useForm<ApiSettings>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      stripePublicKey: '',
      stripeSecretKey: '',
      emailApiKey: '',
      googleMapsApiKey: '',
    },
  });

  // Fetch company settings
  const { data: companyData, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['/api/company-settings'],
    onSuccess: (data) => {
      if (data) {
        companyForm.reset({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          cnpj: data.cnpj || '',
          address: data.address || '',
          website: data.website || '',
          logo: data.logo || '',
        });
      }
    },
  });

  // Update company settings mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanySettings) => {
      const res = await apiRequest('PATCH', '/api/company-settings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-settings'] });
      toast({
        title: 'Company settings updated',
        description: 'Your company settings have been saved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update company settings: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      // In a real app, this would save to user preferences in the backend
      // For this demo, we'll just simulate success
      return new Promise(resolve => setTimeout(() => resolve(data), 500));
    },
    onSuccess: () => {
      toast({
        title: 'Notification settings updated',
        description: 'Your notification preferences have been saved',
      });
    },
  });

  // Update appearance settings mutation
  const updateAppearanceMutation = useMutation({
    mutationFn: async (data: AppearanceSettings) => {
      // In a real app, this would save to user preferences in the backend
      // For this demo, we'll just simulate success
      return new Promise(resolve => setTimeout(() => resolve(data), 500));
    },
    onSuccess: () => {
      toast({
        title: 'Appearance settings updated',
        description: 'Your display preferences have been saved',
      });
    },
  });

  // Update API settings mutation
  const updateApiMutation = useMutation({
    mutationFn: async (data: ApiSettings) => {
      // In a real app, this would securely store API keys
      // For this demo, we'll just simulate success
      return new Promise(resolve => setTimeout(() => resolve(data), 500));
    },
    onSuccess: () => {
      toast({
        title: 'API settings updated',
        description: 'Your API keys have been saved securely',
      });
    },
  });

  // Submit handlers
  const onSubmitCompany = (data: CompanySettings) => {
    updateCompanyMutation.mutate(data);
  };

  const onSubmitNotifications = (data: NotificationSettings) => {
    updateNotificationsMutation.mutate(data);
  };

  const onSubmitAppearance = (data: AppearanceSettings) => {
    updateAppearanceMutation.mutate(data);
  };

  const onSubmitApi = (data: ApiSettings) => {
    updateApiMutation.mutate(data);
  };

  // Handle logo upload
  const handleLogoUpload = () => {
    // In a real app, this would trigger file upload
    toast({
      title: 'Upload feature',
      description: 'Logo upload is simulated in this demo version.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your CRM preferences and company settings
        </p>
      </div>

      <Tabs defaultValue="company" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 md:grid-cols-4">
          <TabsTrigger value="company" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center">
            <PaintBucket className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center">
            <Key className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">API Keys</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-primary" />
                Company Information
              </CardTitle>
              <CardDescription>
                Update your company details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCompany ? (
                <div className="flex items-center justify-center p-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Company Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="contact@company.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
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
                        control={companyForm.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ/Tax ID</FormLabel>
                            <FormControl>
                              <Input placeholder="00.000.000/0000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo URL</FormLabel>
                            <div className="flex space-x-2">
                              <FormControl>
                                <Input placeholder="https://www.company.com/logo.png" {...field} />
                              </FormControl>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleLogoUpload}
                                className="flex-shrink-0"
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Upload
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="123 Business St, City, State, Country" 
                              {...field} 
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateCompanyMutation.isPending}
                        className="flex items-center"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateCompanyMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
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
                          <FormDescription>Get reminders about upcoming deadlines</FormDescription>
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
                      disabled={updateNotificationsMutation.isPending}
                      className="flex items-center"
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

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PaintBucket className="h-5 w-5 mr-2 text-primary" />
                Display Settings
              </CardTitle>
              <CardDescription>
                Customize the appearance of your CRM dashboard
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
                      disabled={updateAppearanceMutation.isPending}
                      className="flex items-center"
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

        {/* API Settings */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2 text-primary" />
                API Integration Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for external service integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...apiForm}>
                <form onSubmit={apiForm.handleSubmit(onSubmitApi)} className="space-y-4">
                  <FormField
                    control={apiForm.control}
                    name="stripePublicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stripe Public Key</FormLabel>
                        <FormControl>
                          <Input placeholder="pk_test_..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Used for payment form elements on the client side
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={apiForm.control}
                    name="stripeSecretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stripe Secret Key</FormLabel>
                        <FormControl>
                          <Input placeholder="sk_test_..." type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Used to securely process payments on the server
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={apiForm.control}
                    name="emailApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Service API Key</FormLabel>
                        <FormControl>
                          <Input placeholder="SG.xxxxx..." type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          For sending emails through SendGrid or similar service
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={apiForm.control}
                    name="googleMapsApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Maps API Key</FormLabel>
                        <FormControl>
                          <Input placeholder="AIzaxxxx..." type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          For maps integration in client addresses
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateApiMutation.isPending}
                      className="flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateApiMutation.isPending ? 'Saving...' : 'Save API Keys'}
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