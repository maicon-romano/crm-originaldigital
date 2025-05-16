import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfToday, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, isSameDay, isToday, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type CalendarEvent = {
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color?: string;
  userId: number;
  taskId?: number;
  projectId?: number;
};

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventCreate?: (event: Omit<CalendarEvent, "id">) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: number) => void;
  users?: { id: number; name: string }[];
  tasks?: { id: number; name: string }[];
  projects?: { id: number; name: string }[];
}

export function CalendarView({
  events = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  users = [],
  tasks = [],
  projects = [],
}: CalendarViewProps) {
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDay, setSelectedDay] = useState(today);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: addDays(new Date(), 1),
    allDay: true,
    userId: users.length > 0 ? users[0].id : 1,
    taskId: undefined,
    projectId: undefined
  });

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return day >= eventStart && day <= eventEnd;
    });
  };

  const getRandomColor = () => {
    const colors = ["bg-blue-200", "bg-green-200", "bg-red-200", "bg-yellow-200", "bg-purple-200", "bg-pink-200"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleCreateEvent = () => {
    if (onEventCreate) {
      onEventCreate({
        ...eventForm,
        startDate: new Date(eventForm.startDate),
        endDate: new Date(eventForm.endDate),
      });
    }
    setEventForm({
      title: "",
      description: "",
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      allDay: true,
      userId: users.length > 0 ? users[0].id : 1,
      taskId: undefined,
      projectId: undefined
    });
    setIsNewEventDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-6">
          <div className="flex flex-col">
            <CardTitle>Calendar</CardTitle>
            <span className="text-sm text-muted-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Event</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Event title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Event description"
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={format(new Date(eventForm.startDate), "yyyy-MM-dd'T'HH:mm")}
                        onChange={(e) => setEventForm({ ...eventForm, startDate: new Date(e.target.value) })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={format(new Date(eventForm.endDate), "yyyy-MM-dd'T'HH:mm")}
                        onChange={(e) => setEventForm({ ...eventForm, endDate: new Date(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allDay"
                      checked={eventForm.allDay}
                      onCheckedChange={(checked) => setEventForm({ ...eventForm, allDay: checked })}
                    />
                    <Label htmlFor="allDay">All Day</Label>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="user">Assigned To</Label>
                    <Select
                      value={eventForm.userId.toString()}
                      onValueChange={(value) => setEventForm({ ...eventForm, userId: parseInt(value) })}
                    >
                      <SelectTrigger id="user">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {tasks.length > 0 && (
                    <div className="grid gap-2">
                      <Label htmlFor="task">Related Task</Label>
                      <Select
                        value={eventForm.taskId?.toString() || ""}
                        onValueChange={(value) => setEventForm({ ...eventForm, taskId: value ? parseInt(value) : undefined })}
                      >
                        <SelectTrigger id="task">
                          <SelectValue placeholder="Select task" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id.toString()}>
                              {task.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {projects.length > 0 && (
                    <div className="grid gap-2">
                      <Label htmlFor="project">Related Project</Label>
                      <Select
                        value={eventForm.projectId?.toString() || ""}
                        onValueChange={(value) => setEventForm({ ...eventForm, projectId: value ? parseInt(value) : undefined })}
                      >
                        <SelectTrigger id="project">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button onClick={handleCreateEvent} className="mt-2" disabled={!eventForm.title}>
                    Create Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden bg-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="bg-background p-3 text-center text-sm font-medium">
                {day}
              </div>
            ))}
            {daysInMonth.map((day, dayIdx) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[120px] bg-background p-2 text-sm",
                    isToday(day) && "bg-muted/50",
                    isSameDay(day, selectedDay) && "border-primary border-2",
                    "hover:bg-muted/50 cursor-pointer"
                  )}
                  onClick={() => setSelectedDay(day)}
                >
                  <time
                    dateTime={format(day, "yyyy-MM-dd")}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isToday(day) && "bg-primary text-primary-foreground font-bold"
                    )}
                  >
                    {format(day, "d")}
                  </time>
                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded truncate",
                          event.color || getRandomColor()
                        )}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-6">
          <CardTitle className="text-base">
            Events for {format(selectedDay, "MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          {getEventsForDay(selectedDay).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No events scheduled for this day.
            </p>
          ) : (
            <div className="space-y-4">
              {getEventsForDay(selectedDay).map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{event.title}</h3>
                    <Badge variant={event.allDay ? "outline" : "default"}>
                      {event.allDay ? "All Day" : `${format(new Date(event.startDate), "h:mm a")} - ${format(new Date(event.endDate), "h:mm a")}`}
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-4">
                    {onEventUpdate && (
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    )}
                    {onEventDelete && (
                      <Button size="sm" variant="destructive" onClick={() => onEventDelete(event.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CalendarView;
