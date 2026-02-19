import * as THREE from 'three'
import { Ball } from './ball'
import RAPIER, { EventQueue } from '@dimforge/rapier3d-compat'
import { Platform } from './platform'
import { sliceType } from './slice'
import Stats from 'three/examples/jsm/libs/stats.module.js'

export async function runGame() {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    500
  )

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  const stats = new Stats()
  document.body.appendChild(stats.dom)

  function addLight() {
    const color = 0xffffff
    const intensity = 1.8
    const light = new THREE.DirectionalLight(color, intensity)
    light.position.set(-1, 2, 4)
    scene.add(light)
  }

  addLight()

  await RAPIER.init()
  const world = new RAPIER.World({
    x: 0,
    y: -9.81,
    z: 0,
  })

  const eventQueue = new EventQueue(true)

  const ball = new Ball(world, scene)
  const platform = new Platform(world, scene)

  function reset() {
    platform.reset()
    ball.reset()
  }

  let lastX: number | null = null
  function onPointerMove(e: TouchEvent) {
    const x = e.touches[0].clientX
    if (lastX === null) {
      lastX = x
      return
    }

    const movementX = x - lastX
    lastX = x

    let rotation

    if (movementX > 0) {
      rotation = 5
    } else if (movementX < 0) {
      rotation = -5
    } else {
      return
    }

    platform.rotate(rotation)
  }

  window.addEventListener('touchmove', onPointerMove)
  window.addEventListener('dblclick', reset)

  function animate() {
    stats.begin()
    world.step(eventQueue)

    let result = 1
    let level: number | undefined
    eventQueue.drainCollisionEvents((handle1, handle2) => {
      const aCollider = world.getCollider(handle1)
      const bCollider = world.getCollider(handle2)

      level = aCollider.data.level || bCollider.data.level

      result *= aCollider.data.id * bCollider.data.id
    })

    switch (result) {
      case sliceType.safe * sliceType.void:
      case sliceType.safe * sliceType.safe:
      case sliceType.safe: {
        ball.resetVel(level)
        break
      }
      case sliceType.danger * sliceType.danger:
      case sliceType.danger * sliceType.safe:
      case sliceType.danger * sliceType.void:
      case sliceType.danger: {
        ball.die(level)
        break
      }
      case sliceType.void * sliceType.void:
      case sliceType.void: {
        platform.updateScore(level)
        break
      }
    }

    renderer.render(scene, camera)
    ball.render(camera)
    stats.end()
  }

  renderer.setAnimationLoop(animate)
}
