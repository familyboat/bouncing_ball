import type { World } from '@dimforge/rapier3d-compat'
import { Group } from 'three'
import { type SliceType, sliceType, Slice } from './slice'
import { shuffle } from './util'

type FloorConfig = Array<{
  startAngle: number
  count: number
  type: SliceType
}>

type FloorBase = Array<{
  count: number
  type: SliceType
}>

export const floor1: FloorBase = [
  {
    count: 6,
    type: sliceType.safe,
  },
  {
    count: 6,
    type: sliceType.danger,
  },
  {
    count: 6,
    type: sliceType.void,
  },
  {
    count: 6,
    type: sliceType.void,
  },
]

export function deriveFromFloorBase(floorBase: FloorBase) {
  const newFloorBase = shuffle(floorBase)
  let startAngle = 0
  const newFloor = newFloorBase.map((base) => {
    const slice = {
      startAngle: startAngle,
      count: base.count,
      type: base.type,
    }

    startAngle += base.count * Slice.minAngle

    return slice
  })

  if (startAngle !== 360) {
    throw new Error(`there must be something wrong, please check it.`)
  }

  return newFloor
}

export class Floor {
  /**
   * the distance between adjacent floors
   */
  static readonly offset = 5
  static readonly height = 0.2
  static readonly innerRadius = 1.8
  static readonly outerRadius = 3.24

  private slices: Array<Slice> = []
  private parent: Group
  private group: Group
  readonly level: number

  constructor(
    world: World,
    parent: Group,
    level: number,
    floorConfig: FloorConfig
  ) {
    const group = new Group()
    parent.add(group)

    this.parent = parent
    this.group = group
    this.level = level

    const floor = floorConfig
    floor.forEach((slice) => {
      this.slices.push(
        new Slice(world, group, {
          startAngle: slice.startAngle,
          count: slice.count,
          level,
          type: slice.type,
        })
      )
    })
  }

  rotate(angle: number) {
    this.slices.forEach((slice) => slice.rotate(angle))
  }

  destroy() {
    this.slices.forEach((slice) => slice.destroy())
    this.parent.remove(this.group)
  }

  fly() {
    this.slices.forEach((slice) => slice.fly())
  }
}
