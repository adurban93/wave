/**
 * Renders expanding circles based on bass amplitude.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Uint8Array} frequencyData
 * @param {number} width
 * @param {number} height
 */
export function circlesVisualization(ctx, frequencyData, width, height) {
    ctx.clearRect(0, 0, width, height);
  
    // Calculate the average amplitude for "bass" range
    const bassRangeEnd = 50; // somewhat arbitrary cutoff for low frequencies
    let total = 0;
    for (let i = 0; i < bassRangeEnd; i++) {
      total += frequencyData[i];
    }
    const avgBass = total / bassRangeEnd;
  
    // Translate avgBass into a circle radius
    const radius = (avgBass / 255) * (height / 2);
  
    // Draw the circle
    ctx.fillStyle = '#24c0ff';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.fill();
}
  
/**
 * Renders a waveform using time-domain data.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Uint8Array} timeDomainData
 * @param {number} width
 * @param {number} height
 */
export function waveformVisualization(ctx, timeDomainData, width, height) {
    ctx.clearRect(0, 0, width, height);
  
    ctx.strokeStyle = '#24c0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
  
    const sliceWidth = width / timeDomainData.length;
    let x = 0;
  
    for (let i = 0; i < timeDomainData.length; i++) {
      const v = timeDomainData[i] / 128.0;
      const y = (v * height) / 2;
  
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
  
      x += sliceWidth;
    }
  
    ctx.lineTo(width, height / 2);
    ctx.stroke();
}
  
/**
 * Renders bars based on frequency data.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Uint8Array} frequencyData
 * @param {number} width
 * @param {number} height
 */
export function barsVisualization(ctx, frequencyData, width, height) {
    ctx.clearRect(0, 0, width, height);
  
    const barCount = 64; // number of bars to show
    const barWidth = width / barCount;
  
    for (let i = 0; i < barCount; i++) {
      const barHeight = (frequencyData[i] / 255) * height;
      ctx.fillStyle = 'rgb(' + (frequencyData[i] + 100) + ', 50, 150)';
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
    }
}
  