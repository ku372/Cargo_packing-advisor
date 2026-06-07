export type CartonGroup = {
  length: number
  width: number
  height: number
  quantity: number
}

export type CargoFormValues = {
  material: string
  actualWeight: number
  cartonGroups: CartonGroup[]
  ratePerKg: number
}

export type FreightResult = {
  actualWeight: number
  totalVolumetricWeight: number
  chargeableWeight: number
  freightCost: number
  packingEfficiency: number
  extraFreightWeight: number
  extraFreightCost: number
  packingInefficient: boolean
}

export type EfficiencyTier = 'green' | 'yellow' | 'red'

export function getEfficiencyTier(score: number): EfficiencyTier {
  if (score >= 90) return 'green'
  if (score >= 75) return 'yellow'
  return 'red'
}

export function calculatePackingEfficiency(actualWeight: number, chargeableWeight: number): number {
  if (chargeableWeight <= 0) return 0
  return (actualWeight / chargeableWeight) * 100
}

export function isPackingInefficient(
  actualWeight: number,
  totalVolumetricWeight: number,
): boolean {
  if (totalVolumetricWeight <= actualWeight) return false
  if (actualWeight <= 0) return true
  return totalVolumetricWeight > actualWeight * 1.1
}

export function calculateGroupVolumetricWeight(group: CartonGroup): number {
  return (group.length * group.width * group.height * group.quantity) / 6000
}

export function calculateFreight(values: CargoFormValues): FreightResult {
  const { actualWeight, cartonGroups, ratePerKg } = values

  const totalVolumetricWeight = cartonGroups.reduce(
    (sum, group) => sum + calculateGroupVolumetricWeight(group),
    0,
  )
  const chargeableWeight = Math.max(actualWeight, totalVolumetricWeight)
  const freightCost = chargeableWeight * ratePerKg
  const packingEfficiency = calculatePackingEfficiency(actualWeight, chargeableWeight)
  const extraFreightWeight = Math.max(chargeableWeight - actualWeight, 0)
  const extraFreightCost = extraFreightWeight * ratePerKg
  const packingInefficient = isPackingInefficient(actualWeight, totalVolumetricWeight)

  return {
    actualWeight,
    totalVolumetricWeight,
    chargeableWeight,
    freightCost,
    packingEfficiency,
    extraFreightWeight,
    extraFreightCost,
    packingInefficient,
  }
}
