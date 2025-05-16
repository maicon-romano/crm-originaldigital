import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, subMonths } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/dashboard/stat-card';
import ActivityItem from '@/components/dashboard/activity-item';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardData {
  counts: {
    clients: number;
    tasksToday: number;
    openInvoices: number;
    openInvoicesValue: number;
    proposalsSent: number;
    proposalsAccepted: number;
  };
  taskStatusCounts: {
    backlog: number;
    inProgress: number;
    testing: number;
    completed: number;
  };
  monthlyRevenue: number[];
  recentActivities: {
    type: string;
    task?: any;
    proposal?: any;
    client?: any;
    invoice?: any;
    date: string;
  }[];
}

export function Dashboard() {
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | 'custom'>('7days');
  const [customDateRange, setCustomDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <h3 className="text-lg font-semibold">Error loading dashboard data</h3>
        <p>Please try refreshing the page</p>
      </div>
    );
  }

  // Prepare chart data
  const taskStatusData = [
    { name: 'Backlog', value: data.taskStatusCounts.backlog },
    { name: 'In Progress', value: data.taskStatusCounts.inProgress },
    { name: 'Testing', value: data.taskStatusCounts.testing },
    { name: 'Completed', value: data.taskStatusCounts.completed },
  ];

  const revenueChartData = data.monthlyRevenue.map((value, index) => {
    // Calculate month labels for the last 6 months
    const monthDate = subMonths(new Date(), 5 - index);
    return {
      month: format(monthDate, 'MMM'),
      revenue: value,
    };
  });

  const COLORS = ['#9CA3AF', '#60A5FA', '#A78BFA', '#34D399'];

  // Transform recent activities for display
  const getActivityTitle = (activity: any) => {
    switch (activity.type) {
      case 'task_completed':
        return `Task "${activity.task.name}" completed`;
      case 'proposal_created':
        return `New proposal sent to ${activity.proposal.clientId}`;
      case 'client_created':
        return `New client added: ${activity.client.companyName}`;
      case 'invoice_paid':
        return `Invoice #${activity.invoice.id} paid`;
      default:
        return 'Activity recorded';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Dashboard Overview</h2>
        <div className="flex space-x-2">
          <Button 
            variant={dateFilter === '7days' ? 'default' : 'outline'} 
            onClick={() => setDateFilter('7days')}
          >
            Last 7 days
          </Button>
          <Button 
            variant={dateFilter === '30days' ? 'default' : 'outline'} 
            onClick={() => setDateFilter('30days')}
          >
            Last 30 days
          </Button>
          <Button 
            variant={dateFilter === 'custom' ? 'default' : 'outline'} 
            onClick={() => setDateFilter('custom')}
          >
            Custom
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          variant="clients"
          title="Total Clients"
          value={data.counts.clients}
          change={{ value: "4.75% increase", positive: true }}
        />
        <StatCard
          variant="tasks"
          title="Tasks Due Today"
          value={data.counts.tasksToday}
          change={{ value: "8 more than yesterday", positive: false }}
        />
        <StatCard
          variant="invoices"
          title="Open Invoices"
          value={data.counts.openInvoices}
          change={{ value: `$${data.counts.openInvoicesValue.toLocaleString()} outstanding`, positive: true }}
        />
        <StatCard
          variant="proposals"
          title="Sent Proposals"
          value={data.counts.proposalsSent}
          change={{ value: `${data.counts.proposalsAccepted} accepted this month`, positive: true }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  fill="rgba(59, 130, 246, 0.1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest activities across the platform</CardDescription>
          </div>
          <Button variant="outline" size="sm">View All</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.recentActivities.length > 0 ? (
            data.recentActivities.map((activity, index) => (
              <ActivityItem
                key={index}
                type={activity.type as any}
                title={getActivityTitle(activity)}
                timestamp={new Date(activity.date)}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-6">No recent activities</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
