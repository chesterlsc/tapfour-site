#!/bin/bash
# Wait until each given MP4 is complete (readable moov atom), then print its duration.
FF=/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
for f in "$@"; do
  until [ -f "$f" ] && "$FF" -hide_banner -i "$f" 2>&1 | grep -q "Duration"; do sleep 5; done
  echo "$f $("$FF" -hide_banner -i "$f" 2>&1 | grep -o 'Duration: [0-9:.]*')"
done
