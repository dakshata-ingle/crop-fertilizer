const cropImageMap = {
  rice: '/images/rice.webp',
  wheat: '/images/wheat.webp',
  cotton: '/images/cotton.jpg',
  sugarcane: '/images/sugarcane.webp',
  maize: '/images/maize.webp',
  potato: '/images/potato.webp',
  tomato: '/images/tomato.jpeg',
  onion: '/images/oninon.webp',
  barley: '/images/barley.webp',
  soybean: '/images/soyabean.webp',
  groundnut: '/images/groundnut.webp',
  sunflower: '/images/sunflower.webp',
  chickpea: '/images/chickpea.webp',
  mustard: '/images/mustrud.webp',
  peas: '/images/peas.webp',
  lentil: '/images/lentil.webp',
  blackgram: '/images/blackgram.webp',
  greengram: '/images/greengram.webp',
  kidneybean: '/images/kidneybean.webp',
  pigeonpea: '/images/pegionpea.webp',
  banana: '/images/banana.webp',
  mango: '/images/Mango.webp',
  coconut: '/images/coconut.webp',
  papaya: '/images/papaya.webp',
  apple: '/images/apple.webp',
  grapes: '/images/grapes.webp',
};

const normalizeImagePath = (imagePath) => {
  if (!imagePath) return null;

  const trimmed = String(imagePath).trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed}`;
};

export const resolveCropImagePath = (crop) => {
  if (!crop) return '/images/placeholder.svg';

  const explicitImage = normalizeImagePath(crop.image);
  if (explicitImage) {
    return explicitImage;
  }

  const id = (crop.id || crop.cropId || crop.name || '').toString().trim().toLowerCase();
  if (id && cropImageMap[id]) {
    return cropImageMap[id];
  }

  return '/images/placeholder.svg';
};
