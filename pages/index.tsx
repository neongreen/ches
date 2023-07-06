import { challengesList, challengesMap } from '@/challenges/all'
import { Challenge } from '@/challenges/core'
import { MAX_CHESSBOARD_WIDTH } from '@/draw/constants'
import { notateMove } from '@/move'
import { SketchAttributes, SketchMethods, sketch } from '@/sketch'
import { useStateRef } from '@/utils/react-usestateref'
import { Uuid } from '@/utils/uuid'
import {
  Accordion,
  Anchor,
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  Group,
  MantineSize,
  Modal,
  Select,
  Slider,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure, useElementSize, useMediaQuery } from '@mantine/hooks'
import { NextReactP5Wrapper } from '@p5-wrapper/next'
import _ from 'lodash'
import Head from 'next/head'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/router'
import React, { useRef, useState } from 'react'
import CommandPalette from 'react-command-palette'
import NoSSR from 'react-no-ssr'
import { match } from 'ts-pattern'
import styles from '../styles/index.module.scss'

const depthColors = ['', 'indigo', 'indigo', 'lime', 'lime', 'yellow', 'yellow', 'red']

const GameSketch = React.forwardRef<SketchMethods, { env: SketchAttributes }>(function GameSketch(
  props,
  ref
) {
  const sketchMethodsRef = React.useRef<SketchMethods | null>(null)
  // Note: it would be great if we could say that the ref should only be filled when 'sketchMethodsRef' is finally available. Then we could ensure that if it's not 'null', it's good to use. But I don't know how to do that. For now we just use `?`, but if we want to have any methods that return a value, this won't work anymore.
  //
  // See my question here: https://stackoverflow.com/questions/76552686/how-to-make-sure-an-useimperativehandle-ref-isnt-filled-until-another-ref-is
  React.useImperativeHandle(ref, () => ({
    reset: (options) => sketchMethodsRef.current?.reset(options),
    enableControls: (value) => sketchMethodsRef.current?.enableControls(value),
  }))
  return (
    <NextReactP5Wrapper
      sketch={(p5) => {
        const methods = sketch(props.env, p5)
        sketchMethodsRef.current = methods
        // @ts-ignore
        window.chessMethods = methods
      }}
    />
  )
})

// Note: React doesn't guarantee that `memo` will not rerender. But so far it works, and I haven't found any other way.
const MemoizedGameSketch = React.memo(GameSketch, () => true)

interface ChallengeItemProps extends React.ComponentPropsWithoutRef<'div'> {
  label: string
  description: string
  beaten: Challenge['meta']['beaten'] | undefined
  // Eg. for "Just chess" we don't want to show the record (we do but right now we don't)
  // TODO: Wojtek's record is depth 3
  showRecord?: boolean
}

const ChallengeSelectItem = React.forwardRef<HTMLDivElement, ChallengeItemProps>(
  function ChallengeSelectItem(
    { label, description, beaten, showRecord, ...others }: ChallengeItemProps,
    ref
  ) {
    return (
      <div ref={ref} {...others}>
        <Box sx={{ '& *': { wordBreak: 'break-word' } }}>
          <Text size="sm">{label}</Text>
          <Text size="xs" opacity={0.65}>
            {description}
          </Text>
          {showRecord && <RecordBadge size="sm" recordPrefix beaten={beaten} />}
        </Box>
      </div>
    )
  }
)

