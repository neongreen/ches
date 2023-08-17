import { Uuid } from '@/utils/uuid'
import _ from 'lodash'
import { Simp_2021_08_17 } from './chess-simp/2021-08'
import { Simp_2021_10_16 } from './chess-simp/2021-10'
import { Simp_2021_12_04 } from './chess-simp/2021-12'
import { Simp_2022_01_29 } from './chess-simp/2022-01'
import { Simp_2022_02_10, Simp_2022_02_11 } from './chess-simp/2022-02'
import { Simp_2022_03_07, Simp_2022_03_29 } from './chess-simp/2022-03'
import { Simp_2022_04_21, Simp_2022_04_22 } from './chess-simp/2022-04'
import {
  Simp_2022_05_12,
  Simp_2022_05_17,
  Simp_2022_05_24,
  Simp_2022_05_30,
  Simp_2022_05_31,
} from './chess-simp/2022-05'
import { Simp_2022_06_03, Simp_2022_06_23 } from './chess-simp/2022-06'
import { Simp_2022_07_11, Simp_2022_07_18 } from './chess-simp/2022-07'
import {
  Simp_2022_09_11,
  Simp_2022_09_19,
  Simp_2022_09_26,
  Simp_2022_09_29,
} from './chess-simp/2022-09'
import { Simp_2023_01_09 } from './chess-simp/2023-01'
import { Simp_2023_02_23 } from './chess-simp/2023-02'
import { Simp_2023_04_01 } from './chess-simp/2023-04'
import { Simp_2023_05_23 } from './chess-simp/2023-05'
import { Simp_2023_06_09 } from './chess-simp/2023-06'
import { Challenge, ChallengeMeta } from './core'

/**
 * All Chess Simp challenges.
 */
export const chessSimpChallenges: Map<Uuid, { meta: ChallengeMeta; create: () => Challenge }> =
  new Map(
    _.concat(
      [() => new Simp_2021_08_17() as Challenge],
      [() => new Simp_2021_10_16() as Challenge],
      [() => new Simp_2021_12_04() as Challenge],
      [() => new Simp_2022_01_29() as Challenge],
      [() => new Simp_2022_02_10() as Challenge, () => new Simp_2022_02_11() as Challenge],
      [() => new Simp_2022_03_07() as Challenge, () => new Simp_2022_03_29() as Challenge],
      [() => new Simp_2022_04_21() as Challenge, () => new Simp_2022_04_22() as Challenge],
      [
        () => new Simp_2022_05_12() as Challenge,
        () => new Simp_2022_05_17() as Challenge,
        () => new Simp_2022_05_24() as Challenge,
        () => new Simp_2022_05_30() as Challenge,
        () => new Simp_2022_05_31() as Challenge,
      ],
      [() => new Simp_2022_06_03() as Challenge, () => new Simp_2022_06_23() as Challenge],
      [() => new Simp_2022_07_18() as Challenge, () => new Simp_2022_07_11() as Challenge],
      [
        () => new Simp_2022_09_11() as Challenge,
        () => new Simp_2022_09_19() as Challenge,
        () => new Simp_2022_09_26() as Challenge,
        () => new Simp_2022_09_29() as Challenge,
      ],
      [() => new Simp_2023_01_09() as Challenge],
      [() => new Simp_2023_02_23() as Challenge],
      [() => new Simp_2023_04_01() as Challenge],
      [() => new Simp_2023_05_23() as Challenge],
      [() => new Simp_2023_06_09() as Challenge]
    ).map((challengeFn) => [
      challengeFn().meta.uuid,
      { meta: challengeFn().meta, create: challengeFn },
    ])
  )
