import { TestBed } from '@angular/core/testing';

import { Crest } from './crest';

describe('Crest', () => {
  it('renders an image when a src is provided', () => {
    const fixture = TestBed.createComponent(Crest);
    fixture.componentRef.setInput('src', 'https://example.com/badge.png');
    fixture.componentRef.setInput('alt', 'Arsenal');
    fixture.detectChanges();

    const img: HTMLImageElement | null = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('alt')).toBe('Arsenal');
  });

  it('renders a placeholder when no src is provided', () => {
    const fixture = TestBed.createComponent(Crest);
    fixture.componentRef.setInput('src', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.crest--placeholder')).toBeTruthy();
  });

  it('falls back to the placeholder when the image errors', () => {
    const fixture = TestBed.createComponent(Crest);
    fixture.componentRef.setInput('src', 'https://example.com/broken.png');
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.crest--placeholder')).toBeTruthy();
  });
});
