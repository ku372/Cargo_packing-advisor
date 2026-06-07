import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import StraightenIcon from '@mui/icons-material/Straighten'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import type { FreightResult } from '../utils/calculateFreight'
import { formatCurrency } from '../utils/formatCurrency'

type ResultCardsProps = {
  results: FreightResult
}

const formatWeight = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const resultItems = [
  {
    key: 'totalVolumetricWeight' as const,
    label: 'Total Volumetric Weight',
    unit: 'kg',
    icon: StraightenIcon,
    color: '#6a1b9a',
    bg: 'rgba(106, 27, 154, 0.08)',
  },
  {
    key: 'chargeableWeight' as const,
    label: 'Chargeable Weight',
    unit: 'kg',
    icon: TrendingUpIcon,
    color: '#e65100',
    bg: 'rgba(230, 81, 0, 0.08)',
    highlight: true,
  },
  {
    key: 'freightCost' as const,
    label: 'Freight Cost',
    unit: '',
    icon: AttachMoneyIcon,
    color: '#2e7d32',
    bg: 'rgba(46, 125, 50, 0.08)',
    highlight: true,
    isCost: true,
  },
]

export default function ResultCards({ results }: ResultCardsProps) {
  return (
    <Grid container spacing={2}>
      {resultItems.map(({ key, label, unit, icon: Icon, color, bg, highlight, isCost }) => (
        <Grid key={key} size={{ xs: 12, sm: 4 }}>
          <Card
            elevation={highlight ? 4 : 1}
            sx={{
              height: '100%',
              borderLeft: 4,
              borderColor: color,
              bgcolor: bg,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Icon sx={{ color, fontSize: 22 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {label}
                </Typography>
              </Box>
              <Typography
                variant={highlight ? 'h4' : 'h5'}
                component="p"
                sx={{ color, fontWeight: 700, lineHeight: 1.2 }}
              >
                {isCost ? formatCurrency(results[key]) : formatWeight(results[key])}
                {unit && (
                  <Typography component="span" variant="h6" sx={{ ml: 0.5, fontWeight: 500 }}>
                    {unit}
                  </Typography>
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
