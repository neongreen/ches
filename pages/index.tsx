import { sketch } from '@/sketch'
import { NextReactP5Wrapper } from '@p5-wrapper/next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <>
      <Head>
        <title>Ches</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <NextReactP5Wrapper sketch={sketch} />
      </main>
    </>
  )
}
