import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { CircleDollarSign, Users, CheckSquare, FileText, TrendingUp, TrendingDown } from "lucide-react";

type StatCardVariant = "clients" | "tasks" | "invoices" | "proposals";

interface StatCardProps {
  variant: StatCardVariant;
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ variant, title, value, change, className }: StatCardProps) {
  const getIcon = () => {
    switch (variant) {
      case "clients":
        return <Users className="h-6 w-6" />;
      case "tasks":
        return <CheckSquare className="h-6 w-6" />;
      case "invoices":
        return <CircleDollarSign className="h-6 w-6" />;
      case "proposals":
        return <FileText className="h-6 w-6" />;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case "clients":
        return "border-blue-500";
      case "tasks":
        return "border-indigo-500";
      case "invoices":
        return "border-yellow-500";
      case "proposals":
        return "border-green-500";
    }
  };

  const getIconBgColor = () => {
    switch (variant) {
      case "clients":
        return "bg-blue-100 text-blue-500";
      case "tasks":
        return "bg-indigo-100 text-indigo-500";
      case "invoices":
        return "bg-yellow-100 text-yellow-500";
      case "proposals":
        return "bg-green-100 text-green-500";
    }
  };

  return (
    <Card className={cn("border-l-4", getBorderColor(), className)}>
      <CardContent className="p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
          </div>
          <div className={cn("rounded-full p-3", getIconBgColor())}>
            {getIcon()}
          </div>
        </div>
        {change && (
          <p className={cn(
            "text-sm mt-2 flex items-center gap-1",
            change.positive ? "text-green-600" : "text-red-600"
          )}>
            {change.positive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {change.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;
