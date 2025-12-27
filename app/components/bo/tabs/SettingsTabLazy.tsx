// app/components/bo/tabs/SettingsTabLazy.tsx
/**
 * Settings Tab (Assets) - React Query + invalidación
 *
 * - Hidrata assets iniciales desde el server.
 * - Usa React Query para refrescar tras mutaciones sin router.refresh().
 */

'use client'

import { useState, useRef } from 'react'
import { FiUpload, FiTrash2, FiStar, FiLoader, FiImage, FiAlertCircle } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { backofficeApi, type Asset } from '@/app/lib/backoffice'
import { ConfirmDialog } from '../modals/ConfirmDialog'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface SettingsTabLazyProps {
  initialAssets: Asset[]
}

const assetsKey = ['backoffice', 'assets'] as const

export function SettingsTabLazy({ initialAssets }: SettingsTabLazyProps) {
  const t = useTranslations('backoffice')
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: assetsKey,
    queryFn: async () => {
      const response = await backofficeApi.getAssets()
      return response
    },
    initialData: { assets: initialAssets },
    select: (resp) => resp.assets,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  })

  const [uploading, setUploading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; asset: Asset | null }>({
    open: false,
    asset: null,
  })

  // Form state
  const [newAssetType, setNewAssetType] = useState<'stamp' | 'signature'>('stamp')
  const [newAssetName, setNewAssetName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const assets = data || []
  const stamps = assets.filter((a) => a.type === 'stamp')
  const signatures = assets.filter((a) => a.type === 'signature')

  const invalidateAssets = () => queryClient.invalidateQueries({ queryKey: assetsKey })

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/webp'].includes(file.type)) {
      toast.error(t('toast.onlyPngWebp'))
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('toast.fileTooLarge'))
      return
    }

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Upload new asset
  const handleUpload = async () => {
    if (!selectedFile || !newAssetName.trim()) {
      toast.error(t('toast.selectFileAndName'))
      return
    }

    setUploading(true)
    try {
      await backofficeApi.createAsset({
        type: newAssetType,
        name: newAssetName.trim(),
        image: selectedFile,
        is_default: assets.filter((a) => a.type === newAssetType).length === 0,
      })

      toast.success(
        t('toast.assetCreated', {
          type: newAssetType === 'stamp' ? t('settings.stamp') : t('settings.signature'),
        })
      )
      invalidateAssets()

      setNewAssetName('')
      setSelectedFile(null)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: unknown) {
      console.error('Error uploading asset:', error)
      toast.error(error instanceof Error ? error.message : t('toast.uploadError'))
    } finally {
      setUploading(false)
    }
  }

  // Delete asset
  const handleDelete = async () => {
    if (!deleteDialog.asset) return

    try {
      await backofficeApi.deleteAsset(deleteDialog.asset.id)
      toast.success(t('toast.assetDeleted'))
      invalidateAssets()
    } catch (error: unknown) {
      console.error('Error deleting asset:', error)
      toast.error(error instanceof Error ? error.message : t('toast.assetDeleteError'))
    } finally {
      setDeleteDialog({ open: false, asset: null })
    }
  }

  // Set as default
  const handleSetDefault = async (asset: Asset) => {
    try {
      await backofficeApi.setDefaultAsset(asset.id)
      toast.success(t('toast.assetSetDefault', { name: asset.name }))
      invalidateAssets()
    } catch (error: unknown) {
      console.error('Error setting default:', error)
      toast.error(error instanceof Error ? error.message : t('toast.assetSetDefaultError'))
    }
  }

  const renderAssetGrid = (assetList: Asset[], type: 'stamp' | 'signature') => {
    if (assetList.length === 0) {
      return (
        <div className="col-span-full py-8 text-center">
          <FiImage className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {type === 'stamp' ? t('settings.noStamps') : t('settings.noSignatures')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {t('settings.uploadHint')}
          </p>
        </div>
      )
    }

    return assetList.map((asset) => (
      <div
        key={asset.id}
        className={`relative group p-4 bg-white dark:bg-[#151b23] border rounded-xl transition-all ${
          asset.is_default
            ? 'border-yellow-400 dark:border-yellow-500 ring-1 ring-yellow-400/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        {asset.is_default && (
          <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 text-[10px] font-medium rounded-full flex items-center gap-1">
            <FiStar className="w-3 h-3" />
            {t('settings.default')}
          </div>
        )}

        <div
          className={`${type === 'stamp' ? 'aspect-square' : 'aspect-video'} mb-3 flex items-center justify-center`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.cloudinary_url}
            alt={asset.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate text-center">
          {asset.name}
        </p>

        <div className="mt-3 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!asset.is_default && (
            <button
              onClick={() => handleSetDefault(asset)}
              className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
              title={t('settings.setAsDefault')}
            >
              <FiStar className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setDeleteDialog({ open: true, asset })}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title={t('actions.delete')}
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    ))
  }

  return (
    <div className="space-y-8">
      {/* Upload Form */}
      <div className="bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('settings.uploadTitle')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.type')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assetType"
                    value="stamp"
                    checked={newAssetType === 'stamp'}
                    onChange={() => setNewAssetType('stamp')}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('settings.stamp')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assetType"
                    value="signature"
                    checked={newAssetType === 'signature'}
                    onChange={() => setNewAssetType('signature')}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('settings.signature')}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.name')}
              </label>
              <input
                type="text"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                placeholder={
                  newAssetType === 'stamp'
                    ? t('settings.namePlaceholder.stamp')
                    : t('settings.namePlaceholder.signature')
                }
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.image')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
              >
                <FiUpload className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">
                  {selectedFile ? selectedFile.name : t('settings.selectFile')}
                </span>
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {t('settings.recommendation')}
              </p>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !newAssetName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  {t('actions.uploading')}
                </>
              ) : (
                <>
                  <FiUpload className="w-4 h-4" />
                  {newAssetType === 'stamp'
                    ? t('settings.uploadButton.stamp')
                    : t('settings.uploadButton.signature')}
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-[#0d1117] rounded-lg border border-gray-200 dark:border-gray-700">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-48 object-contain" />
            ) : (
              <div className="text-center text-gray-400 dark:text-gray-500">
                <FiImage className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('settings.preview')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          {t('settings.stamps')}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({stamps.length})
          </span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {renderAssetGrid(stamps, 'stamp')}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          {t('settings.signatures')}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({signatures.length})
          </span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {renderAssetGrid(signatures, 'signature')}
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <FiAlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">{t('settings.info.title')}</p>
          <p className="text-blue-600 dark:text-blue-400">{t('settings.info.description')}</p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, asset: null })}
        onConfirm={handleDelete}
        title={t('modals.deleteElement.title')}
        message={t('modals.deleteElement.message', { name: deleteDialog.asset?.name ?? '' })}
        confirmText={t('modals.deleteElement.confirmButton')}
        variant="danger"
      />
    </div>
  )
}
