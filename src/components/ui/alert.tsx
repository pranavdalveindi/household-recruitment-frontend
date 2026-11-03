import * as React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success" | "warning";
  title?: string;
  description?: string;
}

export function Alert({ variant = "default", title, description, children, className, ...props }: AlertProps) {
  const icons = {
    default: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
    destructive: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
  };

  const variantStyles = {
    default: "bg-blue-50/80 border-blue-200 text-blue-900",
    destructive: "bg-rose-50/80 border-rose-200 text-rose-900",
    success: "bg-emerald-50/80 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50/80 border-amber-200 text-amber-900",
  };

  return (
    <div
      className={cn("flex gap-3 rounded-xl border p-4 text-sm shadow-sm", variantStyles[variant], className)}
      {...props}
    >
      {icons[variant]}
      <div className="space-y-0.5">
        {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
        {description && <div className="text-xs opacity-90">{description}</div>}
        {children}
      </div>
    </div>
  );
}

