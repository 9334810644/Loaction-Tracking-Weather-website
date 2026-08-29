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

    // Particle Classes
    interface Star {
      x: number;
      y: number;
      size: number;
      alpha: number;
      speed: number;
    }

    interface Cloud {
      x: number;
      y: number;
      radius: number;
      speed: number;
      opacity: number;
    }

    interface Raindrop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
    }

    interface Snowflake {
      x: number;
      y: number;
      radius: number;
      density: number;
      speed: number;
      angle: number;
    }

    interface Mist {
      x: number;
      y: number;
      radiusX: number;
      radiusY: number;
      speed: number;
      opacity: number;
    }

    // Initialize arrays
    let stars: Star[] = [];
    let clouds: Cloud[] = [];
    let raindrops: Raindrop[] = [];
    let snowflakes: Snowflake[] = [];
    let mists: Mist[] = [];

    // Animation states
    let lightningFlash = 0;
    let lightningTimer = 0;
    let sunPulse = 0;

    // Populate stars for night
    const createStars = () => {
      stars = [];
      const count = Math.floor((width * height) / 8000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.7), // upper 70% of screen
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random(),
          speed: Math.random() * 0.02 + 0.005,
        });
      }
    };

    // Populate clouds for cloudy
    const createClouds = () => {
      clouds = [];
      const count = 5;
      for (let i = 0; i < count; i++) {
        clouds.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.3) + 50,
          radius: Math.random() * 80 + 60,
          speed: Math.random() * 0.3 + 0.1,
          opacity: Math.random() * 0.15 + 0.08,
        });
      }
    };

    // Populate raindrops
    const createRain = () => {
      raindrops = [];
      const count = Math.floor((width * height) / 12000);
      for (let i = 0; i < count; i++) {
        raindrops.push({
          x: Math.random() * width,
          y: Math.random() * height - height,
          length: Math.random() * 20 + 15,
          speed: Math.random() * 12 + 15,
          opacity: Math.random() * 0.4 + 0.2,
        });
      }
    };

    // Populate snow
    const createSnow = () => {
      snowflakes = [];
      const count = Math.floor((width * height) / 10000);
      for (let i = 0; i < count; i++) {
        snowflakes.push({
          x: Math.random() * width,
          y: Math.random() * height - height,
          radius: Math.random() * 3 + 1,
          density: Math.random() * 10,
          speed: Math.random() * 1.5 + 0.5,
          angle: Math.random() * 2 * Math.PI,
        });
      }
    };

    // Populate mist for fog
    const createMist = () => {
      mists = [];
      const count = 15;
      for (let i = 0; i < count; i++) {
        mists.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radiusX: Math.random() * 150 + 100,
          radiusY: Math.random() * 50 + 30,
          speed: Math.random() * 0.4 + 0.1,
          opacity: Math.random() * 0.08 + 0.03,
        });
      }
    };

    // Initialize based on current type
    const init = () => {
      createStars();
      createClouds();
      createRain();
      createSnow();
      createMist();
    };

    init();

    // Resize Handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    };

    window.addEventListener('resize', handleResize);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Base solid gradient matches background time/mood
      let gradient = ctx.createLinearGradient(0, 0, 0, height);
      if (type === 'sunny') {
        gradient.addColorStop(0, '#0284c7'); // sky-600
        gradient.addColorStop(0.5, '#38bdf8'); // sky-400
        gradient.addColorStop(1, '#f0f9ff'); // sky-50
      } else if (type === 'cloudy') {
        gradient.addColorStop(0, '#334155'); // slate-700
        gradient.addColorStop(0.6, '#475569'); // slate-600
        gradient.addColorStop(1, '#cbd5e1'); // slate-300
      } else if (type === 'rainy' || type === 'thunderstorm') {
        gradient.addColorStop(0, '#1e293b'); // slate-800
        gradient.addColorStop(0.6, '#0f172a'); // slate-900
        gradient.addColorStop(1, '#1e293b'); // slate-800
      } else if (type === 'snowy') {
        gradient.addColorStop(0, '#1e1b4b'); // indigo-950
        gradient.addColorStop(0.6, '#312e81'); // indigo-900
        gradient.addColorStop(1, '#c7d2fe'); // indigo-200
      } else if (type === 'night') {
        gradient.addColorStop(0, '#030712'); // gray-950
        gradient.addColorStop(0.7, '#0b0f19'); // deep blueish
        gradient.addColorStop(1, '#111827'); // gray-900
      } else if (type === 'fog') {
        gradient.addColorStop(0, '#57534e'); // stone-600
        gradient.addColorStop(0.5, '#78716c'); // stone-500
        gradient.addColorStop(1, '#d6d3d1'); // stone-300
      } else {
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render Sunny Beams & Sun
      if (type === 'sunny') {
        sunPulse += 0.005;
        const radius = 120 + Math.sin(sunPulse) * 10;
        
        // Glow effect
        const sunGlow = ctx.createRadialGradient(width - 150, 150, 20, width - 150, 150, radius * 3);
        sunGlow.addColorStop(0, 'rgba(253, 224, 71, 0.6)'); // amber/yellow
        sunGlow.addColorStop(0.3, 'rgba(253, 224, 71, 0.2)');
        sunGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(width - 150, 150, radius * 3, 0, 2 * Math.PI);
        ctx.fill();

        // Sun disc
        ctx.fillStyle = '#fef08a'; // yellow-200
        ctx.beginPath();
        ctx.arc(width - 150, 150, radius * 0.6, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Render Night Starfield & Moon
      if (type === 'night') {
        // Star Twinkles
        stars.forEach(star => {
          star.alpha += star.speed;
          if (star.alpha > 1 || star.alpha < 0.1) {
            star.speed = -star.speed;
          }
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Glowing Moon
        const moonX = width - 150;
        const moonY = 150;
        const moonRadius = 45;

        // Moon Glow
        const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.8, moonX, moonY, moonRadius * 3);
        moonGlow.addColorStop(0, 'rgba(186, 230, 253, 0.25)'); // sky-200
        moonGlow.addColorStop(1, 'rgba(186, 230, 253, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius * 3, 0, 2 * Math.PI);
        ctx.fill();

        // Moon Body
        ctx.fillStyle = '#e0f2fe'; // sky-100
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Shadow overlap to create perfect crescent
        ctx.fillStyle = '#030712'; // match background starfield
        ctx.beginPath();
        ctx.arc(moonX - 15, moonY - 5, moonRadius * 1.05, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Render Clouds
      if (type === 'cloudy' || type === 'sunny') {
        clouds.forEach(cloud => {
          cloud.x += cloud.speed;
          if (cloud.x - cloud.radius > width) {
            cloud.x = -cloud.radius;
            cloud.y = Math.random() * (height * 0.3) + 50;
          }

          const cloudGrad = ctx.createRadialGradient(cloud.x, cloud.y, cloud.radius * 0.2, cloud.x, cloud.y, cloud.radius);
          if (type === 'sunny') {
            cloudGrad.addColorStop(0, `rgba(255, 255, 255, ${cloud.opacity * 1.8})`);
            cloudGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          } else {
            cloudGrad.addColorStop(0, `rgba(226, 232, 240, ${cloud.opacity})`); // slate-200
            cloudGrad.addColorStop(1, 'rgba(148, 163, 184, 0)'); // slate-400
          }
          ctx.fillStyle = cloudGrad;

          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.radius, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // Render Rain
      if (type === 'rainy' || type === 'thunderstorm') {
        raindrops.forEach(drop => {
          drop.y += drop.speed;
          // Apply horizontal drift
          drop.x -= 2;

          if (drop.y > height) {
            drop.y = -drop.length;
            drop.x = Math.random() * width;
          }

          ctx.strokeStyle = `rgba(186, 230, 253, ${drop.opacity})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 4, drop.y + drop.length);
          ctx.stroke();
        });
      }

      // Render Lightning for Thunderstorm
      if (type === 'thunderstorm') {
        lightningTimer++;
        if (lightningFlash > 0) {
          lightningFlash -= 0.05;
          ctx.fillStyle = `rgba(224, 242, 254, ${lightningFlash})`;
          ctx.fillRect(0, 0, width, height);

          // Draw random lightning bolt
          if (lightningFlash > 0.6) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            let curX = Math.random() * width;
            let curY = 0;
            ctx.moveTo(curX, curY);

            while (curY < height) {
              curX += (Math.random() - 0.5) * 60;
              curY += Math.random() * 100 + 40;
              ctx.lineTo(curX, curY);
            }
            ctx.stroke();
          }
        }

        // Random trigger lightning
        if (lightningTimer > 180 && Math.random() < 0.015) {
          lightningFlash = Math.random() * 0.4 + 0.5;
          lightningTimer = 0;
        }
      }

      // Render Snow
      if (type === 'snowy') {
        snowflakes.forEach(flake => {
          flake.y += flake.speed;
          flake.angle += 0.01;
          flake.x += Math.sin(flake.angle) * 0.5;

          if (flake.y > height) {
            flake.y = -flake.radius;
            flake.x = Math.random() * width;
          }

          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.radius, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // Render Mist / Fog
      if (type === 'fog') {
        mists.forEach(mist => {
          mist.x += mist.speed;
          if (mist.x - mist.radiusX > width) {
            mist.x = -mist.radiusX;
          }

          // draw ellipse mist puff
          ctx.save();
          const mistGrad = ctx.createRadialGradient(mist.x, mist.y, 20, mist.x, mist.y, mist.radiusX);
          mistGrad.addColorStop(0, `rgba(245, 245, 244, ${mist.opacity})`);
          mistGrad.addColorStop(1, 'rgba(245, 245, 244, 0)');
          ctx.fillStyle = mistGrad;

          ctx.beginPath();
          ctx.translate(mist.x, mist.y);
          ctx.scale(mist.radiusX / mist.radiusY, 1);
          ctx.arc(0, 0, mist.radiusY, 0, 2 * Math.PI);
          ctx.restore();
          ctx.fill();
        });
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
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 transition-colors duration-1000"
    />
  );
}
