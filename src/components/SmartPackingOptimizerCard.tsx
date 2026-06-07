import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import type { PackingOptimization } from '../utils/optimizePacking'
import { formatCurrency } from '../utils/formatCurrency'

type SmartPackingOptimizerCardProps = {
  optimization: PackingOptimization
}

const formatWeight = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const metrics = [
  { label: 'Current Chargeable Weight', key: 'currentChargeableWeight' as const, unit: 'kg' },
  { label: 'Optimized Chargeable Weight', key: 'optimizedChargeableWeight' as const, unit: 'kg' },
  { label: 'Weight Saved', key: 'weightSaved' as const, unit: 'kg' },
  { label: 'Freight Saving', key: 'freightSaving' as const, unit: '', isCost: true },
]

export default function SmartPackingOptimizerCard({
  optimization,
}: SmartPackingOptimizerCardProps) {
  const hasSavings = optimization.weightSaved > 0
  const accentColor = hasSavings ? '#2e7d32' : '#1565c0'

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderColor: accentColor,
        bgcolor: hasSavings ? 'rgba(46, 125, 50, 0.04)' : 'rgba(21, 101, 192, 0.04)',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoFixHighIcon sx={{ color: accentColor }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Smart Packing Optimizer
            </Typography>
          </Box>
          {hasSavings && (
            <Chip
              label="Savings found"
              size="small"
              sx={{ bgcolor: accentColor, color: '#fff', fontWeight: 600 }}
            />
          )}
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {metrics.map(({ label, key, unit, isCost }) => (
            <Grid key={key} size={{ xs: 12, sm: 6 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: accentColor }}>
                  {isCost ? formatCurrency(optimization[key]) : formatWeight(optimization[key])}
                  {unit && (
                    <Typography component="span" variant="body1" sx={{ ml: 0.5, fontWeight: 500 }}>
                      {unit}
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: hasSavings ? 'rgba(46, 125, 50, 0.1)' : 'rgba(21, 101, 192, 0.08)',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
            Recommended Option
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: accentColor }}>
            {optimization.recommendedOption}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
