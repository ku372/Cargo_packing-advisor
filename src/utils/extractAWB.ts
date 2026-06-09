import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

export type AWBExtracted = {
  awbNumber: string
  actualWeight: number
  ratePerKg: number
  material: string
  pieces: number
  cartonGroups: Array<{ length: number; width: number; height: number; quantity: number }>
}

const MATERIAL_MAP: Record<string, string> = {
  FISH: 'Fish', LITCHI: 'Fruits', MANGO: 'Fruits', VEGETABLE: 'Vegetables',
  FLOWER: 'Flowers', FRUIT: 'Fruits', TEXTILE: 'Textiles', PHARMA: 'Pharmaceuticals',
  MEDICINE: 'Pharmaceuticals', ELECTRONIC: 'Electronics', PERISHABLE: 'Perishable Cargo',
  GENERAL: 'General Cargo', REGULATOR: 'Machinery', MACHINE: 'Machinery',
}

function detectMaterial(text: string): string {
  const up = text.toUpperCase()
  for (const [key, val] of Object.entries(MATERIAL_MAP)) {
    if (up.includes(key)) return val
  }
  return 'General Cargo'
}

function parseDims(text: string): Array<{ length: number; width: number; height: number; quantity: number }> {
  const groups: Array<{ length: number; width: number; height: number; quantity: number }> = []
  // Pattern: DIMS: 60.00 * 40.00 * 30.00 * 10 * Cms  (multiple allowed)
  const re = /DIMS?[:\s]*(\d+(?:\.\d+)?)\s*[*×x]\s*(\d+(?:\.\d+)?)\s*[*×x]\s*(\d+(?:\.\d+)?)\s*[*×x]\s*(\d+(?:\.\d+)?)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    groups.push({
      length:   parseFloat(m[1]),
      width:    parseFloat(m[2]),
      height:   parseFloat(m[3]),
      quantity: Math.round(parseFloat(m[4])),
    })
  }
  return groups
}

export async function extractAWBFromBuffer(buffer: ArrayBuffer): Promise<AWBExtracted | null> {
  try {
    const pdf   = await pdfjsLib.getDocument({ data: buffer }).promise
    const page  = await pdf.getPage(1)
    const tc    = await page.getTextContent()
    const items = tc.items as Array<{ str: string; transform: number[] }>
    const fullText = items.map(i => i.str).join(' ')

    // AWB number
    const awbMatch = fullText.match(/312[-_]\d{8}/)
    const awbNumber = awbMatch ? awbMatch[0].replace('_', '-') : '312-XXXXXXXX'

    // Label-based finder
    function findByLabel(patterns: string[], offset: number, xMin = 55, xMax = 130, tol = 6): number | null {
      for (const item of items) {
        const up = item.str.trim().toUpperCase()
        if (!patterns.some(p => up.includes(p))) continue
        const targetY = item.transform[5] - offset
        let best: number | null = null; let bestDist = 999
        for (const item2 of items) {
          const x2 = item2.transform[4]; const y2 = item2.transform[5]
          if (x2 < xMin || x2 > xMax) continue
          const dist = Math.abs(y2 - targetY)
          if (dist > tol) continue
          const m2 = item2.str.trim().match(/^[\d,]+\.\d{2}$/)
          if (m2) {
            const val = parseFloat(m2[0].replace(/,/g, ''))
            if (val > 0 && dist < bestDist) { bestDist = dist; best = val }
          }
        }
        if (best !== null) return best
      }
      return null
    }

    const wc = findByLabel(['WEIGHT CHARGE'], 16.459) ?? 0
    const cw = (() => {
      let cwLabelY: number | null = null
      for (const item of items) {
        if (item.str.trim().toUpperCase().includes('WEIGHT CHARGE')) {
          cwLabelY = item.transform[5]; break
        }
      }
      if (cwLabelY === null) return 0
      for (const item of items) {
        const x = item.transform[4]; const y = item.transform[5]
        if (x > 55 && x < 100 && y > cwLabelY) {
          const m = item.str.trim().match(/^[\d,]+\.\d{2}$/)
          if (m) { const v = parseFloat(m[0].replace(/,/g, '')); if (v > 0) return v }
        }
      }
      return 0
    })()

    const ratePerKg = cw > 0 && wc > 0 ? Math.round((wc / cw) * 100) / 100 : 0
    const actualWeight = cw > 0 ? cw : 0

    // Pieces count
    const piecesMatch = fullText.match(/\b(\d{1,3})\s+\d+\.\d{2}\s+K\b/)
    const pieces = piecesMatch ? parseInt(piecesMatch[1]) : 1

    // Carton groups from DIMS
    const cartonGroups = parseDims(fullText)

    // Material from cargo description
    const descMatch = fullText.match(/\d+\.\d{2}\s+[A-Z]+\s+[A-Z\s,()]+DIMS/i)
    const descText = descMatch ? descMatch[0] : fullText
    const material = detectMaterial(descText)

    return { awbNumber, actualWeight, ratePerKg, material, pieces, cartonGroups }
  } catch {
    return null
  }
}
