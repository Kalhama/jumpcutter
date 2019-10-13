export const index = `<!DOCTYPE html>
<html lang='en'>
   <head>
      <meta charset='utf-8' />
      <title>Jumpcutter - index</title>
   </head>
   <body>
    <ul>
        {{#files}}
        <li><a href=file/{{.}}>{{.}}</a></li>
        {{/files}}
    </ul>
   </body>
</html>
`