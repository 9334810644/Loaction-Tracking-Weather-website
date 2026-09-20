import { useEffect, useRef } from 'react';

interface BackgroundAnimationProps {
  type: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'thunderstorm' | 'night' | 'fog';
}

export function BackgroundAnimation({ type }: BackgroundAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    // Particle state
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      alpha: number;
      targetAlpha: number;
      phase?: number;
    }> = [];

    const initParticles = () => {
      particles = [];
      const particleCount = type === 'rainy' ? 50 : type === 'snowy' ? 40 : type === 'night' ? 60 : 20;

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: type === 'rainy' ? Math.random() * 18 + 10 : type === 'snowy' ? Math.random() * 2.5 + 1 : Math.random() * 1.5 + 0.5,
          speedX: type === 'rainy' ? -1.2 : type === 'snowy' ? Math.sin(i) * 0.4 : (Math.random() - 0.5) * 0.2,
          speedY: type === 'rainy' ? Math.random() * 7 + 7 : type === 'snowy' ? Math.random() * 0.9 + 0.6 : (Math.random() - 0.5) * 0.2,
          alpha: Math.random() * 0.5 + 0.2,
          targetAlpha: Math.random() * 0.7 + 0.2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    initParticles();

    let ambientTime = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ambientTime += 0.01;

      if (type === 'sunny') {
        const sunX = width * 0.85;
        const sunY = height * 0.15;
        const pulse = Math.sin(ambientTime * 0.8) * 15;
        const grad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 280 + pulse);
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.1)');
        grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.04)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 300, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'thunderstorm') {
        const pulse = Math.sin(ambientTime * 0.5) * 0.02 + 0.05;
        const grad = ctx.createRadialGradient(width * 0.5, height * 0.2, 50, width * 0.5, height * 0.2, width * 0.6);
        grad.addColorStop(0, `rgba(168, 85, 247, ${pulse})`);
        grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else if (type === 'night') {
        const grad = ctx.createRadialGradient(width * 0.2, height * 0.2, 10, width * 0.2, height * 0.2, 400);
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.07)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      for (const p of particles) {
        if (type === 'rainy') {
          ctx.strokeStyle = `rgba(147, 197, 253, ${p.alpha * 0.3})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.size);
          ctx.stroke();

          p.x += p.speedX;
          p.y += p.speedY;

          if (p.y > height) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        } else if (type === 'snowy') {
          p.phase = (p.phase || 0) + 0.02;
          const wobble = Math.sin(p.phase) * 0.8;

          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.55})`;
          ctx.beginPath();
          ctx.arc(p.x + wobble, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speedY;
          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        } else if (type === 'night') {
          p.alpha += (p.targetAlpha - p.alpha) * 0.02;
          if (Math.abs(p.targetAlpha - p.alpha) < 0.05) {
            p.targetAlpha = Math.random() * 0.7 + 0.15;
          }

          ctx.fillStyle = `rgba(226, 232, 240, ${p.alpha * 0.45})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 'fog' || type === 'cloudy') {
          p.x += p.speedX;
          p.y += p.speedY;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 25);
          grad.addColorStop(0, `rgba(203, 213, 225, ${p.alpha * 0.025})`);
          grad.addColorStop(1, 'rgba(203, 213, 225, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 25, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [type]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-opacity duration-1000">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90" />
      <div
        className={`absolute inset-0 transition-all duration-1000 ${
          type === 'sunny'
            ? 'bg-gradient-to-b from-amber-500/5 via-sky-500/5 to-transparent'
            : type === 'rainy'
              ? 'bg-gradient-to-b from-blue-950/20 via-sky-900/10 to-transparent'
              : type === 'thunderstorm'
                ? 'bg-gradient-to-b from-purple-950/25 via-slate-900/20 to-transparent'
                : type === 'snowy'
                  ? 'bg-gradient-to-b from-sky-950/20 via-slate-900/10 to-transparent'
                  : type === 'night'
                    ? 'bg-gradient-to-b from-indigo-950/25 via-slate-950/20 to-transparent'
                    : 'bg-gradient-to-b from-slate-900/10 to-transparent'
        }`}
      />
    </div>
  );
}
