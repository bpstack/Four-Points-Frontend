// app/components/cashier/CloseDayModal.tsx
'use client'

import { useTranslations } from 'next-intl'
import { FiX, FiCheckCircle, FiAlertCircle, FiCalendar } from 'react-icons/fi'
import { useCloseDay } from '@/app/lib/cashier/queries'
import { toast } from 'react-hot-toast'
import type { CashierDaily } from '@/app/lib/cashier/types'

interface CloseDayModalProps {
  isOpen: boolean
  onClose: () => void
  dailyData: CashierDaily
  selectedDate: string
}

export default function CloseDayModal({
  isOpen,
  onClose,
  dailyData,
  selectedDate,
}: CloseDayModalProps) {
  const t = useTranslations('cashier')
  const closeDayMutation = useCloseDay()

  // ✅ Validaciones: Solo turnos, no vales
  const validations = {
    allShiftsClosed: dailyData.all_shifts_closed || false,
    hasFourShifts: (dailyData.shifts?.length || 0) === 4,
  }

  const canClose = validations.allShiftsClosed && validations.hasFourShifts

  // Contar vales pendientes (solo informativo)
  const pendingVouchersCount =
    dailyData.active_vouchers?.filter((v) => v.status === 'pending').length || 0

  // ✅ CORREGIDO: Calcular totales correctamente
  const totals = {
    cash: 0,
    card: 0,
    bacs: 0,
    webPayment: 0,
    transfer: 0,
    other: 0,
  }

  dailyData.shifts?.forEach((shift) => {
    // ✅ CORREGIDO: Sumar solo los INGRESOS (lo que se retiró a Office)
    totals.cash += parseFloat(shift.income || '0')

    // ✅ Sumar pagos por método (usando payment_method_id)
    shift.payments?.forEach((payment) => {
      const amount = parseFloat(payment.amount)

      // Mapeo de IDs según tabla payment_methods
      switch (payment.payment_method_id) {
        case 1: // TARJETA CRÉDITO O DÉBITO
          totals.card += amount
          break
        case 2: // BACS
          totals.bacs += amount
          break
        case 3: // WEB PAYMENT
          totals.webPayment += amount
          break
        case 4: // TRANSFERENCIA
          totals.transfer += amount
          break
        case 5: // OTROS
          totals.other += amount
          break
      }
    })
  })

  const grandTotal =
    totals.cash + totals.card + totals.bacs + totals.webPayment + totals.transfer + totals.other

  const handleClose = async () => {
    if (!canClose) {
      toast.error(t('closeDay.requirementsNotMet'))
      return
    }

    try {
      await closeDayMutation.mutateAsync({ date: selectedDate })
      toast.success(t('closeDay.dayClosed'))
      onClose()
    } catch (error) {
      console.error('Error cerrando día:', error)
      const errorMessage = error instanceof Error ? error.message : t('error.closeDay')
      toast.error(errorMessage)
    }
  }

  if (!isOpen) return null

  const isLoading = closeDayMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0d1117] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#0d1117] flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-green-600" />
            {t('closeDay.title')}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Fecha */}
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
              {t('closeDay.dateOfDay')}
            </p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {new Date(selectedDate).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Validaciones */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('closeDay.validations')}:
            </h4>

            {/* 4 Turnos */}
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                validations.hasFourShifts
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              {validations.hasFourShifts ? (
                <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  validations.hasFourShifts
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {validations.hasFourShifts
                  ? t('closeDay.fourShiftsCreated')
                  : t('closeDay.shiftsCreatedOf4', { count: dailyData.shifts?.length || 0 })}
              </span>
            </div>

            {/* Turnos cerrados */}
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                validations.allShiftsClosed
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              {validations.allShiftsClosed ? (
                <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  validations.allShiftsClosed
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {validations.allShiftsClosed
                  ? t('closeDay.allShiftsClosed')
                  : t('closeDay.shiftsMissingClose')}
              </span>
            </div>

            {/* ✅ Vales - Solo informativo */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <FiAlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {pendingVouchersCount === 0
                    ? t('closeDay.noPendingVouchers')
                    : t('closeDay.pendingVouchers', { count: pendingVouchersCount })}
                </span>
                {pendingVouchersCount > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    {t('closeDay.canJustifyAfterClose')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Estado de turnos */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('closeDay.shiftStatus')}:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['night', 'morning', 'afternoon', 'closing'].map((shiftType) => {
                const shift = dailyData.shifts?.find((s) => s.shift_type === shiftType)
                const isClosed = shift?.status === 'closed'
                const icons = {
                  night: '🌙',
                  morning: '☀️',
                  afternoon: '🌅',
                  closing: '🔒',
                }

                return (
                  <div
                    key={shiftType}
                    className={`p-3 rounded-lg border text-center ${
                      isClosed
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-1">{icons[shiftType as keyof typeof icons]}</div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t(`shifts.${shiftType}`)}
                    </p>
                    {isClosed ? (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        ✓ {t('summary.closed')}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t('summary.open')}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Resumen Financiero */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('closeDay.financialSummary')}:
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300 mb-1">
                  {t('closeDay.cashIncome')}
                </p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {totals.cash.toFixed(2)}€
                </p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                  {t('closeDay.card')}
                </p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {totals.card.toFixed(2)}€
                </p>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">
                  {t('closeDay.bacs')}
                </p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {totals.bacs.toFixed(2)}€
                </p>
              </div>

              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-700 dark:text-orange-300 mb-1">
                  {t('closeDay.webPayment')}
                </p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {totals.webPayment.toFixed(2)}€
                </p>
              </div>

              <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                <p className="text-xs text-pink-700 dark:text-pink-300 mb-1">
                  {t('closeDay.transfer')}
                </p>
                <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                  {totals.transfer.toFixed(2)}€
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                  {t('closeDay.others')}
                </p>
                <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                  {totals.other.toFixed(2)}€
                </p>
              </div>
            </div>

            {/* Gran Total */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border-2 border-green-300 dark:border-green-700">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('closeDay.grandTotalDay')}
                </span>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {grandTotal.toFixed(2)}€
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-[#0d1117] p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('closeDay.cancel')}
          </button>
          <button
            onClick={handleClose}
            disabled={isLoading || !canClose}
            className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('closeDay.closingDay')}
              </>
            ) : (
              <>
                <FiCheckCircle className="w-4 h-4" />
                {t('closeDay.closeDayComplete')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
