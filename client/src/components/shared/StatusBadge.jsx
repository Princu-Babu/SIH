import React from 'react';
import { useTranslation } from 'react-i18next';

export default function StatusBadge({ status, customLabel, size = 'sm' }) {
  const { t } = useTranslation();

  if (!status && !customLabel) return null;

  const normalized = String(status || '').toUpperCase().trim();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  let defaultLabel = status;

  if (['PASS', 'PASSED', 'ACTIVE', 'COMPLETED', 'APPROVED'].includes(normalized)) {
    colorClasses = 'bg-green-50 text-green-700 border-green-300';
    if (normalized === 'PASS' || normalized === 'PASSED') defaultLabel = t('common.pass', 'PASS');
    if (normalized === 'ACTIVE') defaultLabel = t('common.active', 'Active');
    if (normalized === 'COMPLETED') defaultLabel = t('common.completed', 'Completed');
    if (normalized === 'APPROVED') defaultLabel = t('common.approved', 'Approved');
  } else if (['FAIL', 'FAILED', 'INACTIVE', 'REJECTED'].includes(normalized)) {
    colorClasses = 'bg-red-50 text-red-700 border-red-300';
    if (normalized === 'FAIL' || normalized === 'FAILED') defaultLabel = t('common.fail', 'FAIL');
    if (normalized === 'INACTIVE') defaultLabel = t('common.inactive', 'Inactive');
    if (normalized === 'REJECTED') defaultLabel = t('common.rejected', 'Rejected');
  } else if (['PENDING', 'DRAFT', 'INCOMPLETE'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-300';
    if (normalized === 'PENDING') defaultLabel = t('common.pending', 'Pending');
    if (normalized === 'DRAFT') defaultLabel = t('common.draft', 'Draft');
    if (normalized === 'INCOMPLETE') defaultLabel = 'Incomplete';
  } else if (['IN_PROGRESS', 'IN PROGRESS'].includes(normalized)) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-300';
    defaultLabel = t('common.inProgress', 'In Progress');
  }

  const sizeClasses = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center justify-center font-medium border rounded-md uppercase tracking-wider ${sizeClasses} ${colorClasses}`}
    >
      {customLabel || defaultLabel || status}
    </span>
  );
}
