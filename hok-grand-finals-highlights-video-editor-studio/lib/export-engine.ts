import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { StudioState, TEMPLATES } from './constants';
import { renderCanvas } from './canvas-renderer';

export function createRenderCanvas(state: StudioState, scale = 1, p = 1): HTMLCanvasElement {
  const tpl = TEMPLATES[state.tpl];
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(tpl.w * scale));
  c.height = Math.max(2, Math.round(tpl.h * scale));
  const ctx = c.getContext('2d');
  if (ctx) {
    renderCanvas(ctx, c.width, c.height, state, p);
  }
  return c;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 6000);
}

export async function exportPNG(state: StudioState, p = 1, is4K = false): Promise<string> {
  const scale = is4K ? 2 : 1;
  const c = createRenderCanvas(state, scale, p);
  return new Promise((resolve, reject) => {
    c.toBlob(blob => {
      if (!blob) return reject(new Error('Failed to generate PNG blob'));
      const fn = `hok-${state.tpl}-${state.s.bgMode}-${c.width}x${c.height}.png`;
      downloadBlob(blob, fn);
      resolve(fn);
    }, 'image/png');
  });
}

export async function copyFrameToClipboard(state: StudioState, p = 1): Promise<void> {
  const c = createRenderCanvas(state, 1, p);
  return new Promise((resolve, reject) => {
    c.toBlob(async blob => {
      if (!blob) return reject(new Error('Failed to generate PNG'));
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        resolve();
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

export async function exportGIF(
  state: StudioState,
  onProgress?: (pct: number, message: string) => void
): Promise<string> {
  const tpl = TEMPLATES[state.tpl];
  let outW = Math.min(state.anim.outW || 960, tpl.w);
  if (outW % 2 !== 0) outW += 1;
  let outH = Math.round(outW * (tpl.h / tpl.w));
  if (outH % 2 !== 0) outH += 1;
  const fps = state.anim.fps || 20;
  const dur = state.anim.dur || 3;
  const totalFrames = Math.max(2, Math.round(dur * fps));
  const delay = Math.round(1000 / fps);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D context not available');

  const gif = GIFEncoder();

  onProgress?.(0.05, `Rendering ${totalFrames} frames...`);

  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames;
    renderCanvas(ctx, outW, outH, state, progress);

    const imgData = ctx.getImageData(0, 0, outW, outH);
    const { data } = imgData;

    // Palette quantization using gifenc
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);

    gif.writeFrame(index, outW, outH, {
      palette,
      delay,
      repeat: 0,
    });

    const pct = 0.05 + (i / totalFrames) * 0.85;
    onProgress?.(pct, `Encoding frame ${i + 1} / ${totalFrames}...`);
    // Yield to event loop to keep UI smooth
    await new Promise(r => setTimeout(r, 0));
  }

  onProgress?.(0.95, 'Writing GIF file...');
  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes as any], { type: 'image/gif' });
  const fn = `hok-${state.tpl}-${state.s.bgMode}-${outW}x${outH}-${fps}fps.gif`;
  downloadBlob(blob, fn);
  onProgress?.(1, 'Complete!');
  return fn;
}

export async function exportWebM(
  state: StudioState,
  onProgress?: (pct: number, message: string) => void
): Promise<string> {
  const tpl = TEMPLATES[state.tpl];
  let outW = Math.min(state.anim.outW || 1920, tpl.w);
  if (outW % 2 !== 0) outW += 1;
  let outH = Math.round(outW * (tpl.h / tpl.w));
  if (outH % 2 !== 0) outH += 1;
  const fps = state.anim.fps || 30;
  const dur = state.anim.dur || 3;
  const totalFrames = Math.max(2, Math.round(dur * fps));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  const captureStreamFn = canvas.captureStream || (canvas as any).mozCaptureStream;
  if (!captureStreamFn || typeof MediaRecorder === 'undefined') {
    throw new Error('WebM video recording is not supported in this browser');
  }

  const mime = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ].find(m => MediaRecorder.isTypeSupported(m));

  if (!mime) {
    throw new Error('WebM codec is not supported in this browser');
  }

  // Use canvas.captureStream(fps) for universal browser support
  const stream = captureStreamFn.call(canvas, fps);
  const track = stream.getVideoTracks()[0] as any;
  const rec = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: Blob[] = [];
  rec.ondataavailable = e => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const donePromise = new Promise<void>(res => {
    rec.onstop = () => res();
  });

  rec.start();
  onProgress?.(0.05, `Recording WebM ${outW}x${outH} @ ${fps}fps...`);

  const stepMs = 1000 / fps;
  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames;
    renderCanvas(ctx, outW, outH, state, progress);
    if (track && typeof track.requestFrame === 'function') {
      try {
        track.requestFrame();
      } catch (_) {}
    }
    const pct = 0.05 + (i / totalFrames) * 0.9;
    onProgress?.(pct, `Capturing frame ${i + 1} / ${totalFrames}...`);
    await new Promise(r => setTimeout(r, stepMs));
  }

  try {
    rec.stop();
  } catch (_) {}
  await donePromise;

  try {
    track?.stop();
  } catch (_) {}

  const finalBlob = new Blob(chunks, { type: 'video/webm' });
  const fn = `hok-${state.tpl}-${state.s.bgMode}-${outW}x${outH}-${fps}fps.webm`;
  downloadBlob(finalBlob, fn);
  onProgress?.(1, 'Video ready!');
  return fn;
}
