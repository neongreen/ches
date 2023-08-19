import { challengesMap } from '@/challenges/all'
import { Challenge, challengeWinner } from '@/challenges/core'
import { Leaderboard } from '@/components/leaderboard'
import { MAX_CHESSBOARD_WIDTH } from '@/draw/constants'
import { notateMove } from '@/move'
import { sketch } from '@/game'
import { GameMethods, GameProps } from '@/game/types'
import { useStateRef } from '@/utils/react-usestateref'
import { Uuid } from '@/utils/uuid'
import {
  Accordion,
  Anchor,
  Box,
  Button,
  Center,
  Checkbox,
  Group,
  Select,
  Slider,
  Stack,
  Text,
} from '@mantine/core'
import { useDisclosure, useElementSize, useMediaQuery } from '@mantine/hooks'
import { NextReactP5Wrapper } from '@p5-wrapper/next'
import { P5CanvasInstance, SketchProps } from '@p5-wrapper/react'
import _ from 'lodash'
import Head from 'next/head'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/router'
import React, { useRef, useState } from 'react'
import CommandPalette from 'react-command-palette'
import NoSSR from 'react-no-ssr'
import { match } from 'ts-pattern'
import styles from '../styles/index.module.scss'
import { RecordBadge, depthColors } from '@/components/recordBadge'

interface ChallengeItemProps extends React.ComponentPropsWithoutRef<'div'> {
  label: string
  description: string
  records: Challenge['meta']['records'] | undefined
}

const ChallengeSelectItem = React.forwardRef<HTMLDivElement, ChallengeItemProps>(
  function ChallengeSelectItem(
    { label, description, records, ...others }: ChallengeItemProps,
    ref
  ) {
    return (
      <div ref={ref} {...others}>
        <Box sx={{ '& *': { wordBreak: 'break-word' } }}>
          <Text size="sm">{label}</Text>
          <Text size="xs" opacity={0.65}>
            {description}
          </Text>
          {records !== undefined && (
            <RecordBadge size="sm" recordPrefix winner={challengeWinner(records)} />
          )}
        </Box>
      </div>
    )
  }
)

// I spent like 8 hours overall trying to do things properly with refs and failed. I'll just use window for now. See https://github.com/P5-wrapper/react/issues/258
function gameMethods(): GameMethods | null {
  // @ts-ignore
  return window.gameMethods || null
}

