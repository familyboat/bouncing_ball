import { sound } from '@pixi/sound'

class SoundManager {
  constructor() {
    const sounds: Array<string> = [
      'hurt-ball-danger_slice',
      'jump-ball-safe_slice',
      'success-ball-void',
    ]

    sounds.forEach((key) => {
      const url = new URL(`./sound/effects/${key}.wav`, import.meta.url).href
      sound.add(key, url)
    })
  }

  play(names: Array<string>) {
    const name = names.join('-')
    sound.play(name)
  }
}

export const soundManager = new SoundManager()
