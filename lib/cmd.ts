#!/usr/bin/env node

import * as commander from 'commander'
import { Parser } from './Parser'
import * as pathToFfmpeg from 'ffmpeg-static'
import * as cliProgress from 'cli-progress'
import * as ffprobeStatic from 'ffprobe-static'
import { formatNumber } from './formatNumber'

const main = async () => {
    if (!process.env.FFMPEG_PATH) {
        process.env.FFMPEG_PATH = pathToFfmpeg
    }
    if (!process.env.FFPROBE_PATH) {
        process.env.FFPROBE_PATH = ffprobeStatic.path
    }

    const program = new commander.Command()

    program.version('0.0.1')
    const parser = new Parser()


    // program
    //     .command('silent-segments')
    //     .requiredOption('-i, --input <input>', 'input file')
    //     .action(async (input: string) => {
    //         const quietSegments = await parser.quietSegments(input)
    //         process.stdout.write(JSON.stringify(quietSegments, null, 2))
    //     })

    // program
    //     .command('audio-segments')
    //     .requiredOption('-i, --input <input>', 'input file')
    //     .action(async ({ input }) => {
    //         const audioSegments = await parser.audioSegments(input)
    //         const text = audioSegments.flatMap(segment => [`file '${input}'`, `inpoint ${segment.start}`, `outpoint ${segment.end}`]).join('\n')
    //         ffmpeg -safe 0 -f concat -segment_time_metadata 1 -i text.txt -vf select=concatdec_select -af aselect=concatdec_select,aresample=async=1 video_jumpcut.mp4
    //         writeFileSync('text.txt', text)
    //         process.stdout.write(JSON.stringify(text, null, 2))
    //     })
    program
        .command('analyse')
        .option('-s, --sensitivity <sensitivity>', 'dBA sensitivity', '30')
        .requiredOption('-i, --input <input>', 'input file')
        .action(async ({ input, sensitivity }) => {                       
            const audioSegments = await parser.audioSegments(input, sensitivity)
            const length = audioSegments[audioSegments.length - 1].end
            const audioLenght = audioSegments.map(el => el.end - el.start).reduce((a, b) => a + b)
            const silentLength = length - audioLenght
            console.log(`Total length ${formatNumber(length / 60)}min. From which ${formatNumber(audioLenght / 60)}min (${formatNumber(silentLength / 60)}min) is audio (silent). Total ${formatNumber(audioLenght / length * 100)}% (${formatNumber(silentLength / length * 100)}%) is audio (silent)`)
        })


    program
        .command('jumpcut')
        .option('-s, --sensitivity <sensitivity>', 'dBA sensitivity', '30')
        .requiredOption('-i, --input <input>', 'input file')
        .requiredOption('-o, --output <output>', 'output file')
        .action(async ({ input, output, sensitivity }) => {                      
            const audioSegments = await parser.audioSegments(input, sensitivity)

            const bar = new cliProgress.Bar(
                {
                    format: '[{bar}] {percentage}% | ETA: {eta}s',
                    stopOnComplete: true
                }, 
                cliProgress.Presets.shades_classic
            );
            bar.start(100, 0);
            
            await parser.concatSegments(
                input, 
                audioSegments, 
                output, 
                (progress) => {   
                    bar.update(progress * 100);
                }
            )
            bar.stop();
        })
        
    await program.parseAsync(process.argv);
}

main()