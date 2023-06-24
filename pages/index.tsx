import { Challenge, challenges } from '@/chess-simp/challenge'
import { sketch, SketchAttributes } from '@/sketch'
import { useStateRef } from '@/utils/react-usestateref'
import { NextReactP5Wrapper } from '@p5-wrapper/next'
import Head from 'next/head'
import React, { useState } from 'react'
import styles from '../styles/index.module.scss'
import { Anchor, Button, Checkbox, Select, Slider, Stack, Text } from '@mantine/core'
import { useElementSize } from '@mantine/hooks'
import _ from 'lodash'

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

  const { ref, width, height } = useElementSize()

  return (
    <>
      <Head>
        <title>Ches</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <div ref={ref}>
          <MemoizedGameSketch env={env} />

          <Stack mt="md">
            <div style={{ paddingBottom: '1rem' }}>
              <Text size="sm">Depth</Text>
              <Slider
                min={1}
                max={7}
                label={null}
                value={searchDepth}
                onChange={setSearchDepth}
                marks={_.range(1, 7 + 1).map((value) => ({ value, label: value.toString() }))}
              />
            </div>

            <Checkbox
              label="Black makes moves automatically"
              checked={autoPlayEnabled}
              onChange={(e) => setAutoPlayEnabled(e.target.checked)}
            />

            <Checkbox
              label="Show the most devious move"
              checked={showBestMove}
              onChange={(e) => setShowBestMove(e.target.checked)}
            />

            <div>
              <Text size="sm">Challenge</Text>
              <Select
                value={currentChallengeIndex === null ? '-' : currentChallengeIndex.toString()}
                onChange={(value) => {
                  setCurrentChallengeIndex(value === '-' ? null : Number(value))
                }}
                data={[
                  { group: ' ', label: 'Just chess', value: '-' },
                  ...challenges.map((challenge, i) => ({
                    group: 'Chess Simp',
                    label: challenge.videoTitle,

                    value: i.toString(),
                  })),
                ]}
              />
              {currentChallenge && (
                <Text
                  size="sm"
                  style={{
                    marginTop: '5px',
                    maxWidth: width,
                  }}
                >
                  <span style={{ fontStyle: 'italic' }}>{currentChallenge.challenge}</span>{' '}
                  <Anchor href={currentChallenge.videoUrl} target="_blank" rel="noreferrer">
                    <b>[Video]</b>
                  </Anchor>
                </Text>
              )}
            </div>

            {output.trim() !== '' && (
              <div style={{ fontFamily: 'monospace', maxWidth: width }}>{output}</div>
            )}

            <Button
              component="a"
              href="https://github.com/users/neongreen/projects/1/views/3"
              leftIcon="🏆"
            >
              Leaderboard
            </Button>
          </Stack>
        </div>
      </main>
    </>
  )
}
