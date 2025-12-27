// app/components/restaurant/tabs/OrdersTab.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiCheck,
  FiClock,
  FiTruck,
  FiX,
  FiCalendar,
  FiPackage,
} from 'react-icons/fi'

// Types
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

interface OrderItem {
  productName: string
  quantity: number
  unit: string
  unitPrice: number
}

interface Order {
  id: number
  supplier: string
  orderDate: string
  expectedDate: string
  status: OrderStatus
  items: OrderItem[]
  total: number
  notes?: string
}

// Mock data
const mockOrders: Order[] = [
  {
    id: 1001,
    supplier: 'Coca-Cola',
    orderDate: '2025-12-15',
    expectedDate: '2025-12-18',
    status: 'confirmed',
    items: [
      { productName: 'Coca-Cola 330ml', quantity: 120, unit: 'uds', unitPrice: 0.65 },
      { productName: 'Fanta Naranja 330ml', quantity: 60, unit: 'uds', unitPrice: 0.65 },
      { productName: 'Sprite 330ml', quantity: 48, unit: 'uds', unitPrice: 0.65 },
    ],
    total: 148.2,
  },
  {
    id: 1002,
    supplier: 'Carnes López',
    orderDate: '2025-12-16',
    expectedDate: '2025-12-17',
    status: 'shipped',
    items: [
      { productName: 'Solomillo de Ternera', quantity: 10, unit: 'kg', unitPrice: 18.5 },
      { productName: 'Entrecot', quantity: 8, unit: 'kg', unitPrice: 16.0 },
    ],
    total: 313.0,
    notes: 'Entrega antes de las 10:00',
  },
  {
    id: 1003,
    supplier: 'Pascual',
    orderDate: '2025-12-17',
    expectedDate: '2025-12-19',
    status: 'pending',
    items: [
      { productName: 'Leche Entera 1L', quantity: 48, unit: 'uds', unitPrice: 0.95 },
      { productName: 'Leche Desnatada 1L', quantity: 24, unit: 'uds', unitPrice: 0.95 },
      { productName: 'Nata Cocina 1L', quantity: 12, unit: 'uds', unitPrice: 2.1 },
    ],
    total: 93.6,
  },
  {
    id: 1004,
    supplier: 'Frutas García',
    orderDate: '2025-12-14',
    expectedDate: '2025-12-15',
    status: 'delivered',
    items: [
      { productName: 'Tomates Cherry', quantity: 5, unit: 'kg', unitPrice: 3.8 },
      { productName: 'Lechuga Romana', quantity: 20, unit: 'uds', unitPrice: 1.2 },
      { productName: 'Pimientos Rojos', quantity: 4, unit: 'kg', unitPrice: 2.5 },
    ],
    total: 53.0,
  },
  {
    id: 1005,
    supplier: 'Cleanpro',
    orderDate: '2025-12-13',
    expectedDate: '2025-12-16',
    status: 'delivered',
    items: [
      { productName: 'Detergente Lavavajillas', quantity: 24, unit: 'uds', unitPrice: 2.8 },
      { productName: 'Lejía 5L', quantity: 10, unit: 'uds', unitPrice: 3.5 },
    ],
    total: 102.2,
  },
  {
    id: 1006,
    supplier: 'Hijos de Rivera',
    orderDate: '2025-12-12',
    expectedDate: '2025-12-14',
    status: 'cancelled',
    items: [
      { productName: 'Cerveza Estrella Galicia', quantity: 120, unit: 'uds', unitPrice: 0.75 },
    ],
    total: 90.0,
    notes: 'Cancelado por falta de stock del proveedor',
  },
]

