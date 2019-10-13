import * as Mustache from 'mustache'
import * as express from 'express'
import * as fs from 'fs-extra'

import { index } from './templates/index'
import { file } from './templates/file'

const app = express()
const port = 3000

app.use('/static', express.static('static'))
app.use('/media', express.static('media'))
   
app.get('/', async (req, res) => {
    const dir = await fs.readdir('./media')
    const files = dir.filter(el => !el.endsWith('.js') && el !== '.DS_Store')
    const render = Mustache.render(index, { files })
    res.send(render)
})

app.get('/file/:file', async (req, res) => {
    const render = Mustache.render(file, {file: req.params.file})
    res.send(render)
})

app.listen(port, () => console.log(`Example app listening on port ${port}`))