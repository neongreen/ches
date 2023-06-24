import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Analytics } from '@vercel/analytics/react'
import { MantineProvider } from '@mantine/core'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <MantineProvider withGlobalStyles withNormalizeCSS theme={{ primaryColor: 'lime' }}>
        <Component {...pageProps} />
        <Analytics />
      </MantineProvider>
    </>
  )
}
