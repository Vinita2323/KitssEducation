import React from "react";
import { AlertCircle, RefreshCw, BookOpen, Layers, Inbox } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";

export const EmptyState = ({
  icon: Icon = Inbox,
  title = "No Items Found",
  description = "There are no records to display at this moment.",
  actionText,
  onAction,
  className = ""
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-[#E6E8EC] my-4 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#F7F8FA] border border-[#E6E8EC] flex items-center justify-center text-[#667085] mb-4">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-bold text-[#0A1D3F] mb-1">{title}</h3>
      <p className="text-xs text-[#667085] max-w-xs mb-5">{description}</p>
      {actionText && onAction && (
        <PrimaryButton size="sm" onClick={onAction}>
          {actionText}
        </PrimaryButton>
      )}
    </div>
  );
};

export const ErrorState = ({
  title = "Something went wrong",
  message = "We could not load the requested information. Please try again.",
  onRetry,
  className = ""
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-red-100 my-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[#D92D20] mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#0A1D3F] mb-1">{title}</h3>
      <p className="text-xs text-[#667085] max-w-xs mb-4">{message}</p>
      {onRetry && (
        <PrimaryButton
          variant="navy"
          size="sm"
          onClick={onRetry}
          icon={RefreshCw}
        >
          Try Again
        </PrimaryButton>
      )}
    </div>
  );
};

export const SkeletonLoader = ({ type = "card", count = 3 }) => {
  const items = Array.from({ length: count });

  if (type === "book") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        {items.map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#E6E8EC] p-3 animate-pulse flex flex-col gap-2.5"
          >
            <div className="w-full aspect-3/4 bg-gray-200 rounded-xl" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "course") {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#E6E8EC] p-3.5 animate-pulse flex gap-3.5"
          >
            <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-4/5" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((_, i) => (
        <div
          key={i}
          className="h-20 bg-white rounded-2xl border border-[#E6E8EC] animate-pulse p-4"
        >
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};
