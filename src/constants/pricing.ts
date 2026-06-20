export type Size = '12oz' | '16oz' | 'One Size';
export type Temp = 'Hot' | 'Cold' | 'None';

export interface ProductConfig {
  sizes: Size[];
  temps: Temp[];
  prices: Record<Size, Partial<Record<Temp, number>>>;
  hasAddon?: { name: string; price: number };
}

export const PRICING_RULES: Record<string, ProductConfig> = {
  'Tea': {
    sizes: ['One Size'],
    temps: ['Hot', 'Cold'],
    prices: { 'One Size': { 'Hot': 55, 'Cold': 55 }, '12oz': {}, '16oz': {} },
    hasAddon: { name: 'Honey', price: 10 }
  },
  'Brewed': {
    sizes: ['16oz'],
    temps: ['Hot'],
    prices: { '16oz': { 'Hot': 65 }, '12oz': {}, 'One Size': {} }
  },
  'Americano': {
    sizes: ['12oz', '16oz'],
    temps: ['Hot', 'Cold'],
    prices: { 
      '12oz': { 'Cold': 100 }, 
      '16oz': { 'Cold': 110, 'Hot': 100 },
      'One Size': {}
    }
  },
  'Golden Americano': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 120 }, '16oz': { 'Cold': 130, 'Hot': 130 }, 'One Size': {} }
  },
  'Cafe Latte': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 115 }, '16oz': { 'Cold': 125, 'Hot': 125 }, 'One Size': {} }
  },
  'Cappuccino': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 125 }, '16oz': { 'Cold': 135, 'Hot': 135 }, 'One Size': {} }
  },
  'Salted Caramel': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 130 }, '16oz': { 'Cold': 140, 'Hot': 140 }, 'One Size': {} }
  },
  'Spanish Latte': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 130 }, '16oz': { 'Cold': 140, 'Hot': 140 }, 'One Size': {} }
  },
  'Hazelnut Latte': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 130 }, '16oz': { 'Cold': 140, 'Hot': 140 }, 'One Size': {} }
  },
  'White Chocolate': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 130 }, '16oz': { 'Cold': 140, 'Hot': 140 }, 'One Size': {} }
  },
  'Caramel Macchiato': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 140 }, '16oz': { 'Cold': 150, 'Hot': 150 }, 'One Size': {} }
  },
  'Butterscotch Macchiato': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 140 }, '16oz': { 'Cold': 150, 'Hot': 150 }, 'One Size': {} }
  },
  'Mocha': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 140 }, '16oz': { 'Cold': 150, 'Hot': 150 }, 'One Size': {} }
  },

  // Non-Coffee
  'Matcha Latte': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 160 }, '16oz': { 'Cold': 170, 'Hot': 170 }, 'One Size': {} }
  },
  'Signature Chocolate': {
    sizes: ['12oz', '16oz'], temps: ['Hot', 'Cold'],
    prices: { '12oz': { 'Cold': 100 }, '16oz': { 'Cold': 110, 'Hot': 110 }, 'One Size': {} }
  },
  'Matcha Strawberry': {
    sizes: ['12oz', '16oz'], temps: ['Cold'],
    prices: { '12oz': { 'Cold': 170 }, '16oz': { 'Cold': 180 }, 'One Size': {} }
  },
  'Strawberry Milk': {
    sizes: ['12oz', '16oz'], temps: ['Cold'],
    prices: { '12oz': { 'Cold': 100 }, '16oz': { 'Cold': 110 }, 'One Size': {} }
  },
  'Choco Berry': {
    sizes: ['12oz', '16oz'], temps: ['Cold'],
    prices: { '12oz': { 'Cold': 120 }, '16oz': { 'Cold': 130 }, 'One Size': {} }
  },

  // Limited Time
  'Blueberry Macha': {
    sizes: ['12oz', '16oz'], temps: ['Cold'],
    prices: { '12oz': { 'Cold': 170 }, '16oz': { 'Cold': 180 }, 'One Size': {} }
  },
  'Blueberry Milk': {
    sizes: ['12oz', '16oz'], temps: ['Cold'],
    prices: { '12oz': { 'Cold': 100 }, '16oz': { 'Cold': 110 }, 'One Size': {} }
  },
  'Blueberry Soda': {
    sizes: ['12oz', '16oz'], temps: ['Cold'],
    prices: { '12oz': { 'Cold': 89 }, '16oz': { 'Cold': 99 }, 'One Size': {} }
  },
  'White Mocha': {
    sizes: ['12oz', '16oz'], temps: ['Cold'],
    prices: { '12oz': { 'Cold': 150 }, '16oz': { 'Cold': 160 }, 'One Size': {} }
  },
  'Honey Uji Matcha': {
    sizes: ['12oz', '16oz'], temps: ['Cold'],
    prices: { '12oz': { 'Cold': 180 }, '16oz': { 'Cold': 190 }, 'One Size': {} }
  },
  'Seasalt Caramel': {
    sizes: ['12oz', '16oz'], temps: ['Cold'],
    prices: { '12oz': { 'Cold': 150 }, '16oz': { 'Cold': 160 }, 'One Size': {} }
  },
  'Velvet Vanilla': {
    sizes: ['12oz', '16oz'], temps: ['Cold'],
    prices: { '12oz': { 'Cold': 150 }, '16oz': { 'Cold': 160 }, 'One Size': {} }
  },
};

const SPARKLING_DRINKS = [
  'Strawberry Lemonade', 'Passionfruit', 'Green Apple', 'Honey Lemon', 'Lychee', 'Mango'
];

SPARKLING_DRINKS.forEach(drink => {
  PRICING_RULES[drink] = {
    sizes: ['12oz', '16oz'],
    temps: ['Cold'],
    prices: { '12oz': { 'Cold': 89 }, '16oz': { 'Cold': 99 }, 'One Size': {} }
  };
});


export const getProductPrice = (productName: string, size: Size, temp: Temp, hasAddon: boolean): number | null => {
  const config = PRICING_RULES[productName];
  if (!config) return null; // Fallback to item.price in calling code
  
  let basePrice = config.prices[size]?.[temp] ?? null;
  
  if (basePrice !== null && hasAddon && config.hasAddon) {
    basePrice += config.hasAddon.price;
  }
  
  return basePrice;
};
