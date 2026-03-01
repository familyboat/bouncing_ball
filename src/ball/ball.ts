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
import gsap from 'gsap'
import { throttle } from 'lodash-es'

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
  private state: 'die' | 'moving' = 'moving'
  private parent: Scene

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
    this.parent = parent

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

    this.spawnShadowBall = throttle(this.spawnShadowBall.bind(this), 66)
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

    this.spawnShadowBall()
  }

  spawnShadowBall() {
    if (this.state === 'moving') {
      const position = this.mesh.position
      new ShadowBall(position, this.parent)
    }
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

    this.state = 'die'

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

    this.state = 'moving'
  }
}

class ShadowBall {
  constructor(pos: Vector3, parent: Scene) {
    const geometry = new SphereGeometry(Ball.radius)
    const material = new MeshPhongMaterial({
      color: 0x9f9f9f,
    })
    const mesh = new Mesh(geometry, material)
    mesh.position.set(pos.x, pos.y, pos.z)

    parent.add(mesh)

    const config = {
      scale: 0,
    }

    gsap.from(config, {
      scale: 1,
      duration: 0.66,
      onUpdate() {
        mesh.scale.set(config.scale, config.scale, config.scale)
      },
      onComplete() {
        parent.remove(mesh)
      },
    })
  }
}
