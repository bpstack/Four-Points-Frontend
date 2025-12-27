// app/components/restaurant/tabs/InventoryTab.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiAlertTriangle } from 'react-icons/fi'

// Mock data types
interface Product {
  id: number
  name: string
  category: string
  stock: number
  minStock: number
  unit: string
  price: number
  supplier: string
  lastUpdated: string
}

interface Category {
  id: string
  name: string
  count: number
}

// Mock data
const _mockCategories: Category[] = [
  { id: 'all', name: 'Todas', count: 156 },
  { id: 'bebidas', name: 'Bebidas', count: 42 },
  { id: 'carnes', name: 'Carnes', count: 28 },
  { id: 'lacteos', name: 'Lácteos', count: 18 },
  { id: 'frutas', name: 'Frutas y Verduras', count: 35 },
  { id: 'panaderia', name: 'Panadería', count: 15 },
  { id: 'limpieza', name: 'Limpieza', count: 18 },
]

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Coca-Cola 330ml',
    category: 'bebidas',
    stock: 120,
    minStock: 50,
    unit: 'uds',
    price: 0.85,
    supplier: 'Coca-Cola',
    lastUpdated: '2025-12-15',
  },
  {
    id: 2,
    name: 'Leche Entera 1L',
    category: 'lacteos',
    stock: 8,
    minStock: 20,
    unit: 'uds',
    price: 1.15,
    supplier: 'Pascual',
    lastUpdated: '2025-12-16',
  },
  {
    id: 3,
    name: 'Solomillo de Ternera',
    category: 'carnes',
    stock: 15,
    minStock: 10,
    unit: 'kg',
    price: 24.5,
    supplier: 'Carnes López',
    lastUpdated: '2025-12-14',
  },
  {
    id: 4,
    name: 'Pan Baguette',
    category: 'panaderia',
    stock: 3,
    minStock: 15,
    unit: 'uds',
    price: 0.75,
    supplier: 'Panadería Local',
    lastUpdated: '2025-12-17',
  },
  {
    id: 5,
    name: 'Agua Mineral 500ml',
    category: 'bebidas',
    stock: 200,
    minStock: 100,
    unit: 'uds',
    price: 0.35,
    supplier: 'Font Vella',
    lastUpdated: '2025-12-15',
  },
  {
    id: 6,
    name: 'Tomates Cherry',
    category: 'frutas',
    stock: 5,
    minStock: 10,
    unit: 'kg',
    price: 4.2,
    supplier: 'Frutas García',
    lastUpdated: '2025-12-16',
  },
  {
    id: 7,
    name: 'Queso Manchego Curado',
    category: 'lacteos',
    stock: 12,
    minStock: 8,
    unit: 'kg',
    price: 18.9,
    supplier: 'Quesería Artesana',
    lastUpdated: '2025-12-13',
  },
  {
    id: 8,
    name: 'Pechuga de Pollo',
    category: 'carnes',
    stock: 25,
    minStock: 15,
    unit: 'kg',
    price: 7.5,
    supplier: 'Avícola Sur',
    lastUpdated: '2025-12-15',
  },
  {
    id: 9,
    name: 'Detergente Lavavajillas',
    category: 'limpieza',
    stock: 6,
    minStock: 10,
    unit: 'uds',
    price: 3.25,
    supplier: 'Cleanpro',
    lastUpdated: '2025-12-12',
  },
  {
    id: 10,
    name: 'Cerveza Estrella Galicia',
    category: 'bebidas',
    stock: 48,
    minStock: 60,
    unit: 'uds',
    price: 0.95,
    supplier: 'Hijos de Rivera',
    lastUpdated: '2025-12-16',
  },
]

export function InventoryTab() {
  const t = useTranslations('restaurant')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  // Categories with translation keys
  const categories = [
    { id: 'all', labelKey: 'inventory.categories.all', count: 156 },
    { id: 'bebidas', labelKey: 'inventory.categories.beverages', count: 42 },
    { id: 'carnes', labelKey: 'inventory.categories.meats', count: 28 },
    { id: 'lacteos', labelKey: 'inventory.categories.dairy', count: 18 },
    { id: 'frutas', labelKey: 'inventory.categories.produce', count: 35 },
    { id: 'panaderia', labelKey: 'inventory.categories.bakery', count: 15 },
    { id: 'limpieza', labelKey: 'inventory.categories.cleaning', count: 18 },
  ]

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesLowStock = !showLowStockOnly || product.stock < product.minStock
    return matchesSearch && matchesCategory && matchesLowStock
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
    })
  }

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock < minStock) {
      return {
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        labelKey: 'inventory.stockStatus.low',
      }
    }
    if (stock < minStock * 1.5) {
      return {
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        labelKey: 'inventory.stockStatus.medium',
      }
    }
    return {
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      labelKey: 'inventory.stockStatus.ok',
    }
  }

  const getCategoryLabel = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId)
    return cat ? t(cat.labelKey) : categoryId
  }

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('inventory.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 dark:bg-[#151b23] dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-[#151b23] dark:text-gray-200"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {t(cat.labelKey)} ({cat.count})
            </option>
          ))}
        </select>

        {/* Low Stock Filter */}
        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            showLowStockOnly
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800'
              : 'bg-white dark:bg-[#151b23] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <FiAlertTriangle className="w-3.5 h-3.5" />
          {t('inventory.lowStockFilter')}
        </button>

        {/* Add Product Button */}
        <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 dark:bg-green-700 text-white text-xs font-medium rounded-md hover:bg-green-700 dark:hover:bg-green-800 transition-colors">
          <FiPlus className="w-3.5 h-3.5" />
          {t('inventory.addProduct')}
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('inventory.table.product')}
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('inventory.table.category')}
                </th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('inventory.table.stock')}
                </th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('inventory.table.status')}
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('inventory.table.price')}
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('inventory.table.supplier')}
                </th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('inventory.table.updated')}
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('inventory.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    {t('inventory.noProducts')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.minStock)
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {product.stock < product.minStock && (
                            <FiAlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          )}
                          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {getCategoryLabel(product.category)}
                      </td>
                      <td className="px-3 py-2 text-xs text-center text-gray-900 dark:text-gray-100">
                        {product.stock} {product.unit}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${stockStatus.color}`}
                        >
                          {t(stockStatus.labelKey)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {product.supplier}
                      </td>
                      <td className="px-3 py-2 text-xs text-center text-gray-600 dark:text-gray-400">
                        {formatDate(product.lastUpdated)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="inline-flex items-center justify-center w-7 h-7 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="inline-flex items-center justify-center w-7 h-7 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('inventory.noProducts')}</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock, product.minStock)
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {product.stock < product.minStock && (
                        <FiAlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      )}
                      <h3 className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 capitalize">
                      {getCategoryLabel(product.category)}
                    </p>
                  </div>
                  <span
                    className={`ml-2 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${stockStatus.color}`}
                  >
                    {t(stockStatus.labelKey)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-400">
                  <span>
                    {t('inventory.stock')}{' '}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {product.stock} {product.unit}
                    </span>
                  </span>
                  <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">
                    {formatCurrency(product.price)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] text-gray-500 dark:text-gray-500">
                    {product.supplier}
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="inline-flex items-center justify-center w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                      <FiEdit2 className="w-3 h-3" />
                    </button>
                    <button className="inline-flex items-center justify-center w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