export function OrdersTab() {
  const t = useTranslations('restaurant')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusConfig = (status: OrderStatus) => {
    const configs: Record<
      OrderStatus,
      { color: string; labelKey: string; icon: React.ElementType }
    > = {
      pending: {
        color:
          'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        labelKey: 'orders.status.pending',
        icon: FiClock,
      },
      confirmed: {
        color:
          'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        labelKey: 'orders.status.confirmed',
        icon: FiCheck,
      },
      shipped: {
        color:
          'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
        labelKey: 'orders.status.inTransit',
        icon: FiTruck,
      },
      delivered: {
        color:
          'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        labelKey: 'orders.status.delivered',
        icon: FiCheck,
      },
      cancelled: {
        color:
          'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        labelKey: 'orders.status.cancelled',
        icon: FiX,
      },
    }
    return configs[status]
  }

  // Stats
  const pendingCount = mockOrders.filter((o) => o.status === 'pending').length
  const inTransitCount = mockOrders.filter((o) => o.status === 'shipped').length
  const totalPendingValue = mockOrders
    .filter((o) => ['pending', 'confirmed', 'shipped'].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="space-y-4">
      {/* Order Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/20 rounded">
              <FiClock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400">
                {t('orders.summary.pending')}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/20 rounded">
              <FiTruck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400">
                {t('orders.summary.inTransit')}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{inTransitCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded">
              <FiPackage className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400">
                {t('orders.summary.pendingValue')}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalPendingValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('orders.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 dark:bg-[#151b23] dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-[#151b23] dark:text-gray-200"
        >
          <option value="all">{t('orders.allStatuses')}</option>
          <option value="pending">{t('orders.status.pending')}</option>
          <option value="confirmed">{t('orders.status.confirmed')}</option>
          <option value="shipped">{t('orders.status.inTransit')}</option>
          <option value="delivered">{t('orders.status.delivered')}</option>
          <option value="cancelled">{t('orders.status.cancelled')}</option>
        </select>

        {/* New Order Button */}
        <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 dark:bg-green-700 text-white text-xs font-medium rounded-md hover:bg-green-700 dark:hover:bg-green-800 transition-colors">
          <FiPlus className="w-3.5 h-3.5" />
          {t('orders.newOrder')}
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('orders.noOrders')}</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status)
            const StatusIcon = statusConfig.icon
            const isExpanded = expandedOrder === order.id

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
              >
                {/* Order Header */}
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 dark:text-gray-500">
                          #{order.id}
                        </span>
                        <h3 className="font-semibold text-xs text-gray-900 dark:text-gray-100">
                          {order.supplier}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-3 h-3" />
                          {formatDate(order.orderDate)}
                        </span>
                        <span>
                          {t('orders.delivery')}{' '}
                          <span className="font-medium">{formatDate(order.expectedDate)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(order.total)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {t(statusConfig.labelKey)}
                      </span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-500">
                    {order.items.length}{' '}
                    {order.items.length !== 1 ? t('orders.products') : t('orders.product')} ·{' '}
                    {order.items
                      .slice(0, 2)
                      .map((i) => i.productName)
                      .join(', ')}
                    {order.items.length > 2 &&
                      ` ${t('orders.andMore', { count: order.items.length - 2 })}`}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d1117] p-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10px] text-gray-600 dark:text-gray-400 uppercase">
                          <th className="text-left pb-2">{t('orders.table.product')}</th>
                          <th className="text-center pb-2">{t('orders.table.quantity')}</th>
                          <th className="text-right pb-2">{t('orders.table.unitPrice')}</th>
                          <th className="text-right pb-2">{t('orders.table.subtotal')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {order.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 text-gray-900 dark:text-gray-100">
                              {item.productName}
                            </td>
                            <td className="py-1.5 text-center text-gray-600 dark:text-gray-400">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-1.5 text-right text-gray-600 dark:text-gray-400">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="py-1.5 text-right font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-semibold">
                          <td
                            colSpan={3}
                            className="pt-2 text-right text-gray-700 dark:text-gray-300"
                          >
                            {t('orders.table.total')}
                          </td>
                          <td className="pt-2 text-right text-gray-900 dark:text-gray-100">
                            {formatCurrency(order.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    {order.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-[10px] text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{t('orders.notes')}</span> {order.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                            <FiX className="w-3 h-3" />
                            {t('orders.cancel')}
                          </button>
                          <button className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                            <FiCheck className="w-3 h-3" />
                            {t('orders.confirm')}
                          </button>
                        </>
                      )}
                      {order.status === 'shipped' && (
                        <button className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors">
                          <FiCheck className="w-3 h-3" />
                          {t('orders.markDelivered')}
                        </button>
                      )}
                      <button className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                        <FiEye className="w-3 h-3" />
                        {t('orders.viewDetail')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
