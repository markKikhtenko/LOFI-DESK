import { useEffect, useRef } from 'react';
import { getAudioAnalyser } from '../hooks/useAudioEngine';

const BAR_COUNT = 12;

export function AudioSpectrum() {
  const barsRef = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    let frame = 0;
    let frequencyData: Uint8Array<ArrayBuffer> | null = null;

    const draw = () => {
      const analyser = getAudioAnalyser();
      if (!analyser) {
        frame = window.requestAnimationFrame(draw);
        return;
      }
      frequencyData ??= new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData);
      const usefulBins = Math.min(frequencyData.length, 42);

      barsRef.current.forEach((bar, index) => {
        if (!bar) return;
        const start = Math.floor(((index / BAR_COUNT) ** 1.55) * usefulBins);
        const end = Math.max(start + 1, Math.floor((((index + 1) / BAR_COUNT) ** 1.55) * usefulBins));
        let sum = 0;
        for (let bin = start; bin < end; bin += 1) sum += frequencyData![bin] ?? 0;
        const average = sum / (end - start);
        const level = Math.max(0.08, Math.min(1, (average / 255) ** 0.72));
        bar.style.transform = `scaleY(${level})`;
        bar.style.opacity = `${0.38 + level * 0.62}`;
      });
      frame = window.requestAnimationFrame(draw);
    };

    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="audio-spectrum" role="img" aria-label="Спектр текущего аудиосигнала">
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <span key={index} ref={(element) => { barsRef.current[index] = element; }} />
      ))}
    </div>
  );
}
