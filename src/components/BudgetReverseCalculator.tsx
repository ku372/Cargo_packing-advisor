import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { formatCurrency } from '../utils/formatCurrency'

type Props = { ratePerKg?: number }

type Result = {
  maxCW: number
  maxActualWeight: number
  suggestedDims: { l: number; w: number; h: number; qty: number; volWt: number; label: string }[]
}

export default function BudgetReverseCalculator({ ratePerKg = 0 }: Props) {
  const [budget,  setBudget]  = useState('')
  const [rate,    setRate]    = useState(ratePerKg > 0 ? String(ratePerKg) : '')
  const [qty,     setQty]     = useState('')
  const [result,  setResult]  = useState<Result | null>(null)
  const [error,   setError]   = useState('')

  function calculate() {
    const b = parseFloat(budget)
    const r = parseFloat(rate)
    const q = parseFloat(qty)
    if (!b || b <= 0)  { setError('Budget डालो'); return }
    if (!r || r <= 0)  { setError('Rate/kg डालो'); return }
    if (!q || q <= 0)  { setError('Boxes की quantity डालो'); return }
    setError('')

    // Max chargeable weight within budget (including 18% GST)
    // Total prepaid = base * 1.18, where base includes WC+DA+DC
    // For simplicity: user's budget covers freight = CW * rate
    const maxCW = Math.floor((b / r) * 100) / 100

    // Max actual weight = maxCW (best case: no volumetric penalty)
    const maxActualWeight = maxCW

    // Suggest box dims: L*W*H*qty/6000 ≤ maxCW
    // Target vol per box = maxCW * 6000 / qty
    const targetVolPerBox = (maxCW * 6000) / q
    const ratios = [
      { l: 3, w: 2, h: 1, label: 'Flat' },
      { l: 2, w: 2, h: 1, label: 'Square-Flat' },
      { l: 3, w: 1.5, h: 1, label: 'Long Box' },
      { l: 1, w: 1, h: 1, label: 'Cube' },
    ]
    const dims = ratios.map(({ l, w, h, label }) => {
      const c = Math.cbrt(targetVolPerBox / (l * w * h))
      const L = Math.floor(c * l)
      const W = Math.floor(c * w)
      const H = Math.floor(c * h)
      const volWt = Math.round((L * W * H * q) / 6000 * 100) / 100
      return { l: L, w: W, h: H, qty: Math.round(q), volWt, label } as { l:number; w:number; h:number; qty:number; volWt:number; label:string }
    }).filter(d => d.l > 0 && d.w > 0 && d.h > 0)

    setResult({ maxCW, maxActualWeight, suggestedDims: dims })
  }

  return (
    <Card elevation={2} sx={{ mb: 2, border: '1px solid', borderColor: 'success.light' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <AccountBalanceWalletIcon color="success" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Budget Reverse Calculator</Typography>
          <Chip label="Plan Next Shipment" color="success" size="small" sx={{ ml: 'auto' }} />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Budget और Rate/kg डालो — app बताएगा maximum weight और ideal box size
        </Typography>

        <Grid container spacing={2} sx={{ mb: 1.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth size="small" label="Total Budget" type="number"
              value={budget} onChange={e => setBudget(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField fullWidth size="small" label="Rate per kg" type="number"
              value={rate} onChange={e => setRate(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField fullWidth size="small" label="No. of Boxes" type="number"
              value={qty} onChange={e => setQty(e.target.value)} />
          </Grid>
        </Grid>

        {error && <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>{error}</Typography>}

        <Button variant="outlined" color="success" fullWidth onClick={calculate} sx={{ mb: 2 }}>
          Calculate Max Weight & Dimensions
        </Button>

        {result && (
          <Box>
            {/* Summary chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`Max Chargeable Weight: ${result.maxCW} kg`} color="success" />
              <Chip label={`Max Actual Weight: ${result.maxActualWeight} kg`} color="info" variant="outlined" />
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              इन dimensions में box बनाओ तो Volumetric Weight = {result.maxCW} kg रहेगा (Budget exact use होगा)
            </Typography>

            <Divider sx={{ mb: 1.5 }} />

            {result.suggestedDims.map((d, i) => (
              <Box key={i} sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                py: 1, borderBottom: i < result.suggestedDims.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: i === 0 ? 700 : 400 }}>
                    {d.label} {i === 0 ? '⭐ Best' : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {d.l} × {d.w} × {d.h} cm × {d.qty} boxes
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip label={`Vol Wt: ${d.volWt} kg`}
                    color={i === 0 ? 'success' : 'default'} size="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                    {formatCurrency(d.volWt * parseFloat(rate))}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
