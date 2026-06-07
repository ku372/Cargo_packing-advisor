import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import SpeedIcon from '@mui/icons-material/Speed'
import { getEfficiencyTier } from '../utils/calculateFreight'

type PackingEfficiencyCardProps = {
  score: number
}

const tierStyles = {
  green: {
    color: '#2e7d32',
    bg: 'rgba(46, 125, 50, 0.1)',
    label: 'Excellent',
  },
  yellow: {
    color: '#ed6c02',
    bg: 'rgba(237, 108, 2, 0.1)',
    label: 'Good',
  },
  red: {
    color: '#d32f2f',
    bg: 'rgba(211, 47, 47, 0.1)',
    label: 'Poor',
  },
} as const

const formatScore = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function PackingEfficiencyCard({ score }: PackingEfficiencyCardProps) {
  const tier = getEfficiencyTier(score)
  const styles = tierStyles[tier]

  return (
    <Card
      elevation={3}
      sx={{
        mb: 2,
        borderLeft: 6,
        borderColor: styles.color,
        bgcolor: styles.bg,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon sx={{ color: styles.color, fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Packing Efficiency Score
            </Typography>
          </Box>
          <Chip
            label={styles.label}
            size="small"
            sx={{
              bgcolor: styles.color,
              color: '#fff',
              fontWeight: 600,
            }}
          />
        </Box>

        <Typography variant="h3" component="p" sx={{ color: styles.color, fontWeight: 700 }}>
          {formatScore(score)}%
        </Typography>
      </CardContent>
    </Card>
  )
}
