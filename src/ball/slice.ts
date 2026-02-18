import {
  World,
  RigidBody,
  RigidBodyDesc,
  ColliderDesc,
} from '@dimforge/rapier3d-compat'
import {
  Group,
  Mesh,
  Vector3,
  MathUtils,
  Shape,
  ExtrudeGeometry,
  MeshBasicMaterial,
  Quaternion,
} from 'three'
import { Floor } from './floor'

export const sliceType = {
  safe: 2,
  danger: 3,
  void: 5,
} as const
export type SliceType = (typeof sliceType)[keyof typeof sliceType]

export const sliceConfig: Record<
  SliceType,
  {
    color: number
  }
> = {
  [sliceType.danger]: {
    color: 0xff0000,
  },
  [sliceType.safe]: {
    color: 0x00ff00,
  },
  [sliceType.void]: {
    color: 0x000000,
  },
}

export class Slice {
  static readonly minAngle = 15

  private startAngle: number
  private count: number
  private world: World
  private parent: Group
  private mesh: Mesh
  private rigidBody: RigidBody
  private color: number
  private type: SliceType

  private rotation = 0

  constructor(
    world: World,
    parent: Group,
    options: {
      startAngle: number
      count: number
      level: number
      type: SliceType
    }
  ) {
    this.world = world
    this.parent = parent

    this.startAngle = options.startAngle
    this.count = options.count
    this.type = options.type
    this.color = sliceConfig[this.type].color

    if (this.startAngle % 15 !== 0) {
      throw new Error(
        `the start angle must be a multiple of 15 degree, but it is ${this.startAngle}`
      )
    }

    if (this.count % 1 !== 0) {
      throw new Error(`the count must be integer, but it is ${this.count}`)
    }

    if (this.count <= 0) {
      throw new Error(`the count must be positive, but it is ${this.count}`)
    }

    if (this.count >= 360 / Slice.minAngle) {
      throw new Error(
        `the count must less than ${360 / Slice.minAngle}, but it is ${
          this.count
        }`
      )
    }

    const position = new Vector3(
      0,
      -options.level * Floor.offset - Floor.height / 2,
      0
    )

    const startAngle = MathUtils.degToRad(this.startAngle)
    const endAngle = MathUtils.degToRad(
      this.startAngle + this.count * Slice.minAngle
    )

    const p0Cos = Math.cos(startAngle)
    const p0Sin = Math.sin(startAngle)
    const p1Cos = Math.cos(endAngle)
    const p1Sin = Math.sin(endAngle)

    const p0In = {
      x: Floor.innerRadius * p0Cos,
      y: Floor.innerRadius * p0Sin,
    }
    const p0Out = {
      x: Floor.outerRadius * p0Cos,
      y: Floor.outerRadius * p0Sin,
    }
    const p1In = {
      x: Floor.innerRadius * p1Cos,
      y: Floor.innerRadius * p1Sin,
    }

    const shape = new Shape()
    shape.moveTo(p0In.x, p0In.y)
    shape.lineTo(p0Out.x, p0Out.y)
    shape.absarc(0, 0, Floor.outerRadius, startAngle, endAngle, false)
    shape.lineTo(p1In.x, p1In.y)
    shape.absarc(0, 0, Floor.innerRadius, endAngle, startAngle, true)

    const geometry = new ExtrudeGeometry(shape, {
      depth: Floor.height,
      bevelEnabled: false,
      bevelSegments: 0,
      steps: 1,
    })

    const isVoid = this.type === sliceType.void

    const material = new MeshBasicMaterial({
      color: this.color,
      transparent: isVoid ? true : false,
      opacity: isVoid ? 0 : 1,
    })
    const mesh = new Mesh(geometry, material)
    mesh.position.set(position.x, position.y, position.z)
    mesh.rotateX(Math.PI / 2)
    this.parent.add(mesh)

    this.mesh = mesh

    const rigidBodyDesc = RigidBodyDesc.kinematicPositionBased().setTranslation(
      position.x,
      position.y,
      position.z
    )
    const rigidBody = world.createRigidBody(rigidBodyDesc)
    this.rigidBody = rigidBody

    for (let count = 0; count < this.count; count++) {
      const startAngle = MathUtils.degToRad(
        this.startAngle + count * Slice.minAngle
      )
      const endAngle = MathUtils.degToRad(
        this.startAngle + (count + 1) * Slice.minAngle
      )
      const vertices = [
        0,
        0,
        0,
        Floor.outerRadius * Math.cos(startAngle),
        0,
        Floor.outerRadius * Math.sin(startAngle),
        Floor.outerRadius * Math.cos(endAngle),
        0,
        Floor.outerRadius * Math.sin(endAngle),
      ]
      const indices = [0, 1, 2]

      const colliderDesc = ColliderDesc.trimesh(
        new Float32Array(vertices),
        new Uint32Array(indices)
      ).setRestitution(1)
      const collider = world.createCollider(colliderDesc, rigidBody)

      if (isVoid) {
        collider.setSensor(true)
      }

      collider.data = {
        id: this.type,
        level: options.level,
      }
    }
  }

  private ensureRotation() {
    if (this.rotation >= 360) {
      this.rotation = this.rotation % 360
    } else if (this.rotation < 0) {
      this.rotation = (this.rotation % 360) + 360
    }
  }

  rotate(angle: number) {
    const radian = MathUtils.degToRad(angle)
    this.rotation += angle
    this.ensureRotation()
    const axis = new Vector3(0, 1, 0)
    this.mesh.rotateOnWorldAxis(axis, radian)
    const quat = new Quaternion().setFromAxisAngle(
      axis,
      MathUtils.degToRad(this.rotation)
    )

    this.rigidBody.setRotation(
      {
        x: quat.x,
        y: quat.y,
        z: quat.z,
        w: quat.w,
      },
      true
    )
  }

  destroy() {
    this.world.removeRigidBody(this.rigidBody)
    this.parent.remove(this.mesh)
  }

  fly() {
    for (let i = 0; i < this.rigidBody.numColliders(); i++) {
      const collider = this.rigidBody.collider(i)
      collider.data.id = sliceType.void
      collider.setCollisionGroups(2)
    }
    const transparentMaterial = new MeshBasicMaterial({
      transparent: true,
      opacity: 0,
    })
    this.mesh.material = transparentMaterial
  }
}
