import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';

interface Star {
  x: number;
  y: number;
  depth: number;
  radius: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const STAR_DENSITY = 6500;
const MAX_STARS = 220;
const MAX_PARALLAX = 20;
const POINTER_EASE = 0.045;
const COMET_MIN_GAP = 6500;
const COMET_MAX_EXTRA = 7000;

@Component({
  selector: 'app-cosmic-background',
  templateUrl: './cosmic-background.html',
  styleUrl: './cosmic-background.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CosmicBackground {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly destroyRef = inject(DestroyRef);

  private ctx: CanvasRenderingContext2D | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;

  private stars: Star[] = [];
  private comets: Comet[] = [];

  private targetX = 0;
  private targetY = 0;
  private pointerX = 0;
  private pointerY = 0;

  private rafId = 0;
  private running = false;
  private lastCometAt = 0;
  private reducedMotion = false;
  private finePointer = true;

  constructor() {
    afterNextRender(() => this.init());
    this.destroyRef.onDestroy(() => this.teardown());
  }

  private init(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    this.ctx = ctx;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.finePointer = window.matchMedia('(pointer: fine)').matches;

    this.resize();
    this.seedStars();

    window.addEventListener('resize', this.onResize, { passive: true });
    if (this.finePointer) {
      window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    }
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    if (this.reducedMotion) {
      this.renderStatic();
    } else {
      this.start();
    }
  }

  private readonly onResize = (): void => {
    this.resize();
    this.seedStars();
    if (this.reducedMotion) {
      this.renderStatic();
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    this.targetX = (event.clientX / this.width) * 2 - 1;
    this.targetY = (event.clientY / this.height) * 2 - 1;
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) {
      this.stop();
    } else if (!this.reducedMotion) {
      this.start();
    }
  };

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = Math.floor(this.width * this.dpr);
    canvas.height = Math.floor(this.height * this.dpr);
    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private seedStars(): void {
    const count = Math.min(Math.floor((this.width * this.height) / STAR_DENSITY), MAX_STARS);
    this.stars = Array.from({ length: count }, () => {
      const depth = Math.random();
      return {
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        depth,
        radius: 0.4 + depth * 1.5,
        baseAlpha: 0.25 + depth * 0.7,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + depth * 0.03,
      };
    });
  }

  private start(): void {
    if (this.running || !this.ctx) {
      return;
    }
    this.running = true;
    this.lastCometAt = performance.now();
    const loop = (time: number): void => {
      if (!this.running) {
        return;
      }
      this.frame(time);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private frame(time: number): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }

    this.pointerX += (this.targetX - this.pointerX) * POINTER_EASE;
    this.pointerY += (this.targetY - this.pointerY) * POINTER_EASE;

    ctx.clearRect(0, 0, this.width, this.height);

    for (const star of this.stars) {
      star.twinklePhase += star.twinkleSpeed;
      const parallax = MAX_PARALLAX * star.depth;
      const drift = this.finePointer ? 0 : Math.sin(time / 9000 + star.depth * 6) * 4 * star.depth;
      const x = star.x - this.pointerX * parallax + drift;
      const y = star.y - this.pointerY * parallax;
      const alpha = star.baseAlpha * (0.65 + 0.35 * Math.sin(star.twinklePhase));
      ctx.beginPath();
      ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    if (
      time - this.lastCometAt > COMET_MIN_GAP + Math.random() * COMET_MAX_EXTRA &&
      this.comets.length < 2
    ) {
      this.spawnComet();
      this.lastCometAt = time;
    }
    this.drawComets();
  }

  private spawnComet(): void {
    const fromLeft = Math.random() < 0.5;
    const speed = 6 + Math.random() * 4;
    this.comets.push({
      x: fromLeft ? -60 : this.width + 60,
      y: Math.random() * this.height * 0.5,
      vx: (fromLeft ? 1 : -1) * speed,
      vy: speed * 0.45,
      life: 0,
      maxLife: 130,
    });
  }

  private drawComets(): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    this.comets = this.comets.filter((comet) => comet.life < comet.maxLife);
    for (const comet of this.comets) {
      comet.x += comet.vx;
      comet.y += comet.vy;
      comet.life += 1;
      const fade = 1 - comet.life / comet.maxLife;
      const tailX = comet.x - comet.vx * 7;
      const tailY = comet.y - comet.vy * 7;
      const gradient = ctx.createLinearGradient(comet.x, comet.y, tailX, tailY);
      gradient.addColorStop(0, `rgba(182, 242, 58, ${0.9 * fade})`);
      gradient.addColorStop(1, 'rgba(182, 242, 58, 0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(comet.x, comet.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${fade})`;
      ctx.fill();
    }
  }

  private renderStatic(): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, this.width, this.height);
    for (const star of this.stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.baseAlpha})`;
      ctx.fill();
    }
  }

  private teardown(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
