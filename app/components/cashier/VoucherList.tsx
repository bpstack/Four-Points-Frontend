// app/components/cashier/VoucherList.tsx
'use client'

import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi'
import { useTranslations } from 'next-intl'
import type { CashierVoucher } from '@/app/lib/cashier/types'

interface VoucherListProps {
  vouchers: CashierVoucher[]
  canJustify?: boolean
  onJustify?: (voucherId: number) => void
  onCancel?: (voucherId: number) => void
}

export default function VoucherList({
  vouchers,
  canJustify = false,
  onJustify,
  onCancel,
}: VoucherListProps) {
  const t = useTranslations('cashier')

  if (vouchers.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-xs">
        <p>{t('voucher.noVouchers')}</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        icon: FiClock,
        text: t('voucher.pending'),
        class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      },
      justified: {
        icon: FiCheckCircle,
        text: t('voucher.justified'),
        class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      },
      cancelled: {
        icon: FiXCircle,
        text: t('voucher.cancelled'),
        class: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      },
    }
    const badge = badges[status as keyof typeof badges]
    if (!badge) return null
    const Icon = badge.icon
    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 ${badge.class} text-[10px] font-medium rounded`}
      >
        <Icon className="w-2.5 h-2.5" />
        {badge.text}
      </span>
    )
  }

  return (
    <div className="space-y-2">
      {vouchers.map((voucher) => (
        <div
          key={voucher.id}
          className={`p-2.5 rounded-lg border text-xs ${
            voucher.status === 'pending'
              ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
              : voucher.status === 'justified'
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">📝</span>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  {parseFloat(voucher.amount).toFixed(2)}€
                </p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">
                  {new Date(voucher.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            {getStatusBadge(voucher.status)}
          </div>
          <p className="text-[11px] text-gray-700 dark:text-gray-300 mb-2">{voucher.reason}</p>
          {voucher.status === 'pending' && (
            <div className="flex items-center gap-1.5">
              {canJustify && onJustify && (
                <button
                  onClick={() => onJustify(voucher.id)}
                  className="px-2 py-1 text-[10px] font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded"
                >
                  {t('voucher.justify')}
                </button>
              )}
              {onCancel && (
                <button
                  onClick={() => onCancel(voucher.id)}
                  className="px-2 py-1 text-[10px] font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded"
                >
                  {t('voucher.cancel')}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
          {t('voucher.total')} ({vouchers.length})
        </span>
        <span className="text-base font-bold text-orange-600 dark:text-orange-400">
          {vouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0).toFixed(2)}€
        </span>
      </div>
    </div>
  )
}
