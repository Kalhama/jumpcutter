document.addEventListener("DOMContentLoaded", initialiseMediaPlayer, false);

console.log("dom loaded")

var mediaPlayer;
function initialiseMediaPlayer() {
  mediaPlayer = document.getElementById('media-video');

  const isSilent = () => silence.find(obj => obj.start < mediaPlayer.currentTime && obj.end > mediaPlayer.currentTime + 0.05) ? true : false
  const nextVoice = () => silence.find(obj => obj.start <= mediaPlayer.currentTime && obj.end >= mediaPlayer.currentTime).end
  const seek = timestamp => mediaPlayer.currentTime = timestamp
  const skipQuiet = () => isSilent() ? seek(nextVoice()) : null
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
  }, 1000)
}