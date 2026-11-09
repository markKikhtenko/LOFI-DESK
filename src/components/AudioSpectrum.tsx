import { useEffect, useRef } from 'react';
import { getAudioAnalyser } from '../hooks/useAudioEngine';
import { normalizedSpectrumLevel } from '../utils/spectrum';

const BAR_COUNT = 12;

export function AudioSpectrum() {
  const barsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const levelsRef = useRef(Array.from({ length: BAR_COUNT }, () => 0.08));

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

      const averages = barsRef.current.map((_, index) => {
        const start = Math.floor(((index / BAR_COUNT) ** 1.55) * usefulBins);
        const end = Math.max(start + 1, Math.floor((((index + 1) / BAR_COUNT) ** 1.55) * usefulBins));
        let sum = 0;
        for (let bin = start; bin < end; bin += 1) sum += frequencyData![bin] ?? 0;
        return sum / (end - start);
      });
      const framePeak = Math.max(...averages, 0);

      barsRef.current.forEach((bar, index) => {
        if (!bar) return;
        const target = normalizedSpectrumLevel(averages[index] ?? 0, framePeak);
        const previous = levelsRef.current[index] ?? 0.08;
        const smoothing = target > previous ? 0.42 : 0.16;
        const level = previous + (target - previous) * smoothing;
        levelsRef.current[index] = level;
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
