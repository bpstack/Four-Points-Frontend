// app/layout.tsx
import './ui/global.css'
import { ACTIVE_FONTS as activeFonts } from './ui/fonts-design/fonts.helper'
import Providers from './lib/theme/ThemeProvider'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Four Points - Hotel PMS',
    template: '%s | Four Points',
  },
  description: 'Sistema de gestión hotelera Four Points - Property Management System',
  applicationName: 'Four Points',
  keywords: ['hotel', 'pms', 'property management', 'four points', 'gestión hotelera'],
  authors: [{ name: 'Four Points Team' }],
  creator: 'Four Points',
  publisher: 'Four Points',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [{ rel: 'mask-icon', url: '/favicon.svg', color: '#6366f1' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Four Points',
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Four Points',
    title: 'Four Points - Hotel PMS',
    description: 'Sistema de gestión hotelera Four Points',
    locale: 'es_ES',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#010409' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  const fontVars: Record<string, string> = {}
  if (activeFonts.primary.style?.fontFamily) {
    fontVars['--font-primary'] = activeFonts.primary.style.fontFamily
  }
  if (activeFonts.display.style?.fontFamily) {
    fontVars['--font-display'] = activeFonts.display.style.fontFamily
  }

  const needsPrimaryAlias = !activeFonts.primary.style?.fontFamily && activeFonts.primary.variable
  const needsDisplayAlias = !activeFonts.display.style?.fontFamily && activeFonts.display.variable

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${activeFonts.primary.variable} ${activeFonts.display.variable}`}
      style={Object.keys(fontVars).length > 0 ? (fontVars as React.CSSProperties) : undefined}
    >
      <head>
        {(needsPrimaryAlias || needsDisplayAlias) && (
          <style>{`
            :root {
              ${needsPrimaryAlias ? `--font-primary: var(${activeFonts.primary.variable});` : ''}
              ${needsDisplayAlias ? `--font-display: var(${activeFonts.display.variable});` : ''}
            }
          `}</style>
        )}
      </head>
      <body
        className="antialiased font-sans bg-white dark:bg-[#010409]"
        suppressHydrationWarning={true}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
