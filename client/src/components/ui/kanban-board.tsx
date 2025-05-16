import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type TaskItem = {
  id: number;
  name: string;
  description?: string;
  status: string;
  priority: "high" | "medium" | "low";
  dueDate?: Date | string;
  assigneeId?: number;
  assignee?: {
    id: number;
    name: string;
    avatar?: string;
  };
  projectId?: number;
  project?: {
    id: number;
    name: string;
  };
};

export type KanbanColumn = {
  id: string;
  title: string;
  tasks: TaskItem[];
  color?: string;
};

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onTaskMove: (result: DropResult) => void;
  onAddTask?: (columnId: string) => void;
  onEditTask?: (taskId: number) => void;
}

export function KanbanBoard({ 
  columns, 
  onTaskMove, 
  onAddTask, 
  onEditTask 
}: KanbanBoardProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="default" className="bg-yellow-500">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="text-green-500 border-green-500">Low</Badge>;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <DragDropContext onDragEnd={onTaskMove}>
      <div className="flex gap-5 overflow-x-auto pb-6 min-h-[600px]">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <Card>
              <CardHeader className={cn("pb-2", column.color)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-3 h-3 rounded-full", 
                      column.id === "backlog" ? "bg-gray-400" : 
                      column.id === "inProgress" ? "bg-blue-400" : 
                      column.id === "testing" ? "bg-purple-400" : 
                      "bg-green-400"
                    )}></span>
                    <CardTitle className="text-base">{column.title}</CardTitle>
                  </div>
                  <Badge variant="outline">{column.tasks.length}</Badge>
                </div>
              </CardHeader>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <CardContent 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="p-2 min-h-[400px]"
                  >
                    <div className="space-y-3">
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-white dark:bg-gray-800 p-3 rounded shadow-sm border-l-4",
                                task.status === "backlog" ? "border-gray-400" :
                                task.status === "inProgress" ? "border-blue-400" :
                                task.status === "testing" ? "border-purple-400" :
                                "border-green-400",
                                snapshot.isDragging && "opacity-75"
                              )}
                              onClick={() => onEditTask && onEditTask(task.id)}
                            >
                              <div className="flex justify-between mb-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {task.project?.name || ""}
                                </span>
                                {getPriorityBadge(task.priority)}
                              </div>
                              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{task.name}</h4>
                              {task.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                              )}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  {task.assignee && (
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                                      <AvatarFallback className="text-xs">
                                        {getInitials(task.assignee.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                                {task.dueDate && (
                                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400" title={`Due: ${format(new Date(task.dueDate), "MMM d, yyyy")}`}>
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(task.dueDate), "MMM d")}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                    {onAddTask && (
                      <Button 
                        variant="ghost" 
                        className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => onAddTask(column.id)}
                      >
                        <span className="font-bold mr-1">+</span> Add Task
                      </Button>
                    )}
                  </CardContent>
                )}
              </Droppable>
            </Card>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

export default KanbanBoard;
