"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { isValidElement, createElement, ElementType } from "react";

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  // Check if icon is already a valid React element (JSX)
  const isReactElement = isValidElement(icon);
  // Check if icon is a component (function or forwardRef)
  const isComponent = !isReactElement && (typeof icon === "function" || (icon && typeof icon === "object" && "$$typeof" in icon));

  const renderIcon = () => {
    if (!icon) return null;
    if (isReactElement) return icon;
    if (isComponent) return createElement(icon as ElementType, { className: "w-8 h-8 text-gray-400" });
    return null;
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          {renderIcon()}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="text-gray-500 mt-2 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
