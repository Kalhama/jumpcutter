import * as fs from 'fs-extra'

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const main = async () => {
  // const url = "https://webcast.helsinki.fi/static/engage-player/2497e055-e81d-43a2-8689-4fef6dc961cc/9a19ac39-815e-4f0d-abbd-69cf84589b1a/oikkonen_ocast_l9_20190919_091717Z_S1R1.mp4"

  // const url = "http://techslides.com/demos/sample-videos/small.mp4"
  /*
  try {
    console.log("Downloading")
    const { stdout, stderr } = await exec(`curl ${url} -o video.mp4`)
    // console.log(stdout, stderr)
  } catch (e) {
    console.log(e)
  }
  */

  // ffmpeg -i https://webcast.helsinki.fi/static/engage-player/2497e055-e81d-43a2-8689-4fef6dc961cc/9a19ac39-815e-4f0d-abbd-69cf84589b1a/oikkonen_ocast_l9_20190919_091717Z_S1R1.mp4 -af silencedetect=noise=-30dB:d=0.5 -f null - 2> quiet.txt

  // ffmpeg -i https://webcast.helsinki.fi/static/engage-player/2497e055-e81d-43a2-8689-4fef6dc961cc/9a19ac39-815e-4f0d-abbd-69cf84589b1a/oikkonen_ocast_l9_20190919_091717Z_S1R1.mp4 -af silencedetect=noise=-30dB:d=0.5 out.mp4 2> quiet.txt

  // look for quiet slots by ffmpeg
  try {
    console.log('Processing quiet slots')
    const { stdout, stderr } = await exec('ffmpeg -i ffmpeg -i https://webcast.helsinki.fi/static/engage-player/2497e055-e81d-43a2-8689-4fef6dc961cc/9a19ac39-815e-4f0d-abbd-69cf84589b1a/oikkonen_ocast_l9_20190919_091717Z_S1R1.mp4 -af silencedetect=noise=-30dB:d=0.5 -f null - 2> quiet.txt -af silencedetect=noise=-30dB:d=0.5 -f null - 2> quiet.txt');
    // console.log('stdout:', stdout);
    // console.log('stderr:', stderr);
  } catch (e) {
    console.log(e)
  }

  // parse quiet slots into array
  try {
    let arr = []
    console.log('Parsing quiet slots')

    //read ffmpeg silencedetect results
    const raw = await fs.readFile('quiet.txt', 'utf8')

    //split by line chagne and filter rows which contain silencedetect
    let silencedetect = raw
      .split(/\r?\n/)
      .filter(str => str.includes('silencedetect'))

    //map array

    // make array of objects which represent quiet time
    for(let i = 0; i < silencedetect.length; i++) {
      //evens are starts, the uneven are ends and durations
      if (i % 2 == 0) {
        let start = Number(silencedetect[i].split('silence_start: ')[1])

        if (silencedetect.length - 1 !== i) {
          let endArr = silencedetect[i + 1].split('silence_end: ')[1].split(' | ')
          let duration = Number(endArr[1].split('duration: ')[1])
          let end = Number(endArr[0])
          arr.push({start, end, duration})
        } else {
          arr.push({start})
        }
      }
    }

    // save quiet slots into file
    await fs.writeFile('silence.js', 'const silence = ' + JSON.stringify(arr, null, 2), 'utf8')

    console.log("Done")
    //await exec('open index.html')
  } catch (e) {
    console.log(e)
  }


}
main()