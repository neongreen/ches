import React, { useRef } from 'react'
import { Box, Button, Center, Group, Stack, Text } from '@mantine/core'
import { NextReactP5Wrapper } from '@p5-wrapper/next'
import { P5CanvasInstance, SketchProps } from '@p5-wrapper/react'
import { useRouter } from 'next/router'
import NoSSR from 'react-no-ssr'
import { IconRefresh } from '@tabler/icons-react'

import { MAX_CHESSBOARD_WIDTH } from '@/draw/constants'
import { multiplayerSketch } from '@/multiplayer/sketch'
import { GameMethods, GameProps } from '@/game/types'
import { YjsMultiplayerGame } from '@/multiplayer/yjs-game'

/**
 * Props for the MultiplayerGameBoard component
 */
interface MultiplayerGameBoardProps {
  multiplayerGame: YjsMultiplayerGame | null
  width: number
  height: number
  history: Parameters<GameProps['onHistoryChange']>[0]
  bestMove: Parameters<GameProps['onBestMoveChange']>[0]
  gameStatus: Parameters<GameProps['onStatusChange']>[0]
  output: Parameters<GameProps['onOutputChange']>[0]
  onBestMoveChange: (move: Parameters<GameProps['onBestMoveChange']>[0]) => void
  onStatusChange: (status: Parameters<GameProps['onStatusChange']>[0]) => void
  onOutputChange: (output: Parameters<GameProps['onOutputChange']>[0]) => void
  onHistoryChange: (history: Parameters<GameProps['onHistoryChange']>[0]) => void
}

// I spent like 8 hours overall trying to do things properly with refs and failed. I'll just use window for now. See https://github.com/P5-wrapper/react/issues/258
/**
 * Gets game methods from the global window object.
 * Duplicated from pages/multiplayer.tsx due to P5 wrapper limitations.
 */
function gameMethods(): GameMethods | null {
  // @ts-ignore
  return window.gameMethods || null
}

/**
 * P5.js game sketch function for multiplayer mode.
 * Duplicated from pages/multiplayer.tsx due to P5 wrapper limitations.
 */
const game = (p5: P5CanvasInstance<SketchProps & GameProps>) => {
  console.debug('Creating multiplayer sketch')
  const methods = multiplayerSketch(p5)
  // @ts-ignore
  window.gameMethods = methods
}

/**
 * Renders the chess board, move history, and game controls for multiplayer mode.
 */
export function MultiplayerGameBoard({
  multiplayerGame,
  width,
  height,
  history,
  bestMove,
  gameStatus,
  output,
  onBestMoveChange,
  onStatusChange,
  onOutputChange,
  onHistoryChange,
}: MultiplayerGameBoardProps) {
  const router = useRouter()
  const lastMoveRef = useRef<HTMLDivElement>(null)

  const resetGame = () => {
    gameMethods()?.reset?.()
  }

  return (
    <Stack>
      {/* Move History */}
      <Box
        sx={(theme) => ({
          overflowX: 'scroll',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          width: width,
          backgroundColor: theme.colors.gray[3],
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        })}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {history.length === 0 ? (
            <Text
              size="xs"
              sx={(theme) => ({
                fontFamily: theme.fontFamilyMonospace,
                padding: '3px .35rem',
              })}
            >
              &nbsp;
            </Text>
          ) : (
            history.map(({ move }, i) => (
              <Text
                span
                size="xs"
                key={i}
                ref={i === history.length - 1 ? lastMoveRef : undefined}
                sx={(theme) => ({
                  padding: '3px .35rem',
                  fontFamily: theme.fontFamilyMonospace,
                })}
              >
                {i + 1}.{' '}
                {move.kind === 'normal'
                  ? `${move.from.toString()}-${move.to.toString()}`
                  : move.kind === 'castling'
                    ? 'O-O'
                    : move.kind === 'enPassant'
                      ? `${move.from.toString()}-${move.to.toString()}`
                      : 'Move'}
              </Text>
            ))
          )}
        </Box>
      </Box>

      {/* Chess Board */}
      <NoSSR>
        <NextReactP5Wrapper
          challenge={null}
          searchDepth={3}
          autoPlayEnabled={false} // Disabled in multiplayer
          controlsEnabled={true}
          showBestMove={false}
          onBestMoveChange={onBestMoveChange}
          onStatusChange={onStatusChange}
          onOutputChange={onOutputChange}
          onHistoryChange={onHistoryChange}
          multiplayerMode={true}
          multiplayerGame={multiplayerGame}
          sketch={game}
        />
      </NoSSR>

      {/* Controls */}
      <Stack
        sx={(theme) => ({
          maxWidth: width,
          [`@media (max-width: ${MAX_CHESSBOARD_WIDTH + 10 * 2}px)`]: {
            paddingLeft: theme.spacing.sm,
            paddingRight: theme.spacing.sm,
          },
        })}
      >
        <Group grow>
          <Button color="dark" variant="light" onClick={resetGame}>
            Reset Board
          </Button>
          <Button
            color="blue"
            variant="light"
            onClick={async () => await router.push('/')}
            leftIcon={<IconRefresh size={16} />}
          >
            Back to Single Player
          </Button>
        </Group>

        <Center>
          <Text size="sm" color="dimmed">
            Collaborative Mode - No rules enforced. Both players can move any piece freely.
          </Text>
        </Center>
      </Stack>
    </Stack>
  )
}
