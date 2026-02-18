import { type World } from '@dimforge/rapier3d-compat'
import { Group, type Scene } from 'three'
import { deriveFromFloorBase, Floor, floor1 } from './floor'

/**
 * is consisted of floors
 */
export class Platform {
  private floors: Array<Floor> = []
  private group: Group
  private world: World
  private nextLevel = 0
  private countOfPassedLevel = 0
  private score = 0

  constructor(world: World, parent: Scene) {
    const group = new Group()
    parent.add(group)
    this.group = group
    this.world = world

    this.generate()
  }

  rotate(angle: number) {
    this.floors.forEach((floor) => floor.rotate(angle))
  }

  private generate() {
    let count = 0
    while (count < 10) {
      this.floors.push(
        new Floor(
          this.world,
          this.group,
          this.nextLevel,
          deriveFromFloorBase(floor1)
        )
      )
      count++
      this.nextLevel++
    }
  }

  private shouldGenerate(currentLevel: number) {
    if (this.nextLevel - currentLevel < 5) {
      return true
    } else {
      return false
    }
  }

  private shouldDestroy(currentLevel: number) {
    if ((this.nextLevel - currentLevel) / this.floors.length < 0.25) {
      return true
    } else {
      return false
    }
  }

  private destroy() {
    let count = 0
    while (count < 10) {
      const floor = this.floors.shift()
      floor?.destroy()
      count++
    }
  }

  private destroyAll() {
    this.floors.forEach((floor) => floor.destroy())
    this.floors = []
  }

  updateScore(currentLevel: number | undefined) {
    if (currentLevel === undefined) {
      throw new Error(`There must be something wrong, please check it.`)
    }

    if (currentLevel === this.countOfPassedLevel) {
      const floor = this.floors.find((floor) => floor.level === currentLevel)
      floor?.fly()
      this.score++
      console.log(
        `latest stat:\nscore: ${this.score}\ncurrentLevel: ${currentLevel}\nnextLevel: ${this.nextLevel}\ncountOfFloor: ${this.floors.length}`
      )
      this.countOfPassedLevel++

      if (this.shouldDestroy(currentLevel)) {
        this.destroy()
      }

      if (this.shouldGenerate(currentLevel)) {
        this.generate()
      }
    } else if (currentLevel === this.countOfPassedLevel - 1) {
      // pass
    } else {
      throw new Error(`There must be something wrong, please check it.`)
    }
  }

  reset() {
    this.destroyAll()
    this.nextLevel = 0
    this.countOfPassedLevel = 0
    this.score = 0
    this.generate()
  }
}
