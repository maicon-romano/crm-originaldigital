import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { format, addDays, setHours, parse, isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Define event schema
const eventSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  allDay: z.boolean().default(false),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
});

type CalendarEvent = z.infer<typeof eventSchema> & {
  id?: number;
  createdAt?: string;
  userId: number;
};

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CalendarEvent>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      allDay: false,
      projectId: undefined,
      taskId: undefined,
    },
  });

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar-events'],
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['/api/tasks'],
  });

  const createMutation = useMutation({
    mutationFn: async (event: CalendarEvent) => {
      const res = await apiRequest('POST', '/api/calendar-events', {
        ...event,
        userId: 1, // Current user ID (hardcoded for simplicity)
        projectId: event.projectId ? parseInt(event.projectId) : undefined,
        taskId: event.taskId ? parseInt(event.taskId) : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-events'] });
      setDialogOpen(false);
      toast({
        title: 'Event created',
        description: 'The calendar event has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create event: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (event: CalendarEvent) => {
      const res = await apiRequest('PATCH', `/api/calendar-events/${event.id}`, {
        ...event,
        projectId: event.projectId ? parseInt(event.projectId) : null,
        taskId: event.taskId ? parseInt(event.taskId) : null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-events'] });
      setDialogOpen(false);
      toast({
        title: 'Event updated',
        description: 'The calendar event has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update event: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/calendar-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-events'] });
      setDialogOpen(false);
      toast({
        title: 'Event deleted',
        description: 'The calendar event has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete event: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: CalendarEvent) => {
    if (selectedEvent?.id) {
      updateMutation.mutate({ ...values, id: selectedEvent.id, userId: selectedEvent.userId });
    } else {
      createMutation.mutate({ ...values, userId: 1 }); // Current user ID (hardcoded for simplicity)
    }
  };

  const handleOpenDialog = () => {
    setSelectedEvent(null);
    form.reset({
      title: "",
      description: "",
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      allDay: false,
      projectId: undefined,
      taskId: undefined,
    });
    setDialogOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    form.reset({
      title: event.title,
      description: event.description || "",
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      allDay: event.allDay || false,
      projectId: event.projectId?.toString(),
      taskId: event.taskId?.toString(),
    });
    setDialogOpen(true);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent?.id) {
      deleteMutation.mutate(selectedEvent.id);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(date);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(date);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setDate(newDate);
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.taskId) return 'bg-blue-200 dark:bg-blue-800 border-blue-300 dark:border-blue-700';
    if (event.projectId) return 'bg-green-200 dark:bg-green-800 border-green-300 dark:border-green-700';
    return 'bg-purple-200 dark:bg-purple-800 border-purple-300 dark:border-purple-700';
  };

  const getProjectName = (projectId?: number | null) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : null;
  };

  const getTaskName = (taskId?: number | null) => {
    if (!taskId) return null;
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : null;
  };

  // Generate time slots for week view (8:00 AM to 6:00 PM)
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8);
  
  // Generate days of the week
  const getDaysOfWeek = () => {
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek);
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  };
  
  // Check if event is on a specific date (for month view)
  const isEventOnDate = (event: CalendarEvent, selectedDate: Date) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    const day = new Date(selectedDate);
    day.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    return isWithinInterval(day, { start: eventStart, end: eventEnd }) || 
           isWithinInterval(dayEnd, { start: eventStart, end: eventEnd }) ||
           (isWithinInterval(eventStart, { start: day, end: dayEnd }) && 
            isWithinInterval(eventEnd, { start: day, end: dayEnd }));
  };
  
  // Check if event is in a specific time slot (for week view)
  const isEventInTimeSlot = (event: CalendarEvent, day: Date, hour: number) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    // Adjust day to match the hour
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    
    return (eventStart < slotEnd && eventEnd > slotStart);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Calendar</h2>
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => view === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-medium">
              {format(date, view === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => view === 'month' ? navigateMonth('next') : navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Select
            value={view}
            onValueChange={(value) => setView(value as 'month' | 'week')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 h-4 w-4" /> New Event
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <>
          {view === 'month' ? (
            // Month View
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <Calendar 
                mode="multiple"
                selected={[]}
                className="border-none p-0"
                month={date}
                onMonthChange={setDate}
                disabled={(date) => false}
                footer={
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center">
                      <div className="h-3 w-3 mr-2 rounded-full bg-blue-200 dark:bg-blue-800"></div>
                      <span>Task</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 mr-2 rounded-full bg-green-200 dark:bg-green-800"></div>
                      <span>Project</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 mr-2 rounded-full bg-purple-200 dark:bg-purple-800"></div>
                      <span>Other</span>
                    </div>
                  </div>
                }
                components={{
                  Day: ({ date: dayDate }) => {
                    // Filter events for this day
                    const dayEvents = events.filter(event => isEventOnDate(event, dayDate));
                    
                    return (
                      <div className="h-24 relative">
                        <div className="p-1 text-right">
                          {format(dayDate, 'd')}
                        </div>
                        <div className="px-1 overflow-y-auto max-h-14">
                          {dayEvents.length > 0 ? (
                            dayEvents.slice(0, 2).map((event, index) => (
                              <div 
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEvent(event);
                                }}
                                className={`mb-1 px-2 py-1 text-xs rounded truncate cursor-pointer border ${getEventColor(event)}`}
                              >
                                {event.title}
                              </div>
                            ))
                          ) : null}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  },
                }}
              />
            </div>
          ) : (
            // Week View
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Week Header */}
                <div className="grid grid-cols-8 border-b">
                  <div className="h-12 border-r"></div>
                  {getDaysOfWeek().map((day, index) => (
                    <div 
                      key={index}
                      className={`p-2 text-center border-r ${
                        format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                    >
                      <div className="font-medium">{format(day, 'EEE')}</div>
                      <div className="text-sm">{format(day, 'MMM d')}</div>
                    </div>
                  ))}
                </div>
                
                {/* Time Slots */}
                {timeSlots.map(hour => (
                  <div key={hour} className="grid grid-cols-8 border-b">
                    {/* Time Label */}
                    <div className="p-2 text-right text-sm border-r">
                      {hour}:00
                    </div>
                    
                    {/* Day Columns */}
                    {getDaysOfWeek().map((day, dayIndex) => {
                      // Find events for this timeslot
                      const slotEvents = events.filter(event => 
                        isEventInTimeSlot(event, day, hour)
                      );
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className={`p-1 border-r min-h-[60px] relative ${
                            format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : ''
                          }`}
                          onClick={() => {
                            const newDate = new Date(day);
                            newDate.setHours(hour);
                            form.reset({
                              title: "",
                              description: "",
                              startDate: newDate,
                              endDate: new Date(newDate.getTime() + 60 * 60 * 1000), // 1 hour later
                              allDay: false,
                              projectId: undefined,
                              taskId: undefined,
                            });
                            setSelectedEvent(null);
                            setDialogOpen(true);
                          }}
                        >
                          {slotEvents.map((event, index) => (
                            <div 
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                              className={`mb-1 px-2 py-1 text-xs rounded truncate cursor-pointer border ${getEventColor(event)}`}
                            >
                              {event.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            <DialogDescription>
              {selectedEvent 
                ? 'Make changes to your calendar event here.'
                : 'Fill in the details to create a new calendar event.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Event description" 
                        rows={3} 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start</FormLabel>
                      <FormControl>
                        <div className="flex flex-col space-y-2">
                          <Input
                            type="date"
                            value={format(field.value, 'yyyy-MM-dd')}
                            onChange={(e) => {
                              const date = parse(e.target.value, 'yyyy-MM-dd', new Date());
                              const hours = field.value.getHours();
                              const minutes = field.value.getMinutes();
                              date.setHours(hours, minutes);
                              field.onChange(date);
                            }}
                          />
                          {!form.watch('allDay') && (
                            <Input
                              type="time"
                              value={format(field.value, 'HH:mm')}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':');
                                const date = new Date(field.value);
                                date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                                field.onChange(date);
                              }}
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End</FormLabel>
                      <FormControl>
                        <div className="flex flex-col space-y-2">
                          <Input
                            type="date"
                            value={format(field.value, 'yyyy-MM-dd')}
                            onChange={(e) => {
                              const date = parse(e.target.value, 'yyyy-MM-dd', new Date());
                              const hours = field.value.getHours();
                              const minutes = field.value.getMinutes();
                              date.setHours(hours, minutes);
                              field.onChange(date);
                            }}
                          />
                          {!form.watch('allDay') && (
                            <Input
                              type="time"
                              value={format(field.value, 'HH:mm')}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':');
                                const date = new Date(field.value);
                                date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                                field.onChange(date);
                              }}
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="allDay"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>All-day event</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Project</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Task</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a task (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {tasks.map((task) => (
                          <SelectItem key={task.id} value={task.id.toString()}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex justify-between">
                {selectedEvent && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteEvent}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Event'}
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : selectedEvent ? 'Update Event' : 'Create Event'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}