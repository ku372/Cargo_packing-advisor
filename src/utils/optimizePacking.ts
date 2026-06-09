import { calculateFreight, type CargoFormValues, type CartonGroup } from './calculateFreight'

export type OptimizationSuggestion = {
  label: string
  newDims: string
  chargeableWeight: number
  weightSaved: number
  moneySaved: number
}

export type PackingOptimization = {
  currentChargeableWeight: number
  optimizedChargeableWeight: number
  weightSaved: number
  freightSaving: number
  recommendedOption: string
  suggestions: OptimizationSuggestion[]
}

export type SizeRecommendation = {
  length: number
  width: number
  height: number
  volWeight: number
  label: string
}

/** Suggest box dimensions for actualWeight/qty so volWeight ≤ actualWeight */
export function suggestOptimalSizes(actualWeight: number, quantity: number): SizeRecommendation[] {
  if (actualWeight <= 0 || quantity <= 0) return []
  // Target volume per box so total vol weight = actual weight
  const targetVolPerBox = (actualWeight / quantity) * 6000
  const results: SizeRecommendation[] = []

  // Try common aspect ratios (L:W:H)
  const ratios = [
    { l: 3, w: 2, h: 1, label: 'Flat/Standard' },
    { l: 2, w: 2, h: 1, label: 'Square-Flat' },
    { l: 3, w: 1.5, h: 1, label: 'Long Box' },
    { l: 2, w: 1.5, h: 1, label: 'Medium Box' },
    { l: 1, w: 1, h: 1, label: 'Cube Box' },
  ]

  for (const { l, w, h, label } of ratios) {
    // V = (c*l) * (c*w) * (c*h) = c³ * l*w*h = targetVolPerBox
    const c = Math.cbrt(targetVolPerBox / (l * w * h))
    const length = Math.round(c * l)
    const width  = Math.round(c * w)
    const height = Math.round(c * h)
    if (length <= 0 || width <= 0 || height <= 0) continue
    const volWeight = (length * width * height * quantity) / 6000
    results.push({ length, width, height, volWeight: Math.round(volWeight * 100) / 100, label })
  }

  return results.slice(0, 4)
}

export function optimizePacking(values: CargoFormValues): PackingOptimization {
  const current = calculateFreight(values)
  const currentCW = current.chargeableWeight
  const { cartonGroups, ratePerKg } = values

  const seen = new Set<string>()
  const suggestions: OptimizationSuggestion[] = []

  // Try reducing each dimension of each group
  for (let gi = 0; gi < cartonGroups.length; gi++) {
    const g = cartonGroups[gi]
    const dims = [
      { field: 'length', v: g.length },
      { field: 'width',  v: g.width  },
      { field: 'height', v: g.height },
    ]
    for (const { field, v } of dims) {
      for (let red = 1; red <= 10; red++) {
        const newV = v - red
        if (newV <= 0) break
        const newGroups: CartonGroup[] = cartonGroups.map((grp, idx) =>
          idx === gi ? { ...grp, [field]: newV } : grp,
        )
        const newResult = calculateFreight({ ...values, cartonGroups: newGroups })
        const saved = currentCW - newResult.chargeableWeight
        if (saved <= 0.5) continue

        const key = `${gi}-${field}-${red}`
        if (seen.has(key)) continue
        seen.add(key)

        const newG = newGroups[gi]
        suggestions.push({
          label: `Group ${gi + 1}: reduce ${field} by ${red} cm → ${newG.length}×${newG.width}×${newG.height} cm`,
          newDims: `${newG.length}×${newG.width}×${newG.height}`,
          chargeableWeight: Math.round(newResult.chargeableWeight * 100) / 100,
          weightSaved: Math.round(saved * 100) / 100,
          moneySaved: Math.round(saved * ratePerKg * 100) / 100,
        })
      }
    }
  }

  // Sort by most savings first, keep top 5
  suggestions.sort((a, b) => b.moneySaved - a.moneySaved)
  const top = suggestions.slice(0, 5)

  const best = top[0]
  return {
    currentChargeableWeight: currentCW,
    optimizedChargeableWeight: best?.chargeableWeight ?? currentCW,
    weightSaved: best?.weightSaved ?? 0,
    freightSaving: best?.moneySaved ?? 0,
    recommendedOption: best?.label ?? 'Already optimal — no savings possible',
    suggestions: top,
  }
}
