// app/components/cashier/DenominationForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { FiSave, FiX } from 'react-icons/fi'
import { useUpdateDenominations } from '@/app/lib/cashier/queries'
import { toast } from 'react-hot-toast'

interface DenominationFormProps {
  shiftId: number
  initialDenominations?: Array<{
    id: number
    denomination: string
    quantity: number
    total: string
  }>
  onSave: () => void
  onCancel: () => void
}

const EURO_DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01]

export default function DenominationForm({
  shiftId,
  initialDenominations = [],
  onSave,
  onCancel,
}: DenominationFormProps) {
  const t = useTranslations('cashier')
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [cashCounted, setCashCounted] = useState(0)

  const updateMutation = useUpdateDenominations()

  useEffect(() => {
    const initial: Record<number, number> = {}
    EURO_DENOMINATIONS.forEach((denom) => {
      const found = initialDenominations.find((d) => parseFloat(d.denomination) === denom)
      initial[denom] = found?.quantity || 0
    })
    setQuantities(initial)
  }, [initialDenominations])

  useEffect(() => {
    const total = EURO_DENOMINATIONS.reduce((sum, denom) => {
      return sum + denom * (quantities[denom] || 0)
    }, 0)
    setCashCounted(total)
  }, [quantities])

  const handleQuantityChange = (denomination: number, value: string) => {
    const quantity = parseInt(value) || 0
    setQuantities((prev) => ({ ...prev, [denomination]: quantity }))
  }

  const completedCount = EURO_DENOMINATIONS.filter((d) => quantities[d] > 0).length

  const handleSave = async () => {
    try {
      const denominations = EURO_DENOMINATIONS.map((denom) => ({
        denomination: denom,
        quantity: quantities[denom] || 0,
      }))

      await updateMutation.mutateAsync({
        shiftId,
        denominations,
      })

      toast.success(t('denomination.countSaved'))
      setTimeout(() => onSave(), 100)
    } catch (error) {
      console.error('Error guardando denominaciones:', error)
      const errorMessage = error instanceof Error ? error.message : t('error.saveError')
      toast.error(errorMessage)
    }
  }

  const isLoading = updateMutation.isPending

  return (
    <div className="space-y-3">
      {/* Header compacto - IGUAL que PaymentForm */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">
              {t('denomination.cashCounted')}
            </p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {cashCounted.toFixed(2)}€
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">
              {t('denomination.completed')}
            </p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {completedCount}/{EURO_DENOMINATIONS.length}
            </p>
          </div>
        </div>
      </div>

      {/* Grid compacto - 2 columnas IGUAL que PaymentForm */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {EURO_DENOMINATIONS.map((denom) => {
          const qty = quantities[denom] || 0
          const subtotal = denom * qty
          const hasValue = qty > 0

          return (
            <div
              key={denom}
              className={`bg-white dark:bg-[#0d1117] border rounded-lg p-2 transition-all ${
                hasValue
                  ? 'border-green-300 dark:border-green-700 ring-1 ring-green-100 dark:ring-green-900/30'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                {/* Emoji según tipo */}
                {denom >= 5 && <span className="text-lg">💶</span>}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      {denom >= 1 ? `${denom}€` : `${(denom * 100).toFixed(0)}¢`}
                    </p>
                    {/* Badge Billete/Moneda */}
                    {denom >= 5 && (
                      <span className="text-[11px] px-1 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded font-medium">
                        {t('denomination.bill')}
                      </span>
                    )}
                    {denom < 5 && (
                      <span className="text-[11px] px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded font-medium">
                        {t('denomination.coin')}
                      </span>
                    )}
                  </div>
                  {hasValue && (
                    <p className="text-[12px] text-green-600 dark:text-green-400">
                      ✓ {subtotal.toFixed(2)}€
                    </p>
                  )}
                </div>
              </div>

              <input
                type="number"
                inputMode="numeric"
                value={qty === 0 ? '' : qty}
                onChange={(e) => handleQuantityChange(denom, e.target.value)}
                placeholder="0"
                min="0"
                disabled={isLoading}
                className="w-full px-2 py-1.5 text-center text-base font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-[#151b23] border border-gray-300 dark:border-gray-700 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
          )
        })}
      </div>

      {/* Botones - IGUAL que PaymentForm */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1.5"
        >
          <FiX className="w-3 h-3" />
          {t('common.cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 flex items-center gap-1.5"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('common.saving')}
            </>
          ) : (
            <>
              <FiSave className="w-3 h-3" />
              {t('common.save')}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
