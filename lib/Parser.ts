import { spawn, exec } from 'child_process'
import * as fs from 'fs-extra' // should I use multer?

export class Parser {
  private input: string
  private output: string

  private length: number = 0
  private curr: number = 0
  private silence: any[] = []
  private speed: number = 0

  // callbacks
  private progress?: Function | null
  private done?: Function | null

  constructor(input: string, output: string, progress?: Function | null, done?: Function | null) {
    this.progress = progress
    this.done = done
    this.input = input
    this.output = output
  }

  private stderr = (str: string) => {
    // console.log('stderr: ' + str);
  
    this.length <= 0 ? this.setLength(str) : null
    this.setCurr(str)
    this.setSpeed(str)
    this.parseSilence(str)

    if (this.progress && this.length !== 0) {
      const silenceDelta = this.silence[this.silence.length - 1] || {}

      this.progress(
        this.length,
        this.curr,
        silenceDelta,
        this.silenceSum(),
        this.speed
      )
    }
  }

  private silenceSum = (): number => this.silence.length > 0 ? this.silence.map(obj => obj.duration).reduce((a, b) => a + b) || 0 : 0

  private stdout = (str: string) => console.log('stderr: ' + str)

  public parse = (): void => {
    spawn('cp', [this.input, `media/${this.output}`]) // TODO a bit dangerous
    const ffmpeg = spawn('./ffmpeg', ['-i', this.input, '-vn', '-af', 'silencedetect=noise=-30dB:d=0.5', '-f', 'null', '-']);
    // console.log(ffmpeg)
  
    ffmpeg.stdout.on('data', (data: Buffer) => this.stdout(data.toString()));
    ffmpeg.stderr.on('data', (data: Buffer) => data.toString().split('\n').filter(el => el !== '').forEach(this.stderr))
  
    ffmpeg.on('exit', (data: Buffer) => this.exit(data.toString()));
  }

  private exit = async (str: string) => {
    await fs.writeFile(`media/${this.output}.js`, 'const silence = ' + JSON.stringify(this.silence, null, 2), 'utf8')

    // TODO add total time took processing and speed
    if (this.done) {
      this.done(str, this.silence, this.length, this.silenceSum())
    }
  }

  private setSpeed = (str: string) => {
    const match = str.match(/(?<=speed=)(.*)(?=x)/g)
    match ? this.speed = Number(match[0]) : null
  }

  private parseSilence = (str: string) => {
    if (str.includes('silence_start')) {
      const start = str.match(/(?<=silence_start: )[0-9]+(\.?)[0-9]*/g) || [0]
      this.silence.push({
        start: Number(start[0]),
        end: null,
        duration: null
      })
    } 
    if (str.includes('silence_end')) {
      const end = str.match(/(?<=silence_end: )[0-9]+(\.?)[0-9]*/g)
      const duration = str.match(/(?<=silence_duration: )[0-9]+(\.?)[0-9]*/g)
      if (end && duration) {
        const objref = this.silence[this.silence.length -1]
        objref.end = Number(end[0])
        objref.duration = Number(duration[0])
      }
    }
  }

  private parseTimestamp = (str: string): number => {
    // str = "HH:MM:SS:sss"
    const match = str.match(/[0-9]{2,}/g) //["HH", "MM2, "SS", "sss"]
    let numArr = match ? match.map(x => Number(x)) : null //[HH, MM, SS, sss] number[]
    let seconds = numArr ? numArr[0] * 60 * 60 + numArr[1] * 60 + numArr[2] + numArr[3] / 1000 : null // 3600,12 length in seconds
    if (!seconds) throw new Error(`Invalid input ${str}, could not parse`)
    return seconds
  } 

  private setLength = (str: string): void => {
    let match = str.match(/(?<=Duration: )(.*)(?=, start)/g) //["HH:MM:SS.sss"]
    const length = match ? this.parseTimestamp(match[0]) : null
    length ? this.length = length : null
  }

  private setCurr = (str: string): void => {
    let match = str.match(/(?<=time=)(.*)(?= bitrate)/g) // //["HH:MM:SS.sss"]
    const curr = match ? this.parseTimestamp(match[0]) : null
    curr ? this.curr = curr : null
  }
}