const game = (p5: P5CanvasInstance<SketchProps & GameProps>) => {
  console.debug('Creating sketch')
  const methods = sketch(p5)
  // @ts-ignore
  window.gameMethods = methods
}

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // If we have a challenge ID in the query, we'll just select that as the challenge.
  const query_challenge_id = searchParams.get('challenge_id')

  // Challenges can keep track of history, so we can't between them mid-game. The `currentChallenge` variable holds the current Challenge object. 'null' means 'Just chess'.
  const [challengeUuid, setChallengeUuid] = useState<Uuid | null>(null)
  const [currentChallenge, setCurrentChallenge, currentChallengeRef] =
    useStateRef<Challenge | null>(null)

  // For whatever reason, Next.js provides 'null' for search params and only then replaces it with the actual value. We have to use useEffect and wait for the value to become available.
  React.useEffect(() => {
    console.debug('Challenge ID in the URL', query_challenge_id)
    const isValidChallengeChoice =
      query_challenge_id === null || challengesMap.has(query_challenge_id)
    // TODO: it flickers and I don't know why.
    if (isValidChallengeChoice && query_challenge_id !== challengeUuid) {
      console.debug('setChallengeUuid', query_challenge_id)
      setChallengeUuid(query_challenge_id)
    }
  }, [query_challenge_id, challengeUuid])

  const [searchDepth, setSearchDepth] = useState(3)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true)
  const [controlsEnabled, setControlsEnabled] = useState(true)
  const [showBestMove, setShowBestMove] = useState(false)

  const [bestMove, setBestMove] = useState<Parameters<GameProps['onBestMoveChange']>[0]>(null)
  const [history, setHistory] = useState<Parameters<GameProps['onHistoryChange']>[0]>([])
  const lastMoveRef = useRef<HTMLDivElement>(null)

  const [output, setOutput] = useState<Parameters<GameProps['onOutputChange']>[0]>('')
  const [gameStatus, setGameStatus] =
    useState<Parameters<GameProps['onStatusChange']>[0]>('playing')

  const { ref: containerRef, width, height } = useElementSize()

  const [leaderboardShown, leaderboard] = useDisclosure(false)

  /** Recreate the current challenge and reset the game. */
  const resetGame = React.useCallback(
    (challengeUuid: Uuid | null) => {
      console.debug('Calling resetGame', challengeUuid)
      if (challengeUuid === null) {
        setCurrentChallenge(null)
        gameMethods()?.reset?.()
      } else {
        const challengeObj = challengesMap.get(challengeUuid)!
        const challenge = challengeObj.create()
        setCurrentChallenge(challenge)
        gameMethods()?.reset?.()
      }
    },
    [setCurrentChallenge]
  )

  React.useEffect(() => {
    resetGame(challengeUuid)
  }, [challengeUuid, resetGame])

  React.useEffect(() => {
    lastMoveRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, lastMoveRef])

  return (
    <>
      <Head>
        <title>Ches</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <NoSSR>
        <CommandPalette
          trigger={null}
          closeOnSelect
          resetInputOnOpen
          onAfterOpen={() => setControlsEnabled(false)}
          onRequestClose={() => setControlsEnabled(true)}
          commands={[
            {
              name: 'Reset',
              command: () => resetGame(challengeUuid),
            },
            {
              name: `Black makes moves automatically: ${autoPlayEnabled ? 'disable' : 'enable'}`,
              command: () => setAutoPlayEnabled((x) => !x),
            },
            {
              name: `Show best move: ${showBestMove ? 'disable' : 'enable'}`,
              command: () => setShowBestMove((x) => !x),
            },
            {
              name: 'Open leaderboard',
              command: () => leaderboard.open(),
            },
          ].map((x, i) => ({ ...x, id: i, color: '' }))}
        />
      </NoSSR>

      <Leaderboard
        shown={leaderboardShown}
        close={leaderboard.close}
        currentChallenge={
          currentChallengeRef.current?.meta || { title: 'Just chess', records: new Map() }
        }
      />

      <main className={styles.main}>
        <div ref={containerRef}>
          <Box
            sx={(theme) => ({
              overflowX: 'scroll',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              width: width,
              backgroundColor: theme.colors.gray[3],
              // Hide the scrollbar in all browsers
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            })}
          >
            <Box
              sx={(theme) => ({
                display: 'flex',
                flexDirection: 'row',
              })}
            >
              {(() => {
                const chunked = _.chunk(
                  history.map(({ move, boardBeforeMove }) => notateMove(boardBeforeMove, move)),
                  2
                )
                if (chunked.length === 0)
                  return (
                    <Text
                      size="xs"
                      sx={(theme) => ({
                        fontFamily: theme.fontFamilyMonospace,
                        padding: '3px .35rem',
                      })}
                    >
                      &nbsp;
                    </Text>
                  )
                return chunked.map((chunk, i) => (
                  <Text
                    span
                    size="xs"
                    key={i}
                    ref={i === chunked.length - 1 ? lastMoveRef : undefined}
                    sx={(theme) => ({
                      padding: '3px .35rem',
                      fontFamily: theme.fontFamilyMonospace,
                    })}
                  >
                    {i + 1}.{chunk[0]}
                    {chunk[1] ? ' ' + chunk[1] : null}
                  </Text>
                ))
              })()}
            </Box>
          </Box>

          <NextReactP5Wrapper
            challenge={currentChallenge}
            searchDepth={searchDepth}
            autoPlayEnabled={autoPlayEnabled}
            controlsEnabled={controlsEnabled}
            showBestMove={showBestMove}
            onBestMoveChange={setBestMove}
            onStatusChange={setGameStatus}
            onOutputChange={setOutput}
            onHistoryChange={setHistory}
            sketch={game}
          />

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
            <Group grow>
              {match(gameStatus)
                .with('playing', () => (
                  <Button color="dark" variant="light" onClick={() => resetGame(challengeUuid)}>
                    Reset
                  </Button>
                ))
                .with('won', () => (
                  <Button color="green" onClick={() => resetGame(challengeUuid)}>
                    Play again
                  </Button>
                ))
                .with('lost', () => (
                  <Button color="red" onClick={() => resetGame(challengeUuid)}>
                    Play again
                  </Button>
                ))
                .with('draw', () => (
                  <Button color="red" onClick={() => resetGame(challengeUuid)}>
                    Play again
                  </Button>
                ))
                .exhaustive()}
              <Button onClick={leaderboard.open} leftIcon="🏆" color="yellow">
                Leaderboard
              </Button>
            </Group>

            <div style={{ paddingBottom: '1rem' }}>
              <Text size="sm">
                Depth{' '}
                {history.length > 0 && (
                  <Box
                    component="span"
                    pl="sm"
                    sx={(theme) => ({ color: theme.colors.gray[6], fontSize: theme.fontSizes.xs })}
                  >
                    <i>You can pick a new depth after pressing 'Reset'.</i>
                  </Box>
                )}
              </Text>
              <Slider
                min={1}
                max={7}
                label={null}
                value={searchDepth}
                color={depthColors[searchDepth]}
                onChange={setSearchDepth}
                marks={_.range(1, 7 + 1).map((value) => ({
                  value,
                  label:
                    value === searchDepth ? (
                      <Text size="md" weight="bold">
                        {value}
                      </Text>
                    ) : (
                      <Text size="xs">{value}</Text>
                    ),
                }))}
                disabled={history.length > 0}
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
                  ...Array.from(challengesMap.values()).map(
                    (challenge) =>
                      ({
                        group: challenge.group,
                        label: challenge.meta.title,
                        description: challenge.meta.challenge,
                        records: challenge.meta.records,
                        value: challenge.meta.uuid,
                      } satisfies { group: string; value: string } & ChallengeItemProps)
                  ),
                ]}
              />
              {currentChallenge && (
                <Text size="sm" mt="xs">
                  <i>{currentChallenge.meta.challenge}</i>{' '}
                  <Anchor href={currentChallenge.meta.link} target="_blank" rel="noreferrer">
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
                Made by Emily{' • '}
                <Anchor href="https://discord.gg/VXQXruqBwB" target="_blank">
                  Discord
                </Anchor>{' '}
                (submit records there!)
                {' • '}
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
