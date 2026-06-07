import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import type { FreightResult } from '../utils/calculateFreight'
import { formatCurrency } from '../utils/formatCurrency'

type ExtraFreightAnalysisCardProps = {
  results: FreightResult
}

const formatWeight = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const metrics = [
  { label: 'Actual Weight', key: 'actualWeight' as const, unit: 'kg', isCost: false },
  { label: 'Chargeable Weight', key: 'chargeableWeight' as const, unit: 'kg', isCost: false },
  { label: 'Extra Freight Weight', key: 'extraFreightWeight' as const, unit: 'kg', isCost: false },
  { label: 'Extra Freight Cost', key: 'extraFreightCost' as const, unit: '', isCost: true },
]

export default function ExtraFreightAnalysisCard({ results }: ExtraFreightAnalysisCardProps) {
  return (
    <Alert
      severity="warning"
      variant="outlined"
      sx={{
        mb: 2,
        alignItems: 'flex-start',
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>Extra Freight Analysis</AlertTitle>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {metrics.map(({ label, key, unit, isCost }) => (
          <Grid key={key} size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'rgba(237, 108, 2, 0.08)',
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                {label}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                {isCost ? formatCurrency(results[key]) : formatWeight(results[key])}
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
    </Alert>
  )
}
