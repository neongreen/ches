import { challengesList, challengesMap } from '@/challenges/all'
import { challengeLeaderboard, challengeWinner, compareRecords } from '@/challenges/core'
import { users } from '@/challenges/users'
import { Box, Center, Modal, Table, Tabs, Title } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import _ from 'lodash'
import * as R from 'ramda'
import React from 'react'
import { RecordBadge } from './recordBadge'
import { Record } from '@/challenges/core'

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
                  <td>{Number(score.toFixed(3))}</td>
                </tr>
              )
          )
        })()}
      </tbody>
    </Table>
  )
}

function LeaderboardCurrentChallenge(props: {
  challenge: { title: string; records: Map<string, Record> }
}) {
  return (
    <>
      <Box mt="md" mb="sm" ml="xs">
        <b>{props.challenge.title}</b>
      </Box>
      <Table mb="md">
        <tbody>
          {props.challenge.records.size === 0 ? (
            <tr>
              <td>
                <i>Unbeaten</i>
              </td>
            </tr>
          ) : (
            R.sort(
              (a, b) => compareRecords(a[1], b[1], { considerDate: true }),
              Array.from(props.challenge.records.entries())
            ).map(([name, record]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>
                  <RecordBadge size="sm" winner={{ record }} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  )
}

function LeaderboardAllChallenges() {
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

export function Leaderboard(props: {
  shown: boolean
  close: () => void
  currentChallenge: { title: string; records: Map<string, Record> }
}) {
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
          <Tabs.Tab value="combined">Points</Tabs.Tab>
          <Tabs.Tab value="currentChallenge">This challenge</Tabs.Tab>
          <Tabs.Tab value="allChallenges">All challenges</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="combined">
          <LeaderboardCombined />
        </Tabs.Panel>

        <Tabs.Panel value="currentChallenge">
          <LeaderboardCurrentChallenge challenge={props.currentChallenge} />
        </Tabs.Panel>

        <Tabs.Panel value="allChallenges">
          <LeaderboardAllChallenges />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
