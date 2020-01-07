#!/usr/bin/env node

import * as commander from 'commander'
import * as cliProgress from 'cli-progress'
import { Parser } from './Parser'

const program = new commander.Command()

program.version('0.0.1')

program
    .option('-i, --input <input>', 'input file or url')
    .option('-o, --output <output>', 'output file')
    .option('-c, --copy', "Copy video file into app cache instead of move")
    .parse(process.argv)

if (!program.input) throw new Error("Input is mandatory")
if (!program.output) program.output = program.input.split('/').pop()

const bar = new cliProgress.Bar({
    format: '{output} [{bar}] {value}% | Speed: {speed}x',
    etaBuffer: 100
}, cliProgress.Presets.shades_classic);
bar.start(100, 0);
bar.update(0, {speed: '0', output: program.output})



const done = (exitCode: any, silence: any) => {
    bar.update(100, {speed: '0'})
    bar.stop()
    // console.log(`ffmpeg exit code: ${exitCode}`)
    process.exit(0)
}

const progress = (length: any, current: any, silenceDelta: any, silenceSum: any, speed: any) => {
    bar.update(Math.round(current / length * 10000)/100, {speed: speed.toString()})
}

new Parser(program.input, program.output, program.copy, progress, done).parse()