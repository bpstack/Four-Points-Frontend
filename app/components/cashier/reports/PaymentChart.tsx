'use client'

import { useTranslations } from 'next-intl'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import type { MonthlyReport } from '@/app/lib/cashier/types'

interface PaymentChartProps {
  report: MonthlyReport
  viewMode?: 'pie' | 'bar'
}

interface ChartDataItem {
  name: string
  value: number
  percentage: number
  color: string
  [key: string]: string | number
}

// ✅ Colores más diferenciados
const COLORS = {
  EFECTIVO: '#10b981', // green
  'TARJETA CRÉDITO O DÉBITO': '#3b82f6', // blue
  TARJETA: '#3b82f6', // blue (alternativo)
  BACS: '#8b5cf6', // violet
  'WEB PAYMENT': '#f59e0b', // amber
  TRANSFERENCIA: '#ec4899', // pink
  OTROS: '#6b7280', // gray
}

export default function PaymentChart({ report, viewMode = 'pie' }: PaymentChartProps) {
  const t = useTranslations('cashier')

  const totals = {
    grand_total:
      typeof report?.totals?.grand_total === 'string'
        ? parseFloat(report.totals.grand_total)
        : report?.totals?.grand_total || 0,
    total_days:
      typeof report?.period?.total_days === 'string'
        ? parseInt(report.period.total_days)
        : report?.period?.total_days || 1,
  }

  // Filtrar métodos con valor > 0 para el gráfico
  const chartData: ChartDataItem[] = (report?.payment_methods_breakdown || [])
    .map((method) => {
      const totalAmount =
        typeof method.total_amount === 'string'
          ? parseFloat(method.total_amount)
          : method.total_amount || 0
      const percentage =
        typeof method.percentage === 'string'
          ? parseFloat(method.percentage)
          : method.percentage || 0

      return {
        name: method.method_name,
        value: totalAmount,
        percentage: percentage,
        color: COLORS[method.method_name as keyof typeof COLORS] || '#6b7280',
      }
    })
    .filter((item) => item.value > 0) // Solo mostrar métodos con dinero

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ name: string; value: number; payload: { percentage: number } }>
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 dark:text-white">{payload[0].name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {payload[0].value.toFixed(2)}€
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
            {payload[0].payload.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  // ✅ Etiquetas mejoradas - solo porcentaje
  const renderCustomizedLabel = (props: {
    cx?: number
    cy?: number
    midAngle?: number
    innerRadius?: number
    outerRadius?: number
    percent?: number
    name?: string
  }) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props

    if (!cx || !cy || midAngle === undefined || !innerRadius || !outerRadius || !percent)
      return null
    if (percent < 0.05) return null // No mostrar etiquetas < 5%

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-bold"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (viewMode === 'bar') {
    return (
      <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          {t('reports.distributionByPaymentMethod')}
        </h3>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
              tickFormatter={(value) => `${value}€`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry: ChartDataItem, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {chartData.map((entry: ChartDataItem) => (
            <div
              key={entry.name}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{entry.name}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {entry.value.toFixed(2)}€
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        {t('reports.distributionByPaymentMethod')}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ✅ Gráfico de pastel mejorado */}
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((entry: ChartDataItem, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ✅ Lista mejorada */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {t('reports.detailedBreakdown')}
          </h4>
          {chartData
            .sort((a: ChartDataItem, b: ChartDataItem) => b.value - a.value)
            .map((entry: ChartDataItem) => (
              <div
                key={entry.name}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {entry.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden mr-3">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${entry.percentage}%`,
                        backgroundColor: entry.color,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    {entry.value.toFixed(2)}€
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Resumen totales */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 mb-1">
              {t('summary.grandTotal')}
            </p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {totals.grand_total.toFixed(2)}€
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {t('reports.averagePerDay')}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(totals.grand_total / totals.total_days).toFixed(2)}€
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
