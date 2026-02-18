import {
  ActiveEvents,
  ColliderDesc,
  RigidBodyDesc,
  RigidBodyType,
  type RigidBody,
  type World,
} from '@dimforge/rapier3d-compat'
import {
  MathUtils,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  SphereGeometry,
  Vector3,
  type Scene,
} from 'three'
import { Floor } from './floor'

declare module '@dimforge/rapier3d-compat' {
  interface Collider {
    data: {
      id: number
      level?: number
    }
  }
}

function getPosition(angle: number) {
  const radian = MathUtils.degToRad(angle)
  const radius = (Floor.innerRadius + Floor.outerRadius) / 2
  return new Vector3(radius * Math.cos(radian), 0.3, radius * Math.sin(radian))
}

export class Ball {
  static readonly radius = 0.3
  static readonly startPosition = getPosition(90)
  private mesh: Mesh
  private rigidBody: RigidBody

  constructor(world: World, parent: Scene) {
    const geometry = new SphereGeometry(Ball.radius)
    const material = new MeshPhongMaterial({ emissive: 0xffff00 })
    this.mesh = new Mesh(geometry, material)
    this.mesh.position.set(
      Ball.startPosition.x,
      Ball.startPosition.y,
      Ball.startPosition.z
    )
    parent.add(this.mesh)

    const rigidBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(
        Ball.startPosition.x,
        Ball.startPosition.y,
        Ball.startPosition.z
      )
      .setLinvel(0, 8, 0)
      .enabledTranslations(false, true, false)
      .setCcdEnabled(true)
    this.rigidBody = world.createRigidBody(rigidBodyDesc)
    const colliderDesc = ColliderDesc.ball(Ball.radius)
      .setRestitution(1)
      .setActiveEvents(ActiveEvents.COLLISION_EVENTS)
    const collider = world.createCollider(colliderDesc, this.rigidBody)
    collider.data = {
      id: 1,
    }
  }

  render(camera: PerspectiveCamera) {
    const position = this.rigidBody.translation()
    this.mesh.position.set(position.x, position.y, position.z)
    camera.position.set(position.x, position.y + 2, position.z + 0)
    camera.lookAt(position.x, position.y, position.z)
  }

  resetVel(currentLevel: number | undefined) {
    if (currentLevel === undefined) {
      throw new Error(`There must be something wrong, please check it.`)
    }

    const position = this.rigidBody.translation()
    this.rigidBody.setBodyType(RigidBodyType.KinematicVelocityBased, false)
    this.rigidBody.setLinvel({ x: 0, y: 8, z: 0 }, false)
    this.rigidBody.setTranslation(
      {
        x: position.x,
        y: -currentLevel * Floor.offset + Ball.radius,
        z: position.z,
      },
      false
    )

    this.rigidBody.setBodyType(RigidBodyType.Dynamic, true)
  }

  die(currentLevel: number | undefined) {
    if (currentLevel === undefined) {
      throw new Error(`There must be something wrong, please check it.`)
    }
    const position = this.rigidBody.translation()
    this.rigidBody.setBodyType(RigidBodyType.Fixed, false)
    this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, false)
    this.rigidBody.setTranslation(
      {
        x: position.x,
        y: -currentLevel * Floor.offset + Ball.radius,
        z: position.z,
      },
      false
    )
  }

  reset() {
    this.rigidBody.setBodyType(RigidBodyType.KinematicVelocityBased, false)
    this.rigidBody.setLinvel({ x: 0, y: 8, z: 0 }, false)
    this.rigidBody.setTranslation(
      {
        x: Ball.startPosition.x,
        y: Ball.startPosition.y,
        z: Ball.startPosition.z,
      },
      false
    )

    this.rigidBody.setBodyType(RigidBodyType.Dynamic, true)
  }
}
