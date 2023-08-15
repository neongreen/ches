import { Badge, MantineSize } from '@mantine/core'
import { Record } from '@/challenges/core'

export function RecordBadge(props: {
  size: MantineSize
  recordPrefix?: boolean
  winner?: { name?: string; record: Record }
}) {
  const { winner } = props
  return winner ? (
    <Badge size={props.size} radius="sm" variant="filled" color={depthColors[winner.record.depth]}>
      {props.recordPrefix && 'Record: '}
      {winner.name ? winner.name + ' |' : ''} depth={winner.record.depth}{' '}
      {winner.record.moves !== undefined ? `moves=${winner.record.moves}` : ''}
    </Badge>
  ) : (
    <Badge size={props.size} radius="sm" variant="outline" color="gray">
      Unbeaten
    </Badge>
  )
}

export const depthColors = ['', 'indigo', 'indigo', 'lime', 'lime', 'yellow', 'yellow', 'red']
