import { useState, useEffect, useRef, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import CalculateIcon from '@mui/icons-material/Calculate'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import RefreshIcon from '@mui/icons-material/Refresh'
import { calculateFreight, type FreightResult } from '../utils/calculateFreight'
import { optimizePacking, type PackingOptimization } from '../utils/optimizePacking'
import { extractAWBFromBuffer } from '../utils/extractAWB'
import ExtraFreightAnalysisCard from './ExtraFreightAnalysisCard'
import PackingAdvisorCard from './PackingAdvisorCard'
import PackingEfficiencyCard from './PackingEfficiencyCard'
import ResultCards from './ResultCards'
import SmartPackingOptimizerCard from './SmartPackingOptimizerCard'
import SuggestOptimalSizeCard from './SuggestOptimalSizeCard'

const APP_VERSION = 'v1.2.0'
const SHARE_CACHE = 'packing-shared-v1'

const MATERIALS = [
  'Flowers','Fish','Vegetables','Fruits','Textiles',
  'Electronics','Machinery','General Cargo','Pharmaceuticals','Perishable Cargo','Other',
]

type CartonGroupForm = { id: string; length: string; width: string; height: string; quantity: string }
type FormState = { material: string; actualWeight: string; ratePerKg: string }
type CartonGroupErrors = Partial<Record<keyof Omit<CartonGroupForm, 'id'>, string>>
type FormErrors = { material?: string; actualWeight?: string; ratePerKg?: string; cartonGroups?: Record<string, CartonGroupErrors> }

const createGroup = (): CartonGroupForm => ({ id: crypto.randomUUID(), length:'', width:'', height:'', quantity:'1' })
const INITIAL_FORM: FormState = { material:'', actualWeight:'', ratePerKg:'' }

function parsePositive(v: string): number | null {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

function validate(form: FormState, groups: CartonGroupForm[]): FormErrors {
  const e: FormErrors = {}
  if (!form.material)                                   e.material     = 'Select a material'
  if (!form.actualWeight.trim())                        e.actualWeight = 'Required'
  else if (!parsePositive(form.actualWeight))           e.actualWeight = 'Enter a positive number'
  if (!form.ratePerKg.trim())                           e.ratePerKg   = 'Required'
  else if (!parsePositive(form.ratePerKg))              e.ratePerKg   = 'Enter a positive number'
  const ge: Record<string, CartonGroupErrors> = {}
  groups.forEach(g => {
    const ge2: CartonGroupErrors = {}
    ;(['length','width','height','quantity'] as const).forEach(f => {
      if (!g[f].trim())               ge2[f] = 'Required'
      else if (!parsePositive(g[f]))  ge2[f] = 'Enter a positive number'
    })
    if (Object.keys(ge2).length) ge[g.id] = ge2
  })
  if (Object.keys(ge).length) e.cartonGroups = ge
  return e
}

function hasErrors(e: FormErrors) {
  return !!(e.material || e.actualWeight || e.ratePerKg || (e.cartonGroups && Object.keys(e.cartonGroups).length))
}

export default function CargoCalculator() {
  const [form,         setForm]         = useState<FormState>(INITIAL_FORM)
  const [groups,       setGroups]       = useState<CartonGroupForm[]>([createGroup()])
  const [errors,       setErrors]       = useState<FormErrors>({})
  const [results,      setResults]      = useState<FreightResult | null>(null)
  const [optimization, setOptimization] = useState<PackingOptimization | null>(null)
  const [pdfStatus,    setPdfStatus]    = useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [pdfMsg,       setPdfMsg]       = useState('')
  const [pdfName,      setPdfName]      = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Share target: load PDF from cache when ?shared=1 ─────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('shared') === '1') {
      void loadSharedPdf()
      window.history.replaceState({}, '', '/')
    }
  }, [])

  async function loadSharedPdf() {
    try {
      if (!('caches' in window)) return
      const cache = await caches.open(SHARE_CACHE)
      const resp  = await cache.match('/__shared_pdf__')
      if (!resp) return
      const buf  = await resp.arrayBuffer()
      const name = resp.headers.get('X-File-Name') ?? 'shared.pdf'
      await cache.delete('/__shared_pdf__')
      await processPdfBuffer(buf, name)
    } catch { /* ignore */ }
  }

  async function processPdfBuffer(buf: ArrayBuffer, name: string) {
    setPdfStatus('loading'); setPdfMsg('PDF se data extract ho raha hai...'); setPdfName(name)
    const data = await extractAWBFromBuffer(buf)
    if (!data) {
      setPdfStatus('error'); setPdfMsg('PDF se data extract nahi hua. Sirf IndiGo AWB PDF kaam karta hai.')
      return
    }
    // Auto-fill form
    setForm({
      material:     data.material,
      actualWeight: String(data.actualWeight),
      ratePerKg:    data.ratePerKg > 0 ? String(data.ratePerKg) : '',
    })
    // Auto-fill carton groups from DIMS
    if (data.cartonGroups.length > 0) {
      setGroups(data.cartonGroups.map(g => ({
        id: crypto.randomUUID(),
        length:   String(g.length),
        width:    String(g.width),
        height:   String(g.height),
        quantity: String(g.quantity),
      })))
    }
    setErrors({})
    setResults(null); setOptimization(null)
    setPdfStatus('ok')
    setPdfMsg(`✅ ${data.awbNumber} — ${data.actualWeight} kg, ₹${data.ratePerKg}/kg, ${data.cartonGroups.length} carton group(s) auto-filled`)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    await processPdfBuffer(await file.arrayBuffer(), file.name)
  }

  function resetAll() {
    setForm(INITIAL_FORM)
    setGroups([createGroup()])
    setErrors({})
    setResults(null); setOptimization(null)
    setPdfStatus('idle'); setPdfMsg(''); setPdfName('')
  }

  // ── Form helpers ──────────────────────────────────────────────
  const updateField = (f: keyof FormState, v: string) => {
    setForm(prev => ({ ...prev, [f]: v }))
    if (errors[f]) setErrors(prev => ({ ...prev, [f]: undefined }))
  }

  const updateGroup = (id: string, f: keyof Omit<CartonGroupForm,'id'>, v: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, [f]: v } : g))
  }

  const addGroup    = () => setGroups(prev => [...prev, createGroup()])
  const removeGroup = (id: string) => setGroups(prev => prev.filter(g => g.id !== id))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(form, groups)
    if (hasErrors(errs)) { setErrors(errs); return }
    const vals = {
      material: form.material,
      actualWeight: Number(form.actualWeight),
      ratePerKg: Number(form.ratePerKg),
      cartonGroups: groups.map(g => ({ length:Number(g.length), width:Number(g.width), height:Number(g.height), quantity:Number(g.quantity) })),
    }
    setResults(calculateFreight(vals))
    setOptimization(optimizePacking(vals))
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>

      {/* ── PDF Upload Card ──────────────────────────────────── */}
      <Card elevation={2} sx={{ mb: 3, border: '2px dashed', borderColor: pdfStatus === 'ok' ? 'success.main' : pdfStatus === 'error' ? 'error.main' : 'primary.light' }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
            <PictureAsPdfIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight:600 }}>Auto-fill from AWB PDF</Typography>
            <Chip label={APP_VERSION} size="small" variant="outlined" sx={{ ml:'auto', fontSize:'0.65rem' }} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb:1.5 }}>
            IndiGo AWB PDF upload karo — weight, rate aur carton dimensions automatically fill honge.
            WhatsApp se PDF share karke bhi kaam karta hai.
          </Typography>

          {pdfStatus === 'loading' && <LinearProgress sx={{ mb:1 }} />}
          {pdfStatus === 'ok'      && <Alert severity="success" sx={{ mb:1, py:0.5 }}>{pdfMsg}</Alert>}
          {pdfStatus === 'error'   && <Alert severity="error"   sx={{ mb:1, py:0.5 }}>{pdfMsg}</Alert>}
          {pdfName && pdfStatus !== 'idle' &&
            <Typography variant="caption" color="text.secondary" sx={{ display:'block', mb:1 }}>📄 {pdfName}</Typography>
          }

          <input ref={fileRef} type="file" accept="application/pdf,.pdf" style={{ display:'none' }} onChange={handleFileChange} />
          <Box sx={{ display:'flex', gap:1 }}>
            <Button variant="contained" startIcon={<PictureAsPdfIcon />} onClick={() => fileRef.current?.click()} sx={{ flex:1 }}>
              Upload AWB PDF
            </Button>
            <Button variant="outlined" color="error" startIcon={<RefreshIcon />} onClick={resetAll}>
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── Shipment Details ─────────────────────────────────── */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Shipment Details
          </Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth error={!!errors.material}>
                <InputLabel id="mat-label">Material</InputLabel>
                <Select labelId="mat-label" label="Material" value={form.material}
                  onChange={e => updateField('material', e.target.value)}>
                  {MATERIALS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
                {errors.material && <Typography variant="caption" color="error" sx={{ mt:0.5, ml:1.75 }}>{errors.material}</Typography>}
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Actual Weight" type="number" value={form.actualWeight}
                onChange={e => updateField('actualWeight', e.target.value)}
                error={!!errors.actualWeight} helperText={errors.actualWeight}
                slotProps={{ htmlInput:{ min:0, step:'any' }, input:{ endAdornment:<InputAdornment position="end">kg</InputAdornment> } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Rate Per Kg" type="number" value={form.ratePerKg}
                onChange={e => updateField('ratePerKg', e.target.value)}
                error={!!errors.ratePerKg} helperText={errors.ratePerKg}
                slotProps={{ htmlInput:{ min:0, step:'any' }, input:{ startAdornment:<InputAdornment position="start">₹</InputAdornment> } }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Carton Groups ────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:2, gap:2, flexWrap:'wrap' }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>Carton Groups</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addGroup}>+ Add Carton Group</Button>
        </Box>
        <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
          {groups.map((g, idx) => {
            const ge = errors.cartonGroups?.[g.id]
            return (
              <Card key={g.id} variant="outlined">
                <CardContent sx={{ p: { xs:2, sm:2.5 } }}>
                  <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight:600 }}>Group {idx+1}</Typography>
                    {groups.length > 1 && (
                      <IconButton onClick={() => removeGroup(g.id)} size="small" color="error">
                        <DeleteOutlinedIcon />
                      </IconButton>
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    {(['length','width','height'] as const).map(f => (
                      <Grid key={f} size={{ xs:12, sm:6, md:3 }}>
                        <TextField fullWidth label={f.charAt(0).toUpperCase()+f.slice(1)} type="number"
                          value={g[f]} onChange={e => updateGroup(g.id, f, e.target.value)}
                          error={!!ge?.[f]} helperText={ge?.[f]}
                          slotProps={{ htmlInput:{ min:0, step:'any' }, input:{ endAdornment:<InputAdornment position="end">cm</InputAdornment> } }} />
                      </Grid>
                    ))}
                    <Grid size={{ xs:12, sm:6, md:3 }}>
                      <TextField fullWidth label="Quantity" type="number"
                        value={g.quantity} onChange={e => updateGroup(g.id, 'quantity', e.target.value)}
                        error={!!ge?.quantity} helperText={ge?.quantity}
                        slotProps={{ htmlInput:{ min:1, step:1 } }} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </Box>

      <Button type="submit" variant="contained" size="large" fullWidth
        startIcon={<CalculateIcon />} sx={{ py:1.5, fontWeight:600, mb:3 }}>
        Calculate
      </Button>

      {/* ── Results ──────────────────────────────────────────── */}
      {results && (
        <Box>
          <Divider sx={{ mb:3 }} />
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight:600, mb:2 }}>Results</Typography>
          <PackingEfficiencyCard score={results.packingEfficiency} />
          <PackingAdvisorCard results={results} />
          {optimization && <SmartPackingOptimizerCard optimization={optimization} />}
          <ExtraFreightAnalysisCard results={results} />
          <ResultCards results={results} />
          <Divider sx={{ my:3 }} />
          <SuggestOptimalSizeCard ratePerKg={Number(form.ratePerKg)} />
        </Box>
      )}
    </Box>
  )
}
