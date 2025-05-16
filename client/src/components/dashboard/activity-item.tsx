import { cn } from "@/lib/utils";
import {
  CheckCircle,
  FileText,
  UserPlus,
  AlertCircle,
  Calendar,
  CheckSquare,
  CircleDollarSign,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ActivityType =
  | "task_completed"
  | "proposal_created"
  | "client_created"
  | "invoice_paid"
  | "invoice_overdue"
  | "project_created"
  | "ticket_created"
  | "event_created";

interface ActivityItemProps {
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  className?: string;
}

export function ActivityItem({
  type,
  title,
  description,
  timestamp,
  className,
}: ActivityItemProps) {
  const getIconAndColor = () => {
    switch (type) {
      case "task_completed":
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bgColor: "bg-blue-100",
          textColor: "text-blue-500",
        };
      case "proposal_created":
        return {
          icon: <FileText className="h-5 w-5" />,
          bgColor: "bg-green-100",
          textColor: "text-green-500",
        };
      case "client_created":
        return {
          icon: <UserPlus className="h-5 w-5" />,
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-500",
        };
      case "invoice_paid":
        return {
          icon: <CircleDollarSign className="h-5 w-5" />,
          bgColor: "bg-green-100",
          textColor: "text-green-500",
        };
      case "invoice_overdue":
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          bgColor: "bg-red-100",
          textColor: "text-red-500",
        };
      case "project_created":
        return {
          icon: <CheckSquare className="h-5 w-5" />,
          bgColor: "bg-purple-100",
          textColor: "text-purple-500",
        };
      case "ticket_created":
        return {
          icon: <MessageSquare className="h-5 w-5" />,
          bgColor: "bg-indigo-100",
          textColor: "text-indigo-500",
        };
      case "event_created":
        return {
          icon: <Calendar className="h-5 w-5" />,
          bgColor: "bg-blue-100",
          textColor: "text-blue-500",
        };
      default:
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bgColor: "bg-gray-100",
          textColor: "text-gray-500",
        };
    }
  };

  const { icon, bgColor, textColor } = getIconAndColor();
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <div className={cn("flex items-start space-x-3 pb-3 border-b border-gray-100 dark:border-gray-800", className)}>
      <div className={cn("rounded-full p-2", bgColor, textColor)}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        {description && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{description}</p>}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

export default ActivityItem;
