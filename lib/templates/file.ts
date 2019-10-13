export const file = `<!DOCTYPE html>
<html lang='en'>
   <head>
      <meta charset='utf-8' />
      <title>Jumpcutter - {{file}}</title>
      <style>

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
   </body>
</html>
`