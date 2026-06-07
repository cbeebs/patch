export async function detectBarcodeAndFetch(base64) {
  try {
    const barcode = await decodeBarcode(base64)
    if (!barcode) return null

    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const ingredients = p.ingredients_text
      ? p.ingredients_text.replace(/_/g,'').split(/,|;/).map(s=>s.trim()).filter(Boolean).slice(0,30)
      : []

    const ALLERGEN_MAP = {
      'en:gluten':'Gluten','en:dairy':'Dairy','en:milk':'Dairy',
      'en:eggs':'Eggs','en:nuts':'Nuts','en:peanuts':'Peanuts',
      'en:soybeans':'Soy','en:shellfish':'Shellfish','en:fish':'Fish',
      'en:sesame-seeds':'Sesame','en:sulphur-dioxide-and-sulphites':'Sulphites',
      'en:mustard':'Mustard'
    }
    const allergens = [...new Set((p.allergens_tags||[]).map(t=>ALLERGEN_MAP[t]).filter(Boolean))]

    return {
      barcode,
      productName: p.product_name || p.product_name_en || '',
      brand: p.brands || '',
      ingredients,
      allergens,
      nutritional: {
        calories: p.nutriments?.['energy-kcal_100g'] || null,
        sugar: p.nutriments?.sugars_100g || null,
        fat: p.nutriments?.fat_100g || null,
      },
      source: 'barcode'
    }
  } catch {
    return null
  }
}

async function decodeBarcode(base64) {
  return new Promise((resolve) => {
    import('quagga').then(({ default: Quagga }) => {
      Quagga.decodeSingle({
        decoder: { readers: ['ean_reader','ean_8_reader','code_128_reader','upc_reader','upc_e_reader'] },
        locate: true,
        src: `data:image/jpeg;base64,${base64}`
      }, result => {
        resolve(result?.codeResult?.code || null)
      })
    }).catch(() => resolve(null))
  })
}
