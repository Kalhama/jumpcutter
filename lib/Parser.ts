import { spawn } from 'child_process'

export class Parser {
    private input: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private silence: any[] = []

    constructor(input: string) {
        this.input = input
    }

    private stderr = (data: Buffer) => {
        data.toString()
            .split('\n')
            .filter((el) => el != '')
            .forEach((str) => {
                // console.log('stderr: ' + str);
                this.parseSilence(str)
            })
    }

    private stdout = (str: Buffer) => console.log('stderr: ' + str.toString())

    public parse = (): void => {
        const ffmpeg = spawn('ffmpeg', [
            '-i',
            this.input,
            '-vn',
            '-af',
            'silencedetect=noise=-30dB:d=0.5',
            '-f',
            'null',
            '-'
        ])

        ffmpeg.stdout.on('data', this.stdout)
        ffmpeg.stderr.on('data', this.stderr)

        ffmpeg.on('exit', this.exit)
    }

    private exit = async (_data: Buffer) => {
        process.stdout.write(JSON.stringify(this.silence, null, 2))
        process.exit(0)
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
                const objref = this.silence[this.silence.length - 1]
                objref.end = Number(end[0])
                objref.duration = Number(duration[0])
            }
        }
    }
}
