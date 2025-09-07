import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useElementSize } from '@mantine/hooks'
import { Stack } from '@mantine/core'

import { GameProps } from '@/game/types'
import { useMultiplayerConnection } from '@/multiplayer/hooks'
import { ConnectionManager, MultiplayerGameBoard } from '@/multiplayer/components'
import { getShareableLink } from '@/multiplayer/utils'
import styles from '../styles/index.module.scss'

/**
 * Main multiplayer chess page component.
 */
export default function Multiplayer() {
  const router = useRouter()
  const { ref: containerRef, width, height } = useElementSize()

  const {
    // State
    multiplayerGame,
    connectionStatus,
    gameId,
    joinGameId,
    error,
    isHost,
    // Actions
    setJoinGameId,
    createGame,
    joinGame,
    disconnect,
  } = useMultiplayerConnection()

  // Game state for the board
  const [bestMove, setBestMove] = useState<Parameters<GameProps['onBestMoveChange']>[0]>(null)
  const [history, setHistory] = useState<Parameters<GameProps['onHistoryChange']>[0]>([])
  const [output, setOutput] = useState<Parameters<GameProps['onOutputChange']>[0]>('')
  const [gameStatus, setGameStatus] =
    useState<Parameters<GameProps['onStatusChange']>[0]>('playing')

  // Handle join link from URL
  useEffect(() => {
    const { join } = router.query
    if (join && typeof join === 'string') {
      setJoinGameId(join)
    }
  }, [router.query, setJoinGameId])

  const handleGetShareableLink = () => getShareableLink(gameId)

  const showGameBoard = connectionStatus === 'connected'

  return (
    <>
      <Head>
        <title>Multiplayer Chess - Ches</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.main}>
        <div ref={containerRef}>
          <Stack mb="md" spacing="md">
            <ConnectionManager
              connectionStatus={connectionStatus}
              gameId={gameId}
              joinGameId={joinGameId}
              error={error}
              isHost={isHost}
              onCreateGame={createGame}
              onJoinGame={joinGame}
              onDisconnect={disconnect}
              onJoinGameIdChange={setJoinGameId}
              getShareableLink={handleGetShareableLink}
            />
          </Stack>

          {/* Game Board - Only show when both players are connected */}
          {showGameBoard && (
            <MultiplayerGameBoard
              multiplayerGame={multiplayerGame}
              width={width}
              height={height}
              history={history}
              bestMove={bestMove}
              gameStatus={gameStatus}
              output={output}
              onBestMoveChange={setBestMove}
              onStatusChange={setGameStatus}
              onOutputChange={setOutput}
              onHistoryChange={setHistory}
            />
          )}
        </div>
      </main>
    </>
  )
}
