# Jumpcutter #
Package finds quiet spots of video and removes them. Useful for video editing, lectures eg...

## Credits ##
Inspired by [Github - carykh/jumpcutter](https://github.com/carykh/jumpcutter). [carykh Youtube - Automatic on-the-fly video editing tool!](https://www.youtube.com/watch?v=DQ8orIurGxw)

## Install ##
1. Clone source code `git clone ...`
2. Move to code directory `cd jumpcutter`
3. install yarn if you did not have already
4. Install dependencies `yarn install` 

## Usage ##
After installation run `yarn start -i input.mp4 -o output.mp4`

Tip: you can access other functionality by running `yarn start help`

Tip: package installs ffmpeg and ffprobe into project files and uses them, but if you wanted to use specific version of ffmpeg/ffprobe you can do that by `FFMPEG=/path/to/your/ffmpeg FFPROBE=/path/to/your/ffprobe yarn start -i input.mp4 -o output.mp4`

## Licence ##
GNU 3