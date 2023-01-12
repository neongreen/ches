import { sketch } from '@/sketch'
import { P5 } from 'components/p5'
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
        <P5 sketch={sketch} />
      </main>
    </>
  )
}
