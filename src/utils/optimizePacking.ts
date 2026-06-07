import {
  calculateFreight,
  type CargoFormValues,
  type CartonGroup,
} from './calculateFreight'

export type PackingOptimization = {
  currentChargeableWeight: number
  optimizedChargeableWeight: number
  weightSaved: number
  freightSaving: number
  recommendedOption: string
}

const HEIGHT_REDUCTIONS = [1, 2, 3, 4, 5]

function withAdjustedHeight(
  groups: CartonGroup[],
  groupIndex: number,
  heightReduction: number,
): CartonGroup[] | null {
  const newHeight = groups[groupIndex].height - heightReduction
  if (newHeight <= 0) return null

  return groups.map((group, index) =>
    index === groupIndex ? { ...group, height: newHeight } : group,
  )
}

export function optimizePacking(values: CargoFormValues): PackingOptimization {
  const { cartonGroups, ratePerKg } = values
  const current = calculateFreight(values)
  const currentChargeableWeight = current.chargeableWeight

  let bestChargeableWeight = currentChargeableWeight
  let bestWeightSaved = 0
  let recommendedOption = 'No change needed — already optimal'

  cartonGroups.forEach((_, groupIndex) => {
    HEIGHT_REDUCTIONS.forEach((reduction) => {
      const adjustedGroups = withAdjustedHeight(cartonGroups, groupIndex, reduction)
      if (!adjustedGroups) return

      const optimized = calculateFreight({ ...values, cartonGroups: adjustedGroups })
      const weightSaved = currentChargeableWeight - optimized.chargeableWeight

      if (weightSaved > bestWeightSaved) {
        bestWeightSaved = weightSaved
        bestChargeableWeight = optimized.chargeableWeight
        recommendedOption = `Reduce Group ${groupIndex + 1} height by ${reduction} cm`
      }
    })
  })

  return {
    currentChargeableWeight,
    optimizedChargeableWeight: bestChargeableWeight,
    weightSaved: bestWeightSaved,
    freightSaving: bestWeightSaved * ratePerKg,
    recommendedOption,
  }
}
