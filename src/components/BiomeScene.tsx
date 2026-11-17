type BiomeSceneVariant = 'backdrop' | 'hero' | 'card' | 'mini';

const BIOMES = ['meadow', 'desert', 'snow'] as const;

function BiomePhase({ biome }: { biome: typeof BIOMES[number] }) {
  return (
    <span className={`biome-phase biome-${biome}`}>
      <i className="biome-sky" />
      <i className="biome-orb" />
      <i className="biome-cloud biome-cloud-one" />
      <i className="biome-cloud biome-cloud-two" />
      <i className="biome-ridge biome-ridge-back" />
      <i className="biome-ridge biome-ridge-front" />
      <i className="biome-ground biome-ground-back" />
      <i className="biome-ground biome-ground-front" />
      <i className="biome-plant biome-plant-one" />
      <i className="biome-plant biome-plant-two" />
    </span>
  );
}

export function BiomeScene({ variant, active = false }: { variant: BiomeSceneVariant; active?: boolean }) {
  return (
    <span
      className={`biome-scene biome-scene--${variant} ${active ? 'is-alive' : ''}`}
      aria-hidden="true"
    >
      {BIOMES.map((biome) => <BiomePhase biome={biome} key={biome} />)}
      <i className="biome-haze" />
    </span>
  );
}
