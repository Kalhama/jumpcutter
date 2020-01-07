document.addEventListener("DOMContentLoaded", initialiseMediaPlayer, false);

console.log("dom loaded")

let mediaPlayer;
let skip = true;
function initialiseMediaPlayer() {
  mediaPlayer = document.getElementById('media-video');

  const isSilent = () => silence.find(obj => obj.start < mediaPlayer.currentTime && obj.end > mediaPlayer.currentTime + 0.05) ? true : false
  const nextVoice = () => silence.find(obj => obj.start <= mediaPlayer.currentTime && obj.end >= mediaPlayer.currentTime).end
  const seek = timestamp => mediaPlayer.currentTime = timestamp
  const skipQuiet = () => isSilent() && skip ? seek(nextVoice()) : null
  /*
  const renderProgressBar = () => {
    const arr = []
    const silentAreas = silence.map(obj => {
      return {
        start: start / mediaPlayer.duration,
        end: end / mediaPlayer.duration
      }
    })

    // render silent area blocks
    // TODO
  }
  */

  const updateProgressBar = () => {
    var percentage = mediaPlayer.currentTime / mediaPlayer.duration * 100
    console.log("prossat", percentage)
    $("#progress").width(percentage + '%')
  }

  mediaPlayer.addEventListener('timeupdate', skipQuiet, false);
  // mediaPlayer.addEventListener('timeupdate', updateProgressBar, false);

  setTimeout(() => {
    const silentTotal = silence.map(obj => obj.duration).reduce((a, b) => a + b)
    console.log(`Saving ${Math.round(silentTotal)/60}min. Video is ${Math.round(silentTotal / mediaPlayer.duration * 10000)/100}% silent`)
    console.log(`Leaves us with ${(mediaPlayer.duration - silentTotal)/60}min to watch.`)
    console.log(`With speed of 1,2x it'll take ${(mediaPlayer.duration - silentTotal)/60/1.2}min`)
    console.log(`Which is ${(mediaPlayer.duration - silentTotal)/1.2/mediaPlayer.duration*100}% from original`)
  }, 1000)
}

const changeSpeed = (delta) => {
 mediaPlayer.playbackRate += delta
 mediaPlayer.preservepitch = true
 $('#speed').html(Math.round(mediaPlayer.playbackRate * 100)/100)
}

const setSkip = (checked) => {
  skip = checked
  console.log(skip)
}

