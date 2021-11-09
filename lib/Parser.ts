import { spawn } from 'child_process'
import { writeFileSync } from 'fs';
import * as ffprobe from 'ffprobe'

interface Segment {
    start: number
    end: number
}

export class Parser {
    /**
     *  Inverse of silentSegments
     */
    public async audioSegments(input: string) {
        const silentSegments = await this.quietSegments(input)
        const silentArray = silentSegments.flatMap(segment => [segment.start, segment.end])
        const audioArray = [...silentArray]

        if (audioArray[0] === 0) {
            audioArray.shift()
        } else {
            audioArray.unshift(0)
        }

        const audioLength = await this.getAudioLength(input)

        if (audioArray[audioArray.length - 1] === audioLength) {            
            audioArray.pop()
        } else {
            audioArray.push(audioLength)
        }

        const audioSegments: Segment[] = []

        audioArray.forEach((el, i) => {
            if (i % 2 === 0) {
                audioSegments.push({
                    start: el,
                    end: audioArray[i + 1]
                })
            }
        })
        return audioSegments
    }

    public async quietSegments(input: string) {
        const ffmpeg = spawn(process.env.FFMPEG_PATH as string, [
            '-i',
            input,
            '-vn',
            '-af',
            'silencedetect=noise=-32dB:d=0.5',
            '-f',
            'null',
            '-'
        ])
        
        const silence: any[] = []
        
        ffmpeg.stdout.on('data', (data: Buffer) => console.log(data.toString()))
        ffmpeg.stderr.on('data', (data: Buffer) => {
            data.toString()
            .split('\n')
            .filter((row) => row != '')
            .forEach((row) => {
                this.parseSilence(row, silence)
            })
        })
    
        return new Promise<Segment[]>((resolve) => {
            ffmpeg.on('exit', () => resolve(silence))
        })
    }

    public async concatSegments(input: string, segments: Segment[], output: string, progress?: (data: number) => void): Promise<void> {
        const text = segments.flatMap(segment => [
            `file '${input}'`, 
            `inpoint ${segment.start}`, 
            `outpoint ${segment.end}`
        ]).join('\n')

        const TEMP_FILE_NAME = '.jumpcutter.temp'

        writeFileSync(TEMP_FILE_NAME, text)
        
        const args = [
            '-y',
            '-safe',
            '0',
            '-f',
            'concat',
            '-segment_time_metadata',
            '1',
            '-i',
            TEMP_FILE_NAME,
            '-vf',
            'select=concatdec_select',
            '-af',
            'aselect=concatdec_select,aresample=async=1',
            output
        ]

        const ffmpeg = spawn(process.env.FFMPEG_PATH as string, args)

        ffmpeg.stdout.on('data', (data: Buffer) => {
            // console.log('stdout', data.toString());
        })

        ffmpeg.stderr.on('data', (data: Buffer) => {      
            // console.log(data.toString());
                  
            if (progress) {
                const getProcessingVideoAt = (data: Buffer): void | number => {
                    const [progressText] = data.toString().match(/(?<=\dkB time=)(.*)(?= bitrate)/g) || []
                    if (progressText) {                
                        const processingAtVideoSeconds = progressText.split(':').map((el, i) => {
                            if (i === 0) return Number(el) * 60 * 60
                            else if (i === 1) return Number(el) * 60
                            else if (i === 2) {
                                const [seconds, fractional] = el.split('.')
                                return Number(seconds) + Number(fractional) / 60
                            } else return 0
                        }).reduce((a, b) => a + b)                    
                        return processingAtVideoSeconds
                    }
                }

                const cursor = getProcessingVideoAt(data)
                if (cursor) {
                    progress(cursor / newLength)
                }
            }
        })

        const newLength = segments.map(el => el.end - el.start).reduce((a, b) => a + b)
        const oldLength = await this.getAudioLength(input)
        const savedTime = oldLength - newLength

        return new Promise<void>(resolve => {                const formatNumber = (num: number): string => {
                    return String(Math.round(num * 100) / 100)
                }
            ffmpeg.on('exit', () => {
                resolve()
            })
        })
    }

    private async getAudioLength(input: string): Promise<number> {
        return ffprobe(input, { path: process.env.FFPROBE_PATH as string })
            .then((info: any) => Number(info.streams[1].duration))
    }

    private parseSilence(str: string, silencePointer: any[]): void {
        if (str.includes('silence_start')) {
            const start = str.match(/(?<=silence_start: )[0-9]+(\.?)[0-9]*/g) || [0]
            silencePointer.push({
                start: Number(start[0]),
                end: null,
            })
        }
        if (str.includes('silence_end')) {
            const end = str.match(/(?<=silence_end: )[0-9]+(\.?)[0-9]*/g)
            // const duration = str.match(/(?<=silence_duration: )[0-9]+(\.?)[0-9]*/g)
            if (end) {
                const objref = silencePointer[silencePointer.length - 1]
                objref.end = Number(end[0])
            }
        }
    }
}
