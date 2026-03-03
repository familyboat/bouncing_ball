class Score {
  private _score = 0
  get score() {
    return this._score
  }

  increment() {
    this._score += 1
    console.log(`current score: ${this._score}`)
  }

  reset() {
    this._score = 0
  }
}

export const score = new Score()
