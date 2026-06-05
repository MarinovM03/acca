import { TestBed } from '@angular/core/testing';

import { CosmicBackground } from './cosmic-background';

describe('CosmicBackground', () => {
  it('renders a decorative canvas layer', () => {
    const fixture = TestBed.createComponent(CosmicBackground);
    fixture.detectChanges();

    const canvas: HTMLCanvasElement | null = fixture.nativeElement.querySelector('canvas.cosmic');
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
  });
});