function RecordBadge(props: {
  size: MantineSize
  recordPrefix?: boolean
  beaten?: Challenge['meta']['beaten']
}) {
  const { size, beaten } = props
  return beaten ? (
    <Badge size={props.size} radius="sm" variant="filled" color={depthColors[beaten.depth]}>
      {props.recordPrefix && 'Record: '}
      {beaten.name} @ depth={beaten.depth}
    </Badge>
  ) : (
    <Badge size={props.size} radius="sm" variant="outline" color="gray">
      Unbeaten
    </Badge>
  )
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

  const [searchDepth, setSearchDepth, searchDepthRef] = useStateRef(3)
  const [autoPlayEnabled, setAutoPlayEnabled, autoPlayEnabledRef] = useStateRef(true)
  const [showBestMove, setShowBestMove, showBestMoveRef] = useStateRef(false)

  const [bestMove, setBestMove] =
    useState<Parameters<SketchAttributes['onBestMoveChange']>[0]>(null)
  const [history, setHistory] = useState<Parameters<SketchAttributes['onHistoryChange']>[0]>([])
  const lastMoveRef = useRef<HTMLDivElement>(null)

  const [output, setOutput] = useState<Parameters<SketchAttributes['onOutputChange']>[0]>('')
  const [gameStatus, setGameStatus] =
    useState<Parameters<SketchAttributes['onStatusChange']>[0]>('playing')

  const env: SketchAttributes = {
    searchDepth: () => searchDepthRef.current,
    autoPlayEnabled: () => autoPlayEnabledRef.current,
    showBestMove: () => showBestMoveRef.current,
    onBestMoveChange: setBestMove,
    onOutputChange: setOutput,
    onStatusChange: (x) => {
      // NB: this is being called on every frame :(
      setGameStatus(x)
    },
    onHistoryChange: setHistory,
  }

  const { ref: containerRef, width, height } = useElementSize()

  const sketchRef = React.useRef<SketchMethods>(null)

  const [leaderboardShown, leaderboard] = useDisclosure(false)

  const isMobile = useMediaQuery('(max-width: 500px)')

  /** Recreate the current challenge and reset the game. */
  const resetGame = React.useCallback(
    (challengeUuid: Uuid | null) => {
      console.debug('resetGame', challengeUuid)
      if (challengeUuid === null) {
        setCurrentChallenge(null)
        sketchRef.current?.reset({ challenge: null })
      } else {
        const challengeObj = challengesMap.get(challengeUuid)!
        const challenge = challengeObj.create()
        setCurrentChallenge(challenge)
        sketchRef.current?.reset({ challenge })
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
          onAfterOpen={() => sketchRef.current?.enableControls(false)}
          onRequestClose={() => sketchRef.current?.enableControls(true)}
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
          ].map((x, i) => ({ ...x, id: i, color: '' }))}
        />
      </NoSSR>

      <Modal
        fullScreen={isMobile}
        opened={leaderboardShown}
        onClose={leaderboard.close}
        sx={{ '.mantine-Modal-content': { maxHeight: isMobile ? '100dvh' : '90vh' } }}
        title={<Title>Leaderboard</Title>}
      >
        {/* TODO: this should include "Just chess" and it should be implemented as just another challenge */}
        <Table>
          <thead>
            <tr>
              <th>Challenge</th>
              <th>Record</th>
            </tr>
          </thead>
          <tbody>
            {challengesList.map((x, i) => (
              <React.Fragment key={`group-${i}`}>
                <tr>
                  <td colSpan={2}>
                    <Center>
                      <i>{x.group}</i>
                    </Center>
                  </td>
                </tr>
                {Array.from(x.list.values()).map((challenge) => (
                  <tr key={challenge.meta.uuid}>
                    <td>{challenge.meta.title}</td>
                    <td>
                      <RecordBadge size="sm" beaten={challenge.meta.beaten} />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      </Modal>

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

          <MemoizedGameSketch ref={sketchRef} env={env} />

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
              <Text size="sm">Depth</Text>
              <Slider
                min={1}
                max={7}
                label={null}
                value={searchDepth}
                color={depthColors[searchDepth]}
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
                  { group: ' ', label: 'Just chess', showRecord: false, value: '-' },
                  ...Array.from(challengesMap.values()).map((challenge) => ({
                    group: challenge.group,
                    label: challenge.meta.title,
                    description: challenge.meta.challenge,
                    showRecord: true,
                    beaten: challenge.meta.beaten,
                    value: challenge.meta.uuid,
                  })),
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
