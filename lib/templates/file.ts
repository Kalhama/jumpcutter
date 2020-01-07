export const file = `<!DOCTYPE html>
<html lang='en'>
   <head>
      <meta charset='utf-8' />
      <title>Jumpcutter - {{file}}</title>
      <style>
         video {
            height: 700px;
         }
      </style>
      <script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
      <script type="text/javascript" src="/media/{{file}}.js"></script>
      <script type="text/javascript" src="/static/player.js"></script>
   </head>
   <body>
      <div id='media-player'>
         <video id='media-video' controls>
            <source src='/media/{{file}}' type='video/mp4'>
         </video>
         <div id='media-controls'></div>
         <div id="progress_container" style="height: 10px">

          </div>
      </div>
      <div id="speed-adjustment">
         <button onClick="changeSpeed(-0.1)">-0,1</button>
         <span id="speed"> 1 </span>
         <button onClick="changeSpeed(0.1)">+0,1</button>
      </div>
      <div id="skip-adjustment">
         <input onchange="(this) => setSkip(this.checked);" type="checkbox" value="skip" checked><span>Skipping on/off</span>
      </div>
   </body>
</html>
`