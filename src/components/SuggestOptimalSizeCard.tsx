import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import SquareFootIcon from '@mui/icons-material/SquareFoot'
import { useState } from 'react'
import { suggestOptimalSizes } from '../utils/optimizePacking'
import { formatCurrency } from '../utils/formatCurrency'

type Props = { ratePerKg?: number }

export default function SuggestOptimalSizeCard({ ratePerKg = 0 }: Props) {
  const [weight, setWeight]   = useState('')
  const [qty,    setQty]      = useState('')
  const [results, setResults] = useState<ReturnType<typeof suggestOptimalSizes>>([])
  const [error,  setError]    = useState('')

  function calculate() {
    const w = parseFloat(weight); const q = parseFloat(qty)
    if (!w || w <= 0 || !q || q <= 0) { setError('Weight और Quantity दोनों भरो'); return }
    setError('')
    setResults(suggestOptimalSizes(w, q))
  }

  return (
    <Card elevation={2} sx={{ mb: 2, border: '1px solid', borderColor: 'info.light' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SquareFootIcon color="info" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Suggest Optimal Box Size
          </Typography>
          <Chip label="Next Shipment Planner" color="info" size="small" sx={{ ml: 'auto' }} />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Actual weight और boxes की quantity डालो — app वो dimensions बताएगा जिसमें
          <strong> volumetric weight = actual weight</strong> हो (zero extra freight)
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6 }}>
            <TextField fullWidth label="Actual Weight (kg)" type="number"
              value={weight} onChange={e => setWeight(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 'any' } }} size="small" />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField fullWidth label="No. of Boxes" type="number"
              value={qty} onChange={e => setQty(e.target.value)}
              slotProps={{ htmlInput: { min: 1, step: 1 } }} size="small" />
          </Grid>
        </Grid>

        {error && <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>{error}</Typography>}

        <Button variant="outlined" color="info" fullWidth onClick={calculate} sx={{ mb: 2 }}>
          Suggest Box Sizes
        </Button>

        {results.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              All options below → Volumetric Weight ≈ Actual Weight → No extra freight charge
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Box Type</TableCell>
                  <TableCell align="center">L × W × H (cm)</TableCell>
                  <TableCell align="right">Vol. Wt (kg)</TableCell>
                  {ratePerKg > 0 && <TableCell align="right">Freight</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i} sx={{ bgcolor: i === 0 ? 'success.50' : 'inherit' }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: i === 0 ? 700 : 400 }}>
                        {r.label} {i === 0 && '⭐'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${r.length} × ${r.width} × ${r.height}`} size="small"
                        color={i === 0 ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">{r.volWeight} kg</TableCell>
                    {ratePerKg > 0 && (
                      <TableCell align="right">
                        {formatCurrency(r.volWeight * ratePerKg)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  )
}
