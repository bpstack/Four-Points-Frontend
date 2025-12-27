// app/components/parking/bookings/PaymentModal.tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ParkingBooking } from '@/app/lib/parking/types'
import { FiDollarSign, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi'

interface PaymentModalProps {
  booking: ParkingBooking
  onClose: () => void
  onConfirm: (data: {
    payment_amount: number
    payment_method: 'cash' | 'card' | 'transfer' | 'agency'
    payment_reference?: string
  }) => Promise<void>
}

export function PaymentModal({ booking, onClose, onConfirm }: PaymentModalProps) {
  const t = useTranslations('parking')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    payment_amount: booking.payment.total_amount.toString(),
    payment_method: 'cash' as 'cash' | 'card' | 'transfer' | 'agency',
    payment_reference: '',
  })

  // Validation: can't pay if no total_amount set
  const canPay = booking.payment.total_amount > 0
  const isPaid = booking.payment.pending_amount === 0

  const handleSubmit = async () => {
    if (!canPay) return

    setLoading(true)
    try {
      await onConfirm({
        payment_amount: parseFloat(data.payment_amount),
        payment_method: data.payment_method,
        payment_reference: data.payment_reference || undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#161b22] rounded-lg shadow-xl max-w-md w-full border border-[#d0d7de] dark:border-[#30363d] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d0d7de] dark:border-[#30363d] sticky top-0 bg-white dark:bg-[#161b22]">
          <div>
            <h3 className="text-lg font-semibold text-[#24292f] dark:text-[#f0f6fc] flex items-center gap-2">
              <FiDollarSign className="w-5 h-5 text-[#1a7f37] dark:text-[#3fb950]" />
              {t('paymentModal.title')}
            </h3>
            <p className="text-sm text-[#57606a] dark:text-[#8b949e] mt-1">
              {booking.booking_code}
              {booking.vehicle?.owner && (
                <span className="text-[#24292f] dark:text-[#c9d1d9]">
                  {' '}
                  - {booking.vehicle.owner}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#57606a] hover:text-[#24292f] dark:text-[#8b949e] dark:hover:text-[#f0f6fc] rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Error: No price set */}
          {!canPay && (
            <div className="bg-[#ffebe9] dark:bg-[#490202] border border-[#ff818266] dark:border-[#f8514966] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-[#cf222e] dark:text-[#f85149] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#cf222e] dark:text-[#f85149]">
                    {t('paymentModal.cannotPay')}
                  </p>
                  <p className="text-sm text-[#cf222e] dark:text-[#f85149] mt-1">
                    {t('paymentModal.noPriceSet')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Already paid warning */}
          {isPaid && canPay && (
            <div className="bg-[#dafbe1] dark:bg-[#23883726] border border-[#aceebb] dark:border-[#238636] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FiCheck className="w-5 h-5 text-[#1a7f37] dark:text-[#3fb950] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#1a7f37] dark:text-[#3fb950]">
                    {t('paymentModal.alreadyPaid')}
                  </p>
                  <p className="text-sm text-[#1a7f37] dark:text-[#3fb950] mt-1">
                    {t('paymentModal.canModify')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment summary */}
          {canPay && (
            <>
              <div className="bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiDollarSign className="w-4 h-4 text-[#57606a] dark:text-[#8b949e]" />
                  <span className="font-medium text-[#24292f] dark:text-[#f0f6fc] text-sm">
                    {t('paymentModal.summary')}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#57606a] dark:text-[#8b949e]">
                      {t('paymentModal.totalBooking')}
                    </span>
                    <span className="font-semibold text-[#24292f] dark:text-[#f0f6fc]">
                      {booking.payment.total_amount.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#57606a] dark:text-[#8b949e]">
                      {t('paymentModal.alreadyPaidAmount')}
                    </span>
                    <span className="text-[#1a7f37] dark:text-[#3fb950]">
                      {booking.payment.paid_amount.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
                    <span className="font-medium text-[#57606a] dark:text-[#8b949e]">
                      {t('paymentModal.pending')}
                    </span>
                    <span
                      className={`font-bold ${
                        booking.payment.pending_amount > 0
                          ? 'text-[#cf222e] dark:text-[#f85149]'
                          : 'text-[#1a7f37] dark:text-[#3fb950]'
                      }`}
                    >
                      {booking.payment.pending_amount.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#24292f] dark:text-[#f0f6fc] mb-1">
                  {t('paymentModal.amountToRegister')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.payment_amount}
                    onChange={(e) => setData({ ...data, payment_amount: e.target.value })}
                    className="w-full px-3 py-2 pr-8 bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57606a] dark:text-[#8b949e]">
                    €
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#24292f] dark:text-[#f0f6fc] mb-1">
                  {t('paymentModal.paymentMethod')}
                </label>
                <select
                  value={data.payment_method}
                  onChange={(e) =>
                    setData({
                      ...data,
                      payment_method: e.target.value as 'cash' | 'card' | 'transfer' | 'agency',
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
                >
                  <option value="cash">{t('paymentMethods.cash')}</option>
                  <option value="card">{t('paymentMethods.card')}</option>
                  <option value="transfer">{t('paymentMethods.transfer')}</option>
                  <option value="other">{t('paymentMethods.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#24292f] dark:text-[#f0f6fc] mb-1">
                  {t('paymentModal.reference')}
                </label>
                <input
                  type="text"
                  value={data.payment_reference}
                  onChange={(e) => setData({ ...data, payment_reference: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
                  placeholder={t('paymentModal.referencePlaceholder')}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] rounded-b-lg sticky bottom-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-[#24292f] dark:text-[#c9d1d9] bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] rounded-lg hover:bg-[#f3f4f6] dark:hover:bg-[#30363d] transition-colors disabled:opacity-50"
          >
            {t('paymentModal.cancel')}
          </button>
          {canPay && (
            <button
              onClick={handleSubmit}
              disabled={loading || !data.payment_amount || parseFloat(data.payment_amount) <= 0}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#1a7f37] hover:bg-[#116329] rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  {t('paymentModal.register')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
