// Offline camera: animate at 60 fps independently from the UI screenshot cadence.
// Timings and targets come from the recorded controls, never guessed coordinates.
import sharp from "sharp";

function track(initial, events, key, clock) {
  let previous = initial;
  const terms = [String(initial)];
  for (const event of events) {
    const value = event[key];
    const delta = value - previous;
    previous = value;
    if (Math.abs(delta) < 0.000001) continue;
    const progress = `clip((${clock}-${event.time.toFixed(5)})/${event.duration},0,1)`;
    // Quintic easing has zero speed and acceleration at both ends.
    terms.push(
      `(${delta})*(${progress})^3*(10-15*(${progress})+6*(${progress})^2)`,
    );
  }
  return `(${terms.join("+")})`;
}

export async function cursorCamera({ timeline, initial, width, height, dir }) {
  const pointer = dir + "/pointer.png";
  const size = width > height ? 58 : 40;
  await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.25}" viewBox="0 0 24 30"><path d="M2 2V24L8 18L13 28L18 25L13 16H23Z" fill="#293331" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`,
    ),
  )
    .png()
    .toFile(pointer);
  const axes = (clock) => {
    const zoom = track(initial.zoom, timeline, "zoom", clock);
    const cx = track(initial.cx, timeline, "cx", clock);
    const cy = track(initial.cy, timeline, "cy", clock);
    return {
      zoom,
      x: `clip(${cx}-0.5/${zoom},0,1-1/${zoom})`,
      y: `clip(${cy}-0.5/${zoom},0,1-1/${zoom})`,
    };
  };
  const camera = axes("on/60");
  const cursor = axes("t");
  const px = track(initial.px, timeline, "px", "t");
  const py = track(initial.py, timeline, "py", "t");
  return {
    pointer,
    filter: `[0:v]fps=60,zoompan=z='${camera.zoom}':x='iw*${camera.x}':y='ih*${camera.y}':d=1:s=${width}x${height}:fps=60[view];[view][1:v]overlay=x='(${px}-${cursor.x})*${cursor.zoom}*${width}-4':y='(${py}-${cursor.y})*${cursor.zoom}*${height}-4':eval=frame:shortest=1,format=yuv420p[out]`,
  };
}
