import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import SavingsIcon from '@mui/icons-material/Savings'
import { type PackingOptimization } from '../utils/optimizePacking'
import { formatCurrency } from '../utils/formatCurrency'

type Props = { optimization: PackingOptimization }

export default function SmartPackingOptimizerCard({ optimization }: Props) {
  const { suggestions, freightSaving, weightSaved } = optimization

  if (suggestions.length === 0) {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        ✅ Already optimal! Packing dimensions are efficient — no extra freight.
      </Alert>
    )
  }

  return (
    <Card elevation={2} sx={{ mb: 2, border: '1px solid', borderColor: 'warning.light' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TipsAndUpdatesIcon color="warning" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Smart Packing Optimizer</Typography>
          {freightSaving > 0 && (
            <Chip
              icon={<SavingsIcon />}
              label={`Save up to ${formatCurrency(freightSaving)}`}
              color="success" size="small" sx={{ ml: 'auto' }}
            />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Reducing carton dimensions reduces volumetric weight → lower freight cost.
          Best saving: reduce by {weightSaved.toFixed(1)} kg → save {formatCurrency(freightSaving)}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {suggestions.map((s, i) => (
            <Box key={i}>
              {i > 0 && <Divider sx={{ my: 0.5 }} />}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{s.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    New CW: {s.chargeableWeight} kg (−{s.weightSaved} kg)
                  </Typography>
                </Box>
                <Chip
                  label={`Save ${formatCurrency(s.moneySaved)}`}
                  color={i === 0 ? 'success' : 'default'}
                  size="small" sx={{ flexShrink: 0 }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
