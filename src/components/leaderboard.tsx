import { challengesList, challengesMap } from '@/challenges/all'
import { challengeLeaderboard, challengeWinner } from '@/challenges/core'
import { users } from '@/challenges/users'
import { Center, Modal, Table, Tabs, Title } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import _ from 'lodash'
import * as R from 'ramda'
import React from 'react'
import { RecordBadge } from './recordBadge'

function LeaderboardCombined() {
  return (
    <Table>
      <tbody>
        {(() => {
          const players: Map<string, number> = new Map(_.values(users).map((x) => [x.name, 0]))
          for (const challenge of challengesMap.values()) {
            const points = challengeLeaderboard(challenge.meta.records)
            for (const [name, score] of points) {
              players.set(name, players.get(name)! + score)
            }
          }
          return R.sortWith([R.descend(([, score]) => score)], Array.from(players.entries())).map(
            ([name, score]) =>
              score > 0 && (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{score}</td>
                </tr>
              )
          )
        })()}
      </tbody>
    </Table>
  )
}

function LeaderboardChallenge() {
  // TODO: this should include "Just chess" and it should be implemented as just another challenge
  return (
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
                  <RecordBadge size="sm" winner={challengeWinner(challenge.meta.records)} />
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </Table>
  )
}

export function Leaderboard(props: { shown: boolean; close: () => void }) {
  const isMobile = useMediaQuery('(max-width: 500px)')

  return (
    <Modal
      fullScreen={isMobile}
      opened={props.shown}
      onClose={props.close}
      sx={{ '.mantine-Modal-content': { maxHeight: isMobile ? '100dvh' : '90vh' } }}
      title={<Title>Leaderboard</Title>}
    >
      <Tabs defaultValue="combined">
        <Tabs.List>
          <Tabs.Tab value="combined">Combined</Tabs.Tab>
          <Tabs.Tab value="challenge">Per challenge</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="combined">
          <LeaderboardCombined />
        </Tabs.Panel>

        <Tabs.Panel value="challenge">
          <LeaderboardChallenge />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
