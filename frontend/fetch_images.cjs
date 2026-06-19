const fs = require('fs');
const https = require('https');

const products = [
  'Basmati Rice', 'Sunflower Oil', 'Toor Dal', 'Red Lentils', 'Wheat Flour', 'White Sugar', 'Sea Salt',
  'Curry Powder', 'Chili Powder', 'Turmeric Powder', 'Garam Masala',
  'Fresh Tomatoes', 'Fresh Potatoes', 'Fresh Onions', 'Carrots', 'Cabbage', 'Green Beans',
  'Red Apples', 'Bananas', 'Oranges', 'Fresh Mangoes', 'Papaya',
  'Fresh Milk', 'Cheddar Cheese', 'Butter', 'Natural Yogurt',
  'Brown Bread', 'White Bread', 'Burger Buns', 'Chocolate Cake',
  'Fresh Seer Fish', 'Frozen Chicken', 'Frozen Peas', 'Frozen French Fries'
];

async function fetchImageId(query) {
  return new Promise((resolve, reject) => {
    https.get(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=1`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            resolve(json.results[0].id);
          } else {
            resolve('1542838132-92c53300491e'); // fallback
          }
        } catch (e) {
          resolve('1542838132-92c53300491e');
        }
      });
    }).on('error', e => resolve('1542838132-92c53300491e'));
  });
}

async function run() {
  const mapping = {};
  for (const p of products) {
    const id = await fetchImageId(p);
    mapping[p] = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=400`;
    console.log(`Mapping ${p} to ${id}`);
    await new Promise(r => setTimeout(r, 500)); // sleep to avoid rate limits
  }
  fs.writeFileSync('image-mapping.json', JSON.stringify(mapping, null, 2));
  console.log('Done.');
}

run();
