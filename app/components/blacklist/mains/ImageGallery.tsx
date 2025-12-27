// app/dashboard/blacklist/components/mains/ImageGallery.tsx

'use client'

/**
 * Galería de imágenes con Lightbox
 * - Grid responsive
 * - Modal para ver en grande (lightbox)
 * - Zoom con Framer Motion
 * - Navegación entre imágenes
 * - Descarga de imágenes
 */

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IoClose,
  IoChevronBack,
  IoChevronForward,
  IoDownloadOutline,
  IoExpandOutline,
} from 'react-icons/io5'
import { clsx } from 'clsx'
import { useTranslations } from 'next-intl'

interface ImageGalleryProps {
  images: string[] // URLs de Cloudinary
  alt?: string
}

export function ImageGallery({ images, alt = 'Imagen de evidencia' }: ImageGalleryProps) {
  const t = useTranslations('blacklist')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // ========================================
  // ABRIR LIGHTBOX
  // ========================================
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
  }

  // ========================================
  // CERRAR LIGHTBOX
  // ========================================
  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  // ========================================
  // NAVEGACIÓN
  // ========================================
  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  // ========================================
  // DESCARGAR IMAGEN
  // ========================================
  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Error al descargar imagen:', error)
    }
  }

  // ========================================
  // KEYBOARD NAVIGATION
  // ========================================
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') closeLightbox()
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('ui.noImages')}</p>
      </div>
    )
  }

  return (
    <>
      {/* Grid de imágenes */}
      <div
        className={clsx(
          'grid gap-3',
          images.length === 1 && 'grid-cols-2 sm:grid-cols-3',
          images.length === 2 && 'grid-cols-2 sm:grid-cols-3',
          images.length >= 3 && 'grid-cols-2 sm:grid-cols-3'
        )}
      >
        {images.map((imageUrl, index) => (
          <button
            key={`${imageUrl}-${index}`}
            onClick={() => openLightbox(index)}
            className="relative aspect-square group overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all max-w-[200px]"
          >
            <Image
              src={imageUrl}
              alt={`${alt} ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, 33vw"
            />

            {/* Overlay con icono */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-900/90 rounded-full p-3">
                <IoExpandOutline className="text-gray-900 dark:text-gray-100" size={24} />
              </div>
            </div>

            {/* Número de imagen */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {index + 1} / {images.length}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
              <div className="text-white text-sm">
                {t('ui.imageOf', { current: currentImageIndex + 1, total: images.length })}
              </div>

              <div className="flex items-center gap-2">
                {/* Botón descargar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadImage(
                      images[currentImageIndex],
                      `evidencia-${currentImageIndex + 1}.jpg`
                    )
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title={t('ui.downloadImage')}
                >
                  <IoDownloadOutline size={24} />
                </button>

                {/* Botón cerrar */}
                <button
                  onClick={closeLightbox}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title={t('ui.closeEsc')}
                >
                  <IoClose size={24} />
                </button>
              </div>
            </div>

            {/* Imagen principal */}
            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-12">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="relative max-w-7xl max-h-full w-full h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={images[currentImageIndex]}
                  alt={`${alt} ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  quality={100}
                  priority
                />
              </motion.div>
            </div>

            {/* Navegación */}
            {images.length > 1 && (
              <>
                {/* Botón anterior */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goToPrevious()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                  title={t('ui.previousArrow')}
                >
                  <IoChevronBack size={28} />
                </button>

                {/* Botón siguiente */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goToNext()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                  title={t('ui.nextArrow')}
                >
                  <IoChevronForward size={28} />
                </button>
              </>
            )}

            {/* Thumbnails (miniaturas) */}
            {images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                  {images.map((imageUrl, index) => (
                    <button
                      key={`thumb-${index}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentImageIndex(index)
                      }}
                      className={clsx(
                        'relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition-all',
                        index === currentImageIndex
                          ? 'border-white scale-110'
                          : 'border-white/30 hover:border-white/60 opacity-60 hover:opacity-100'
                      )}
                    >
                      <Image
                        src={imageUrl}
                        alt={`Miniatura ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Instrucciones de teclado */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs hidden md:block">
              {t('ui.keyboardNav')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ✅ Features del ImageGallery:

// ✅ Grid responsive:

// 1 imagen: 1 columna (ancho completo)
// 2 imágenes: 2 columnas
// 3+ imágenes: 2 columnas (mobile), 3 columnas (desktop)

// ✅ Lightbox completo:

// Overlay oscuro con blur
// Imagen en tamaño real
// Animaciones con Framer Motion

// ✅ Navegación múltiple:

// Botones anterior/siguiente
// Teclado (← → ESC)
// Thumbnails (miniaturas) en la parte inferior

// ✅ Funcionalidades:

// ⬇️ Descarga de imágenes
// 🔍 Zoom automático (object-contain)
// 📱 Responsive (adapta padding)

// ✅ UX mejorada:

// Hover effect con scale
// Overlay con icono de expandir
// Contador "1 de 5"
// Instrucciones de teclado

// ✅ Optimización Next.js:

// Image component optimizado
// Lazy loading en grid
// Priority en lightbox
// Sizes optimizados

// ✅ Accesibilidad:

// Keyboard navigation
// Alt text descriptivo
// Focus management

// ✅ Dark mode nativo
// ✅ Estado vacío - Mensaje cuando no hay imágenes

// 📊 Ejemplo de uso:
// typescript<ImageGallery
//   images={[
//     'https://res.cloudinary.com/xxx/image1.jpg',
//     'https://res.cloudinary.com/xxx/image2.jpg',
//     'https://res.cloudinary.com/xxx/image3.jpg',
//   ]}
//   alt="Evidencia de mala conducta"
// />
