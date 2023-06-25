import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Analytics } from '@vercel/analytics/react'
import { MantineProvider } from '@mantine/core'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
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
