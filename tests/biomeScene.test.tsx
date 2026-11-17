import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BiomeScene } from '../src/components/BiomeScene';

describe('C418 biome scene', () => {
  it('renders three calm visual phases and activates animation on demand', () => {
    const { container } = render(<BiomeScene variant="hero" active />);

    expect(container.querySelector('.biome-scene--hero')).toHaveClass('is-alive');
    expect(container.querySelectorAll('.biome-phase')).toHaveLength(3);
    expect(container.querySelector('.biome-meadow')).toBeInTheDocument();
    expect(container.querySelector('.biome-desert')).toBeInTheDocument();
    expect(container.querySelector('.biome-snow')).toBeInTheDocument();
  });
});
