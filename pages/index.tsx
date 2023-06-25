import { challenges } from '@/challenges/all'
import { sketch, SketchAttributes } from '@/sketch'
import { useStateRef } from '@/utils/react-usestateref'
import { NextReactP5Wrapper } from '@p5-wrapper/next'
import Head from 'next/head'
import React, { useState } from 'react'
import styles from '../styles/index.module.scss'
import {
  Anchor,
  Box,
  Accordion,
  Button,
  Checkbox,
  Select,
  Slider,
  Stack,
  Text,
  Center,
} from '@mantine/core'
import { useElementSize } from '@mantine/hooks'
import _ from 'lodash'
import { MAX_CHESSBOARD_WIDTH } from '@/draw/constants'
import { Challenge } from '@/challenges/core'
import { useRouter } from 'next/router'
import { useSearchParams } from 'next/navigation'

let gameInitialized = false

function GameSketch(props: { env: SketchAttributes }) {
  // This is necessary to avoid two canvases in dev mode in Chrome. Well, there are still two canvases, but one is empty. TODO: figure out how to fix this.
  return gameInitialized ? null : (
    <NextReactP5Wrapper
      sketch={(p5) => {
        if (!gameInitialized) {
          gameInitialized = true
          sketch(props.env, p5)
        }
      }}
    />
  )
}

// Note: React doesn't guarantee that `memo` will not rerender. But so far it works, and I haven't found any other way.
const MemoizedGameSketch = React.memo(GameSketch, () => true)

interface ChallengeItemProps extends React.ComponentPropsWithoutRef<'div'> {
  label: string
  description: string
}

const ChallengeSelectItem = React.forwardRef<HTMLDivElement, ChallengeItemProps>(
  ({ label, description, ...others }: ChallengeItemProps, ref) => (
    <div ref={ref} {...others}>
      <Box sx={{ '& *': { wordBreak: 'break-word' } }}>
        <Text size="sm">{label}</Text>
        <Text size="xs" opacity={0.65}>
          {description}
        </Text>
      </Box>
    </div>
  )
)
ChallengeSelectItem.displayName = 'ChallengeSelectItem'

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // If we have a challenge ID, we'll just select that as the challenge.
  const query_challenge_id = searchParams.get('challenge_id')

  const challengesFlattened: (Challenge & { group: string })[] = challenges.flatMap((group) =>
    group.list.map((challenge) => ({ ...challenge, group: group.group }))
  )

  const [challengeUuid, setChallengeUuid, challengeUuidRef] = useStateRef<string | null>(null)
  const currentChallenge =
    challengeUuid === null
      ? null
      : challengesFlattened.find((challenge) => challenge.uuid === challengeUuid) ?? null

  // For whatever reason, Next.js provides 'null' for search params and only then replaces it with the actual value. We have to use useEffect and wait for the value to become available.
  React.useEffect(() => {
    const isValidChallengeChoice =
      query_challenge_id === null ||
      challengesFlattened.some((challenge) => challenge.uuid === query_challenge_id)
    // TODO: it flickers and I don't know why.
    if (isValidChallengeChoice && query_challenge_id !== challengeUuid)
      setChallengeUuid(query_challenge_id)
  }, [challengesFlattened, query_challenge_id, challengeUuid, setChallengeUuid])

  const [searchDepth, setSearchDepth, searchDepthRef] = useStateRef(3)
  const [autoPlayEnabled, setAutoPlayEnabled, autoPlayEnabledRef] = useStateRef(true)
  const [showBestMove, setShowBestMove, showBestMoveRef] = useStateRef(false)

  const [bestMove, setBestMove] =
    useState<Parameters<SketchAttributes['onBestMoveChange']>[0]>(null)
  const [output, setOutput] = useState('')

  const env: SketchAttributes = {
    searchDepth: () => searchDepthRef.current,
    autoPlayEnabled: () => autoPlayEnabledRef.current,
    showBestMove: () => showBestMoveRef.current,
    currentChallenge: () =>
      challengeUuidRef.current === null
        ? null
        : challengesFlattened.find((challenge) => challenge.uuid === challengeUuidRef.current) ??
          null,
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

          <Stack
            mt="md"
            sx={(theme) => ({
              maxWidth: width,
              // When we have less than 10px left on both sides, add padding.
              [`@media (max-width: ${MAX_CHESSBOARD_WIDTH + 10 * 2}px)`]: {
                paddingLeft: theme.spacing.sm,
                paddingRight: theme.spacing.sm,
              },
            })}
          >
            <Button
              component="a"
              href="https://github.com/users/neongreen/projects/1/views/3"
              target="_blank"
              leftIcon="🏆"
            >
              Leaderboard
            </Button>

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

            <div>
              <Text size="sm">Challenge</Text>
              <Select
                itemComponent={ChallengeSelectItem}
                maxDropdownHeight={400}
                value={challengeUuid === null ? '-' : challengeUuid}
                onChange={(value) => {
                  setChallengeUuid(value === '-' ? null : value)
                  void router.replace({
                    pathname: router.pathname,
                    query: value === '-' ? {} : { challenge_id: value },
                  })
                }}
                data={[
                  { group: ' ', label: 'Just chess', value: '-' },
                  ...challengesFlattened.map((challenge) => ({
                    group: challenge.group,
                    label: challenge.title,
                    description: challenge.challenge,
                    value: challenge.uuid,
                  })),
                ]}
              />
              {currentChallenge && (
                <Text size="sm" mt="xs">
                  <span style={{ fontStyle: 'italic' }}>{currentChallenge.challenge}</span>{' '}
                  <Anchor href={currentChallenge.link} target="_blank" rel="noreferrer">
                    <b>[Link]</b>
                  </Anchor>
                </Text>
              )}
            </div>

            {/* TODO: restore "Show best line" */}
            {output.trim() !== '' && <div style={{ fontFamily: 'monospace' }}>{output}</div>}

            <Accordion variant="separated" multiple>
              <Accordion.Item value="options">
                <Accordion.Control>Options</Accordion.Control>
                <Accordion.Panel>
                  <Stack>
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
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            <Center>
              <Text size="sm">
                Made by Emily •{' '}
                <Anchor href="https://github.com/neongreen/ches" target="_blank">
                  GitHub
                </Anchor>
              </Text>
            </Center>
          </Stack>
        </div>
      </main>
    </>
  )
}
