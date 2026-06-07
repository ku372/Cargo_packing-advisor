import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import type { FreightResult } from '../utils/calculateFreight'

type PackingAdvisorCardProps = {
  results: FreightResult
}

const recommendations = [
  'Reduce carton height',
  'Reduce empty space',
  'Optimize carton dimensions',
]

export default function PackingAdvisorCard({ results }: PackingAdvisorCardProps) {
  if (!results.packingInefficient) return null

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <AlertTitle sx={{ fontWeight: 700 }}>Packing is inefficient</AlertTitle>
      </Alert>

      <Card
        variant="outlined"
        sx={{
          borderColor: 'warning.main',
          bgcolor: 'rgba(237, 108, 2, 0.04)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TipsAndUpdatesIcon color="warning" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Packing Advisor Recommendations
            </Typography>
          </Box>

          <List dense disablePadding>
            {recommendations.map((recommendation) => (
              <ListItem key={recommendation} disableGutters sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LightbulbOutlinedIcon fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={recommendation}
                  slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  )
}
