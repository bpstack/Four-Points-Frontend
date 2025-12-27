// app/components/cashier/ShiftCard.tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  FiDollarSign,
  FiUsers,
  FiEdit2,
  FiSave,
  FiX,
  FiCheckCircle,
  FiRotateCcw,
} from 'react-icons/fi'
import {
  useShiftDetails,
  useUpdateShift,
  useDailyDetails,
  useReopenShift,
} from '@/app/lib/cashier/queries'
import type {
  ShiftType,
  CashierShiftUser,
  CashierVoucher,
  CashierDenomination,
  CashierPayment,
} from '@/app/lib/cashier/types'
import { toast } from 'react-hot-toast'
import DenominationForm from './DenominationForm'
import PaymentForm from './PaymentForm'
import CreateVoucherModal from './CreateVoucherModal'
import VoucherList from './VoucherList'
import { useJustifyVoucher } from '@/app/lib/cashier/queries'
import CloseShiftModal from './CloseShiftModal'

interface ShiftCardProps {
  shiftId: number
  shiftType: ShiftType
}

const SHIFT_EMOJIS: Record<ShiftType, string> = {
  night: '🌙',
  morning: '☀️',
  afternoon: '🌅',
  closing: '🔒',
}

export default function ShiftCard({ shiftId, shiftType }: ShiftCardProps) {
  const t = useTranslations('cashier')
  const [isEditingIncome, setIsEditingIncome] = useState(false)
  const [incomeInput, setIncomeInput] = useState('')
  const [isEditingDenominations, setIsEditingDenominations] = useState(false)
  const [isEditingPayments, setIsEditingPayments] = useState(false)
  const [showCreateVoucherModal, setShowCreateVoucherModal] = useState(false)
  const justifyVoucherMutation = useJustifyVoucher()
  const reopenShiftMutation = useReopenShift()
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false)

  console.log('🔍 [ShiftCard] Rendering with shiftId:', shiftId)

  const { data: shiftData, isLoading } = useShiftDetails(shiftId)
  const shift = shiftData

  // ✅ AÑADIDO: Obtener datos del día para vales pendientes
  const { data: dailyData } = useDailyDetails(shift?.shift_date || '')

  console.log('🔍 [ShiftCard] shiftData completo:', shiftData)
  console.log('🔍 [ShiftCard] dailyData:', dailyData)
  console.log('🔍 [ShiftCard] active_vouchers:', dailyData?.active_vouchers)

  const updateShiftMutation = useUpdateShift()

  const handleEditIncome = () => {
    setIncomeInput(shift?.income || '0')
    setIsEditingIncome(true)
  }

  const handleSaveIncome = async () => {
    try {
      await updateShiftMutation.mutateAsync({
        shiftId,
        data: {
          income: parseFloat(incomeInput),
        },
      })

      toast.success(t('shiftCard.incomeUpdated'))
      setIsEditingIncome(false)
    } catch (error) {
      console.error('Error actualizando ingresos:', error)
      const errorMessage = error instanceof Error ? error.message : t('error.updateIncome')
      toast.error(errorMessage)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingIncome(false)
    setIncomeInput('')
  }

  const handleJustifyVoucher = async (voucherId: number) => {
    try {
      await justifyVoucherMutation.mutateAsync({ voucherId, shiftId })
      toast.success(t('shiftCard.voucherJustified'))
    } catch (error) {
      console.error('Error justificando vale:', error)
      const errorMessage = error instanceof Error ? error.message : t('error.justifyVoucher')
      toast.error(errorMessage)
    }
  }

  const handleReopenShift = async () => {
    try {
      await reopenShiftMutation.mutateAsync({ shiftId, reason: 'Reabierto para corrección' })
      toast.success(t('shiftCard.shiftReopened'))
    } catch (error) {
      console.error('Error reabriendo turno:', error)
      const errorMessage = error instanceof Error ? error.message : t('error.reopenShift')
      toast.error(errorMessage)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">{t('page.loadingShift')}</p>
      </div>
    )
  }

  if (!shift) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
        <p>{t('page.shiftNotFound')}</p>
      </div>
    )
  }

  // ✅ Determinar qué vales mostrar con tipos explícitos
  const vouchersToDisplay =
    shiftType === 'closing'
      ? dailyData?.active_vouchers?.filter((v: CashierVoucher) => v.status === 'pending') || []
      : shift.vouchers || []

  const vouchersCount =
    shiftType === 'closing'
      ? dailyData?.active_vouchers?.filter((v: CashierVoucher) => v.status === 'pending').length ||
        0
      : shift.vouchers?.length || 0

  return (
    <div className="space-y-6">
      {/* Header del turno */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{SHIFT_EMOJIS[shiftType] || '💼'}</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t(`shifts.${shiftType}Full`)}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {shift.status === 'closed' && (
              <>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                  <FiCheckCircle className="w-3 h-3" />
                  {t('summary.closed')}
                </span>
                <button
                  onClick={handleReopenShift}
                  disabled={reopenShiftMutation.isPending}
                  className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full flex items-center gap-1 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors disabled:opacity-50"
                  title={t('shiftCard.reopenShift')}
                >
                  <FiRotateCcw
                    className={`w-3 h-3 ${reopenShiftMutation.isPending ? 'animate-spin' : ''}`}
                  />
                  {t('shiftCard.reopen')}
                </button>
              </>
            )}
            {shift.status === 'open' && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                {t('summary.open')}
              </span>
            )}
          </div>
        </div>

        {shift.users && shift.users.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <FiUsers className="w-4 h-4" />
            <span className="font-medium">{t('shiftCard.responsible')}:</span>
            <div className="flex items-center gap-2">
              {shift.users.map((user: CashierShiftUser) => (
                <span
                  key={user.user_id}
                  className={`px-2 py-0.5 rounded text-xs ${
                    user.is_primary === 1
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {user.username}
                  {user.is_primary === 1 && ` (${t('shiftCard.primary')})`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t('shiftCard.initialFund')}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {parseFloat(shift.initial_fund || '0').toFixed(2)}€
          </p>
        </div>

        <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('shiftCard.shiftIncome')}</p>
            {!isEditingIncome && shift.status === 'open' && (
              <button
                onClick={handleEditIncome}
                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                title={t('shiftCard.edit')}
              >
                <FiEdit2 className="w-3 h-3" />
              </button>
            )}
          </div>
          {isEditingIncome ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                step="0.01"
                min="0"
                className="w-24 px-2 py-1 text-sm border border-blue-300 dark:border-blue-700 rounded focus:ring-2 focus:ring-blue-500 dark:bg-[#151b23] dark:text-white"
                autoFocus
              />
              <button
                onClick={handleSaveIncome}
                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                disabled={updateShiftMutation.isPending}
              >
                <FiSave className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                disabled={updateShiftMutation.isPending}
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {parseFloat(shift.income || '0').toFixed(2)}€
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t('shiftCard.cashCounted')}
          </p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {parseFloat(shift.cash_counted || '0').toFixed(2)}€
          </p>
        </div>

        <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t('shiftCard.discrepancy')}
          </p>
          <p
            className={`text-xl font-bold ${
              parseFloat(shift.difference || '0') === 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {parseFloat(shift.difference || '0').toFixed(2)}€
          </p>
        </div>
      </div>

      {/* Secciones */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Denominaciones */}
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <FiDollarSign className="w-4 h-4 text-green-600" />
              {t('shiftCard.cashCount')}
            </h4>
            {!isEditingDenominations && shift.status === 'open' && (
              <button
                onClick={() => setIsEditingDenominations(true)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                {t('shiftCard.edit')}
              </button>
            )}
          </div>

          {isEditingDenominations ? (
            <DenominationForm
              shiftId={shiftId}
              initialDenominations={shift.denominations}
              onSave={() => setIsEditingDenominations(false)}
              onCancel={() => setIsEditingDenominations(false)}
            />
          ) : shift?.denominations && shift.denominations.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {shift.denominations.map((denom: CashierDenomination) => {
                  const denominationValue = parseFloat(denom.denomination)
                  const isBill = denominationValue >= 5

                  return (
                    <div
                      key={denom.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {denominationValue >= 1
                            ? `${denominationValue.toFixed(0)}€`
                            : `${(denominationValue * 100).toFixed(0)}¢`}
                        </span>
                        {isBill && (
                          <span className="text-[10px] px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            x{denom.quantity}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {parseFloat(denom.total).toFixed(2)}€
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {t('shiftCard.totalCashCounted')}
                </span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {shift.denominations
                    .reduce((sum: number, d: CashierDenomination) => sum + parseFloat(d.total), 0)
                    .toFixed(2)}
                  €
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              <p>{t('shiftCard.noCashCount')}</p>
              <p className="text-xs mt-1">{t('shiftCard.edit')}</p>
            </div>
          )}
        </div>

        {/* Pagos Electrónicos */}
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              💳 {t('shiftCard.electronicPayments')}
            </h4>
            {!isEditingPayments && shift.status === 'open' && (
              <button
                onClick={() => setIsEditingPayments(true)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                {t('shiftCard.edit')}
              </button>
            )}
          </div>

          {isEditingPayments ? (
            <PaymentForm
              shiftId={shiftId}
              initialPayments={shift.payments}
              onSave={() => setIsEditingPayments(false)}
              onCancel={() => setIsEditingPayments(false)}
            />
          ) : shift?.payments && shift.payments.length > 0 ? (
            <div className="space-y-3">
              {shift.payments.map((payment: CashierPayment) => {
                const methodIcons: Record<string, string> = {
                  TARJETA: '💳',
                  'TARJETA CRÉDITO O DÉBITO': '💳',
                  BACS: '🏦',
                  'WEB PAYMENT': '🌐',
                  TRANSFERENCIA: '💸',
                  OTROS: '📝',
                }

                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {methodIcons[payment.payment_method_name || ''] || '💳'}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {payment.payment_method_name || 'Pago'}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {parseFloat(payment.amount).toFixed(2)}€
                    </span>
                  </div>
                )
              })}

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 mt-2">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {t('shiftCard.totalElectronicPayments')}
                </span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {shift.payments
                    .reduce((sum: number, p: CashierPayment) => sum + parseFloat(p.amount), 0)
                    .toFixed(2)}
                  €
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              <p>{t('shiftCard.noPayments')}</p>
              <p className="text-xs mt-1">{t('shiftCard.edit')}</p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Vales - Muestra vales del turno o vales pendientes del día en cierre */}
      <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            📝{' '}
            {shiftType === 'closing'
              ? t('shiftCard.pendingDayVouchers')
              : t('shiftCard.shiftVouchers')}
            <span className="text-xs text-gray-500 dark:text-gray-400">({vouchersCount})</span>
          </h4>
          {shift.status === 'open' &&
            shiftType !== 'closing' &&
            (shift.vouchers?.length || 0) < 5 && (
              <button
                onClick={() => setShowCreateVoucherModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
              >
                {t('shiftCard.newVoucher')}
              </button>
            )}
        </div>

        <VoucherList
          vouchers={vouchersToDisplay}
          canJustify={shiftType === 'closing'}
          onJustify={handleJustifyVoucher}
        />
      </div>

      {/* Modal Crear Vale */}
      <CreateVoucherModal
        isOpen={showCreateVoucherModal}
        onClose={() => setShowCreateVoucherModal(false)}
        shiftId={shiftId}
        currentVouchersCount={shift.vouchers?.length || 0}
      />

      {/* Botón cerrar turno */}
      {shift.status === 'open' && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCloseShiftModal(true)}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <FiCheckCircle className="w-4 h-4" />
            {t('shiftCard.closeShift')}
          </button>
        </div>
      )}

      {/* Modal Cerrar Turno */}
      <CloseShiftModal
        isOpen={showCloseShiftModal}
        onClose={() => setShowCloseShiftModal(false)}
        shift={shift}
        shiftType={shiftType}
      />
    </div>
  )
}
