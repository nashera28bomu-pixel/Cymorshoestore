export const COUNTIES = [
  { id: 1,  name: 'Nairobi',        fee: 200  },
  { id: 2,  name: 'Mombasa',        fee: 500  },
  { id: 3,  name: 'Kisumu',         fee: 500  },
  { id: 4,  name: 'Nakuru',         fee: 400  },
  { id: 5,  name: 'Eldoret',        fee: 450  },
  { id: 6,  name: 'Thika',          fee: 250  },
  { id: 7,  name: 'Machakos',       fee: 350  },
  { id: 8,  name: 'Nyeri',          fee: 400  },
  { id: 9,  name: 'Meru',           fee: 450  },
  { id: 10, name: 'Kisii',          fee: 500  },
  { id: 11, name: 'Kakamega',       fee: 500  },
  { id: 12, name: 'Garissa',        fee: 700  },
  { id: 13, name: 'Kitale',         fee: 500  },
  { id: 14, name: 'Malindi',        fee: 600  },
  { id: 15, name: 'Lamu',           fee: 800  },
  { id: 16, name: 'Mandera',        fee: 900  },
  { id: 17, name: 'Wajir',          fee: 850  },
  { id: 18, name: 'Marsabit',       fee: 800  },
  { id: 19, name: 'Isiolo',         fee: 600  },
  { id: 20, name: 'Embu',           fee: 400  },
  { id: 21, name: 'Kirinyaga',      fee: 350  },
  { id: 22, name: 'Murang\'a',      fee: 350  },
  { id: 23, name: 'Kiambu',         fee: 250  },
  { id: 24, name: 'Kajiado',        fee: 350  },
  { id: 25, name: 'Narok',          fee: 500  },
  { id: 26, name: 'Bomet',          fee: 550  },
  { id: 27, name: 'Kericho',        fee: 500  },
  { id: 28, name: 'Nandi',          fee: 500  },
  { id: 29, name: 'Uasin Gishu',    fee: 450  },
  { id: 30, name: 'Trans Nzoia',    fee: 500  },
  { id: 31, name: 'West Pokot',     fee: 700  },
  { id: 32, name: 'Turkana',        fee: 900  },
  { id: 33, name: 'Samburu',        fee: 700  },
  { id: 34, name: 'Laikipia',       fee: 500  },
  { id: 35, name: 'Nyandarua',      fee: 400  },
  { id: 36, name: 'Vihiga',         fee: 500  },
  { id: 37, name: 'Siaya',          fee: 550  },
  { id: 38, name: 'Homa Bay',       fee: 600  },
  { id: 39, name: 'Migori',         fee: 600  },
  { id: 40, name: 'Nyamira',        fee: 550  },
  { id: 41, name: 'Bungoma',        fee: 500  },
  { id: 42, name: 'Busia',          fee: 550  },
  { id: 43, name: 'Tana River',     fee: 750  },
  { id: 44, name: 'Kilifi',         fee: 550  },
  { id: 45, name: 'Kwale',          fee: 550  },
  { id: 46, name: 'Taita Taveta',   fee: 600  },
  { id: 47, name: 'Makueni',        fee: 400  }
];

export const CATEGORIES = {
  mens:    { label: '👨 Men\'s Shoes',       emoji: '👨' },
  womens:  { label: '👩 Women\'s Shoes',     emoji: '👩' },
  kids:    { label: '🧒 Kids\' Shoes',       emoji: '🧒' },
  sports:  { label: '⚽ Sports & Sneakers',  emoji: '⚽' },
  formal:  { label: '👔 Formal Shoes',       emoji: '👔' }
};

export function getCountyById(id) {
  return COUNTIES.find(c => c.id === parseInt(id));
}

export function getCountyByName(name) {
  return COUNTIES.find(c => c.name.toLowerCase() === name.toLowerCase());
}
