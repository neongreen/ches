import { Challenge, challenges } from '@/chess-simp/challenge'
import { sketch, SketchAttributes } from '@/sketch'
import { useStateRef } from '@/utils/react-usestateref'
import { NextReactP5Wrapper } from '@p5-wrapper/next'
import Head from 'next/head'
import React from 'react'
import { useState } from 'react'
import styles from '../styles/index.module.scss'

function GameSketch(props: { env: SketchAttributes }) {
  return <NextReactP5Wrapper sketch={(p5) => sketch(props.env, p5)} />
}

// Note: React doesn't guarantee that `memo` will not rerender. But so far it works, and I haven't found any other way.
const MemoizedGameSketch = React.memo(GameSketch, () => true)

export default function Home() {
  const [searchDepth, setSearchDepth, searchDepthRef] = useStateRef(3)
  const [autoPlayEnabled, setAutoPlayEnabled, autoPlayEnabledRef] = useStateRef(true)
  const [showBestMove, setShowBestMove, showBestMoveRef] = useStateRef(false)
  const [currentChallengeIndex, setCurrentChallengeIndex, currentChallengeIndexRef] = useStateRef<
    number | null
  >(null)
  const currentChallenge = currentChallengeIndex === null ? null : challenges[currentChallengeIndex]
  const [bestMove, setBestMove] =
    useState<Parameters<SketchAttributes['onBestMoveChange']>[0]>(null)
  const [output, setOutput] = useState('')

  const env: SketchAttributes = {
    searchDepth: () => searchDepthRef.current,
    autoPlayEnabled: () => autoPlayEnabledRef.current,
    showBestMove: () => showBestMoveRef.current,
    currentChallenge: () =>
      currentChallengeIndexRef.current === null
        ? null
        : challenges[currentChallengeIndexRef.current],
    onBestMoveChange: setBestMove,
    onOutputChange: setOutput,
  }

  return (
    <>
      <Head>
        <title>Ches</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <div>
          <MemoizedGameSketch env={env} />

          <div className={styles.controls}>
            <label>
              Depth:
              <input
                type="range"
                min="1"
                max="7"
                value={searchDepth}
                onChange={(e) => setSearchDepth(Number(e.target.value))}
              />
              <span>{searchDepth}</span>
            </label>

            <label>
              <input
                type="checkbox"
                checked={autoPlayEnabled}
                onChange={(e) => setAutoPlayEnabled(e.target.checked)}
              />
              <span>Black makes moves automatically</span>
            </label>

            <label>
              <input
                type="checkbox"
                checked={showBestMove}
                onChange={(e) => setShowBestMove(e.target.checked)}
              />
              <span>Show the most devious move</span>
            </label>

            <div>
              <label>
                Challenge:
                <select
                  style={{ maxWidth: '250px' }}
                  value={currentChallengeIndex === null ? '-' : currentChallengeIndex}
                  onChange={(e) => {
                    setCurrentChallengeIndex(e.target.value === '-' ? null : Number(e.target.value))
                  }}
                >
                  <option value="-">Just chess</option>
                  <optgroup label="Chess Simp">
                    {challenges.map((challenge, i) => (
                      <option key={i} value={i}>
                        {challenge.videoTitle}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
              {currentChallenge && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    marginTop: '5px',
                    maxWidth: '400px',
                  }}
                >
                  <span style={{ fontStyle: 'italic' }}>{currentChallenge.challenge}</span>{' '}
                  <a href={currentChallenge.videoUrl} target="_blank" rel="noreferrer">
                    <b>[Video]</b>
                  </a>
                </div>
              )}
            </div>

            <div style={{ fontFamily: 'monospace', maxWidth: '400px' }}>{output}</div>
          </div>

          <div className={styles.leaderboard}>
            <a
              href="https://github.com/users/neongreen/projects/1/views/3"
              target="_blank"
              rel="noreferrer"
            >
              🏆 Leaderboard
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
