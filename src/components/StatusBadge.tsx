import React from 'react';
import { RequestStatus } from '../types/index.js';
import {
  Clock,
  Search,
  FileCheck,
  AlertTriangle,
  Cog,
  CheckCircle2,
  XCircle,
  Download,
  Award,
  Ban
} from 'lucide-react';

interface StatusBadgeProps {
  status: RequestStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  SUBMITTED: {
    label: 'Submitted',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Clock
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: Search
  },
  DOCUMENT_VERIFICATION: {
    label: 'Document Verification',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: FileCheck
  },
  ADDITIONAL_DOCUMENT_REQUIRED: {
    label: 'Action: Document Needed',
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    icon: AlertTriangle
  },
  PROCESSING: {
    label: 'Processing',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: Cog
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: XCircle
  },
  READY_FOR_DOWNLOAD: {
    label: 'Ready for Download',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-300',
    icon: Download
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    icon: Award
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: Ban
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: Clock
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2'
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
      role="status"
    >
      <Icon className={iconSizes} />
      <span>{config.label}</span>
    </span>
  );
};
