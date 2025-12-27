// app/components/groups/tabs/PaymentsTab.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useGroupPayments, useGroup } from '@/app/lib/groups'
import { useGroupStore } from '@/app/stores/useGroupStore'
import { PaymentCard } from '../cards/PaymentCard'
import { EmptyState } from '../shared/EmptyState'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { formatCurrency } from '@/app/lib/helpers/utils'
import { FiPlus, FiDollarSign, FiFileText, FiChevronDown, FiChevronUp } from 'react-icons/fi'

export function PaymentsTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentGroup, setCurrentGroup, payments: storePayments } = useGroupStore()
  const t = useTranslations('groups')

  const groupId = currentGroup?.id
  const { data: paymentsData, isLoading: isLoadingPayments } = useGroupPayments(groupId)
  const { data: groupData } = useGroup(groupId)

  useEffect(() => {
    if (groupData) {
      setCurrentGroup(groupData)
    }
  }, [groupData, setCurrentGroup])

  const payments = useMemo(
    () => paymentsData?.payments || storePayments || [],
    [paymentsData, storePayments]
  )

  const [balance, setBalance] = useState({
    total_amount: 0,
    total_paid: 0,
    remaining: 0,
    percentage_paid: 0,
  })

  const [showBreakdown, setShowBreakdown] = useState(false)

  // Calcular balance - ARREGLADO (parseando strings a números)
  useEffect(() => {
    const parseAmount = (value: unknown): number => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') return parseFloat(value) || 0
      return 0
    }

    const group_total = parseAmount(groupData?.total_amount ?? currentGroup?.total_amount)
    const payments_total = payments.reduce((sum, p) => sum + parseAmount(p.amount), 0)
    const final_total_amount = group_total > 0 ? group_total : payments_total

    const total_paid = payments.reduce((sum, p) => sum + parseAmount(p.amount_paid), 0)
    const remaining = final_total_amount - total_paid
    const percentage_paid =
      final_total_amount > 0 ? Math.round((total_paid / final_total_amount) * 100) : 0

    setBalance({
      total_amount: final_total_amount,
      total_paid,
      remaining: Math.max(remaining, 0),
      percentage_paid: Math.max(0, Math.min(percentage_paid, 100)),
    })
  }, [payments, groupData, currentGroup])

  const handleCreatePayment = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('panel', 'new-payment')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleEditPayment = (paymentId: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('panel', `edit-payment-${paymentId}`)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  if (isLoadingPayments) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message={t('payments.loadingPayments')} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiDollarSign className="w-5 h-5" />
            {t('payments.paymentBalance')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Amount */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('payments.totalAmount')}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(balance.total_amount, currentGroup?.currency)}
            </p>
          </div>

          {/* Total Paid */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('payments.paid')}</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(balance.total_paid, currentGroup?.currency)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {balance.percentage_paid}% {t('payments.ofTotal')}
            </p>
          </div>

          {/* Remaining */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('payments.pending')}</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(balance.remaining, currentGroup?.currency)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {100 - balance.percentage_paid}% {t('payments.remaining')}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t('payments.paymentProgress')}
            </span>
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {balance.percentage_paid}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(balance.percentage_paid, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Payments List Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FiFileText className="w-4 h-4" />
          {t('payments.scheduledPayments')} ({payments.length})
        </h3>
        <button
          onClick={handleCreatePayment}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 dark:bg-green-700 text-white text-xs font-medium rounded-md hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
        >
          <FiPlus className="w-3.5 h-3.5" />
          {t('payments.newPayment')}
        </button>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <EmptyState
          icon={<FiDollarSign className="w-12 h-12" />}
          title={t('payments.noPayments')}
          description={t('payments.createFirstPayment')}
          action={
            <button
              onClick={handleCreatePayment}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              {t('payments.createFirst')}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {payments
            .sort((a, b) => {
              // Ordenar por payment_order si existe, sino por fecha
              if (a.payment_order && b.payment_order) {
                return a.payment_order - b.payment_order
              }
              return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
            })
            .map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                onEdit={() => handleEditPayment(payment.id)}
              />
            ))}
        </div>
      )}

      {/* Quick Stats */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-[#151b23] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {t('payments.quickStats')}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">{t('payments.totalPayments')}</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{payments.length}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">{t('payments.paidPayments')}</p>
              <p className="font-semibold text-green-600 dark:text-green-400">
                {payments.filter((p) => p.status === 'paid').length}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">
                {t('payments.pendingPayments')}
              </p>
              <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                {payments.filter((p) => p.status === 'pending').length}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">
                {t('payments.partialPayments')}
              </p>
              <p className="font-semibold text-orange-600 dark:text-orange-400">
                {payments.filter((p) => p.status === 'partial').length}
              </p>
            </div>
          </div>

          {/* NUEVO: Desplegable Desglose Detallado */}
          {payments.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-md transition-colors"
              >
                <span>{t('payments.viewBreakdown')}</span>
                {showBreakdown ? (
                  <FiChevronUp className="w-4 h-4" />
                ) : (
                  <FiChevronDown className="w-4 h-4" />
                )}
              </button>

              {showBreakdown && (
                <div className="mt-3 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
                  {/* Vista Desktop - Tabla */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {t('payments.payment')}
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {t('payments.total')}
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {t('payments.paid')}
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {t('payments.remaining_amount')}
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-[#0d1117]">
                        {payments
                          .sort((a, b) => (a.payment_order || 0) - (b.payment_order || 0))
                          .map((payment) => {
                            const totalPago = parseFloat(String(payment.amount || 0))
                            const pagado = parseFloat(String(payment.amount_paid || 0))
                            const restante = totalPago - pagado
                            const progreso = totalPago > 0 ? (pagado / totalPago) * 100 : 0

                            const getOrderLabel = (order: number) => {
                              if (order === 99) return t('payments.final')
                              return `${order}º`
                            }

                            return (
                              <tr
                                key={payment.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                              >
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-600">
                                      {getOrderLabel(payment.payment_order || 0)}
                                    </span>
                                    <span className="text-xs text-gray-900 dark:text-gray-100">
                                      {payment.payment_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                    {totalPago.toLocaleString('es-ES', {
                                      minimumFractionDigits: 2,
                                    })}{' '}
                                    €
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <span
                                    className={`text-xs font-medium ${
                                      pagado > 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-400 dark:text-gray-600'
                                    }`}
                                  >
                                    {pagado.toLocaleString('es-ES', {
                                      minimumFractionDigits: 2,
                                    })}{' '}
                                    €
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <span
                                    className={`text-xs font-medium ${
                                      restante > 0
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-gray-400 dark:text-gray-600'
                                    }`}
                                  >
                                    {restante.toLocaleString('es-ES', {
                                      minimumFractionDigits: 2,
                                    })}{' '}
                                    €
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {progreso.toFixed(0)}%
                                  </span>
                                </td>
                              </tr>
                            )
                          })}

                        {/* Fila TOTALES */}
                        <tr className="bg-gray-50 dark:bg-gray-900/70 font-semibold">
                          <td className="px-4 py-2">
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                              {t('payments.totals')}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              {payments
                                .reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0)
                                .toLocaleString('es-ES', {
                                  minimumFractionDigits: 2,
                                })}{' '}
                              €
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span className="text-xs font-bold text-green-600 dark:text-green-400">
                              {payments
                                .reduce((sum, p) => sum + parseFloat(String(p.amount_paid || 0)), 0)
                                .toLocaleString('es-ES', {
                                  minimumFractionDigits: 2,
                                })}{' '}
                              €
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                              {payments
                                .reduce(
                                  (sum, p) =>
                                    sum +
                                    (parseFloat(String(p.amount || 0)) -
                                      parseFloat(String(p.amount_paid || 0))),
                                  0
                                )
                                .toLocaleString('es-ES', {
                                  minimumFractionDigits: 2,
                                })}{' '}
                              €
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                              {balance.percentage_paid}%
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Vista Mobile - Cards */}
                  <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-[#0d1117]">
                    {payments
                      .sort((a, b) => (a.payment_order || 0) - (b.payment_order || 0))
                      .map((payment) => {
                        const totalPago = parseFloat(String(payment.amount || 0))
                        const pagado = parseFloat(String(payment.amount_paid || 0))
                        const restante = totalPago - pagado
                        const progreso = totalPago > 0 ? (pagado / totalPago) * 100 : 0

                        const getOrderLabel = (order: number) => {
                          if (order === 99) return t('payments.final')
                          return `${order}º`
                        }

                        return (
                          <div key={payment.id} className="p-3 space-y-2">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-600">
                                  {getOrderLabel(payment.payment_order || 0)}
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {payment.payment_name}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {progreso.toFixed(0)}%
                              </span>
                            </div>

                            {/* Amounts Grid */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <p className="text-gray-600 dark:text-gray-400 mb-0.5">
                                  {t('payments.total')}
                                </p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                  {totalPago.toLocaleString('es-ES', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}{' '}
                                  €
                                </p>
                              </div>
                              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <p className="text-gray-600 dark:text-gray-400 mb-0.5">
                                  {t('payments.paid')}
                                </p>
                                <p
                                  className={`font-semibold ${
                                    pagado > 0
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-gray-400 dark:text-gray-600'
                                  }`}
                                >
                                  {pagado.toLocaleString('es-ES', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}{' '}
                                  €
                                </p>
                              </div>
                              <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                                <p className="text-gray-600 dark:text-gray-400 mb-0.5">
                                  {t('payments.remaining_amount')}
                                </p>
                                <p
                                  className={`font-semibold ${
                                    restante > 0
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-gray-400 dark:text-gray-600'
                                  }`}
                                >
                                  {restante.toLocaleString('es-ES', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}{' '}
                                  €
                                </p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
                                style={{ width: `${progreso}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}

                    {/* Totales Mobile */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/70 space-y-2">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {t('payments.totals')}
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-gray-600 dark:text-gray-400 mb-0.5">
                            {t('payments.total')}
                          </p>
                          <p className="font-bold text-blue-600 dark:text-blue-400">
                            {payments
                              .reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0)
                              .toLocaleString('es-ES', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}{' '}
                            €
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600 dark:text-gray-400 mb-0.5">
                            {t('payments.paid')}
                          </p>
                          <p className="font-bold text-green-600 dark:text-green-400">
                            {payments
                              .reduce((sum, p) => sum + parseFloat(String(p.amount_paid || 0)), 0)
                              .toLocaleString('es-ES', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}{' '}
                            €
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600 dark:text-gray-400 mb-0.5">
                            {t('payments.remaining_amount')}
                          </p>
                          <p className="font-bold text-amber-600 dark:text-amber-400">
                            {payments
                              .reduce(
                                (sum, p) =>
                                  sum +
                                  (parseFloat(String(p.amount || 0)) -
                                    parseFloat(String(p.amount_paid || 0))),
                                0
                              )
                              .toLocaleString('es-ES', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}{' '}
                            €
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {t('payments.progress')}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          {balance.percentage_paid}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
