#!/usr/bin/env node

import * as commander from 'commander'
import { Parser } from './Parser'

const program = new commander.Command()

program.version('0.0.1')

program.option('-i, --input <input>', 'input file or url').parse(process.argv)

if (!program.input) throw new Error('Input is mandatory')

new Parser(program.input).parse()
