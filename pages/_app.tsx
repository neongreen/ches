import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Analytics } from '@vercel/analytics/react'
import { MantineProvider } from '@mantine/core'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{ primaryColor: 'green', primaryShade: 7 }}
      >
        <Component {...pageProps} />
        <Analytics />
      </MantineProvider>
    </>
  )
}
