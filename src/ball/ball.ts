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
import { soundManager } from './sound'

declare module '@dimforge/rapier3d-compat' {
  interface Collider {
    data: {
      id: number
      level?: number
    }
  }
}

const radiusOfBall = 0.3

function getPosition(angle: number) {
  const radian = MathUtils.degToRad(angle)
  const radius = (Floor.innerRadius + Floor.outerRadius) / 2
  return new Vector3(
    radius * Math.cos(radian),
    radiusOfBall,
    radius * Math.sin(radian)
  )
}

export class Ball {
  static readonly radius = radiusOfBall
  static readonly startPosition = getPosition(90)
  static readonly startVelocity = new Vector3(0, Ball.radius * 30, 0)
  private mesh: Mesh
  private rigidBody: RigidBody

  constructor(world: World, parent: Scene) {
    const geometry = new SphereGeometry(Ball.radius)
    const material = new MeshPhongMaterial({ color: 0xffff00 })
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
      .setLinvel(
        Ball.startVelocity.x,
        Ball.startVelocity.y,
        Ball.startVelocity.z
      )
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
    camera.position.set(
      position.x,
      position.y + Ball.radius * 5,
      position.z + Ball.radius * 10
    )
    camera.lookAt(position.x, position.y - Ball.radius, position.z)
  }

  resetVel(currentLevel: number | undefined) {
    if (currentLevel === undefined) {
      throw new Error(`There must be something wrong, please check it.`)
    }

    const position = this.rigidBody.translation()
    this.rigidBody.setBodyType(RigidBodyType.KinematicVelocityBased, false)
    this.rigidBody.setLinvel(
      {
        x: Ball.startVelocity.x,
        y: Ball.startVelocity.y,
        z: Ball.startVelocity.z,
      },
      false
    )
    this.rigidBody.setTranslation(
      {
        x: position.x,
        y: -currentLevel * Floor.offset + Ball.radius,
        z: position.z,
      },
      false
    )

    this.rigidBody.setBodyType(RigidBodyType.Dynamic, true)

    soundManager.play(['jump', 'ball', 'safe_slice'])
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

    soundManager.play(['hurt', 'ball', 'danger_slice'])
  }

  reset() {
    this.rigidBody.setBodyType(RigidBodyType.KinematicVelocityBased, false)
    this.rigidBody.setLinvel(
      {
        x: Ball.startVelocity.x,
        y: Ball.startVelocity.y,
        z: Ball.startVelocity.z,
      },
      false
    )
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
