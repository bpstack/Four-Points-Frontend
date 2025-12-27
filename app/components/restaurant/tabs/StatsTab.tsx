// app/components/restaurant/tabs/StatsTab.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FiTrendingUp, FiDollarSign, FiShoppingCart, FiPackage } from 'react-icons/fi'

// Mock data
const monthlyData = [
  { month: 'Jul', revenue: 12500, expenses: 8200 },
  { month: 'Ago', revenue: 14200, expenses: 9100 },
  { month: 'Sep', revenue: 11800, expenses: 7800 },
  { month: 'Oct', revenue: 15600, expenses: 10200 },
  { month: 'Nov', revenue: 16800, expenses: 11500 },
  { month: 'Dic', revenue: 18200, expenses: 12100 },
]

const topProducts = [
  { name: 'Coca-Cola 330ml', quantity: 450, revenue: 585 },
  { name: 'Café Solo', quantity: 380, revenue: 456 },
  { name: 'Cerveza Estrella Galicia', quantity: 320, revenue: 480 },
  { name: 'Agua Mineral 500ml', quantity: 280, revenue: 140 },
  { name: 'Tostada con Tomate', quantity: 250, revenue: 500 },
]

const topSuppliers = [
  { name: 'Coca-Cola', orders: 12, total: 1845.6 },
  { name: 'Carnes López', orders: 8, total: 2480.0 },
  { name: 'Pascual', orders: 10, total: 890.5 },
  { name: 'Frutas García', orders: 15, total: 720.0 },
  { name: 'Hijos de Rivera', orders: 6, total: 540.0 },
]

const expensesByCategory = [
  { category: 'Bebidas', amount: 3200, percentage: 26 },
  { category: 'Carnes', amount: 2800, percentage: 23 },
  { category: 'Lácteos', amount: 1500, percentage: 12 },
  { category: 'Frutas y Verduras', amount: 1200, percentage: 10 },
  { category: 'Panadería', amount: 800, percentage: 7 },
  { category: 'Limpieza', amount: 600, percentage: 5 },
  { category: 'Otros', amount: 2000, percentage: 17 },
]

export function StatsTab() {
  const t = useTranslations('restaurant')
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  // Calculate totals
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0)
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0)
  const profit = totalRevenue - totalExpenses
  const profitMargin = ((profit / totalRevenue) * 100).toFixed(1)

  // Get max value for chart scaling
  const maxValue = Math.max(...monthlyData.flatMap((m) => [m.revenue, m.expenses]))

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('statsTab.financialSummary')}
        </h2>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-0.5">
          {(['week', 'month', 'quarter'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                period === p
                  ? 'bg-white dark:bg-[#151b23] text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t(`statsTab.periods.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                {t('statsTab.revenue')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {formatCurrency(totalRevenue)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <FiTrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-green-600 dark:text-green-400">+12.5%</span>
              </div>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                {t('statsTab.expenses')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {formatCurrency(totalExpenses)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <FiTrendingUp className="w-3 h-3 text-red-500" />
                <span className="text-[10px] text-red-600 dark:text-red-400">+8.2%</span>
              </div>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <FiShoppingCart className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                {t('statsTab.profit')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {formatCurrency(profit)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <FiTrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-green-600 dark:text-green-400">+15.3%</span>
              </div>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FiTrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                {t('statsTab.margin')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {profitMargin}%
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                {t('statsTab.ofProfit')}
              </p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FiPackage className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Expenses Chart */}
        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('statsTab.revenueVsExpenses')}
          </h3>
          <div className="space-y-3">
            {monthlyData.map((data) => (
              <div key={data.month} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600 dark:text-gray-400 w-8">{data.month}</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {formatCurrency(data.revenue - data.expenses)}
                  </span>
                </div>
                <div className="flex gap-1 h-4">
                  {/* Revenue bar */}
                  <div
                    className="bg-green-500 dark:bg-green-600 rounded-sm"
                    style={{ width: `${(data.revenue / maxValue) * 100}%` }}
                    title={`${t('statsTab.revenue')}: ${formatCurrency(data.revenue)}`}
                  />
                </div>
                <div className="flex gap-1 h-4">
                  {/* Expenses bar */}
                  <div
                    className="bg-red-400 dark:bg-red-600 rounded-sm"
                    style={{ width: `${(data.expenses / maxValue) * 100}%` }}
                    title={`${t('statsTab.expenses')}: ${formatCurrency(data.expenses)}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded-sm" />
              <span className="text-gray-600 dark:text-gray-400">{t('statsTab.revenue')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 dark:bg-red-600 rounded-sm" />
              <span className="text-gray-600 dark:text-gray-400">{t('statsTab.expenses')}</span>
            </div>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('statsTab.expensesByCategory')}
          </h3>
          <div className="space-y-2">
            {expensesByCategory.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-700 dark:text-gray-300">{cat.category}</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {formatCurrency(cat.amount)} ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 dark:bg-blue-600 rounded-full transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {t('statsTab.topProducts')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0d1117]">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    {t('statsTab.table.product')}
                  </th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    {t('statsTab.table.quantity')}
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    {t('statsTab.table.revenue')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {topProducts.map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#0d1117]">
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                      {product.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-center text-gray-600 dark:text-gray-400">
                      {product.quantity}
                    </td>
                    <td className="px-3 py-2 text-xs text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {t('statsTab.topSuppliers')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0d1117]">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    {t('statsTab.table.supplier')}
                  </th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    {t('statsTab.table.orders')}
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    {t('statsTab.table.total')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {topSuppliers.map((supplier, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#0d1117]">
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                      {supplier.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-center text-gray-600 dark:text-gray-400">
                      {supplier.orders}
                    </td>
                    <td className="px-3 py-2 text-xs text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(supplier.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
