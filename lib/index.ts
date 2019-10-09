import { v4 } from 'uuid'
import { spawn } from 'child_process'
import * as fs from 'fs-extra' // should I use multer?

class Parser {
  private input: string
  private output: string

  private length: number = 0
  private curr: number = 0
  private silenceComing: boolean = false
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

  private stderr = (data: Buffer) => {
    const str = data.toString()
    // console.log('stderr: ' + str);
  
    this.length <= 0 ? this.setLength(str) : null
    this.setCurr(str)
    this.setSpeed(str)

    if (!this.silenceComing) this.silenceComing = this.isSilenceComing(str)
    if (this.silenceComing) this.parseSilence(str)

    if (this.progress) {
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

  private silenceSum = (): number => {
    return this.silence.length > 0 ? this.silence.map(obj => obj.duration).reduce((a, b) => a + b) || 0 : 0
  }

  private stdout = (data: Buffer) => {
    const str = data.toString()
    // console.log('stderr: ' + str);
  }

  public parse = (): void => {
    const ffmpeg = spawn('./ffmpeg', ['-i', this.input, '-af', 'silencedetect=noise=-30dB:d=0.5', this.output]);
  
    ffmpeg.stdout.on('data', this.stdout);
    ffmpeg.stderr.on('data', this.stderr);
  
    ffmpeg.on('exit', this.exit);
  }

  private exit = async (code: Buffer) => {
    await fs.writeFile(`${this.output}.js`, 'const silence = ' + JSON.stringify(this.silence, null, 2), 'utf8')

    // TODO add total time took processing and speed
    if (this.done) {
      this.done(code.toString(), this.silence, this.length, this.silenceSum())
    }
  }

  private setSpeed = (str: string) => {
    const match = str.match(/(?<=speed=)(.*)(?=x)/g)
    match ? this.speed = Number(match[0]) : null
  }

  private parseSilence = (str: string) => {
    if (str.includes('silence_start')) {
      const match = str.match(/[0-9]+(\.)[0-9]+/g) || [0]
      this.silence.push({
        start: Number(match[0]),
        end: null,
        duration: null
      })
      this.silenceComing = false
    } else if (str.includes('silence_end')) {
      const match = str.match(/[0-9]+(\.)[0-9]+/g)
      if (match) {
        const objref = this.silence[this.silence.length -1]
        objref.end = Number(match[0])
        objref.duration = Number(match[1])
      }
      this.silenceComing = false
    }
  }

  private isSilenceComing = (str: string): boolean => str.includes('silencedetect')

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

const done = (exitCode: any, silence: any) => {
  console.log(`exit code: ${exitCode}`)
  console.log(silence)
}

const progress = (length: any, current: any, silenceDelta: any, silenceSum: any, speed: any) => {
  const percentage = (a: number, b: number): string => `${Math.round(a / b * 10000)/100}%`
  
  console.log(`total length: ${Math.round(length / 6) / 10} min, progress: ${percentage(current, length)}, saved time: ${percentage(silenceSum, current)}, processing speed: ${speed}x`)
  // console.log(silenceDelta)
}

//const input = "https://webcast.helsinki.fi/static/engage-player/44ea9289-cc37-40db-aec3-e77316088d08/353b849a-9c18-4bfc-a179-d1fa90ba9e42/oikkonen_ocast_l9_20190926_091608Z_S1R1.mp4"
const input = "https://webcast.helsinki.fi/static/engage-player/4c4d6145-84e0-4cf1-9930-6384192733c8/512297d8-f37e-4e1b-a872-30da68703c59/jkivinen_ocast_l9_20190117_162705Z_S1R1.mp4"
const output = `${v4()}.mp4`
new Parser(input, output, progress, done).parse()