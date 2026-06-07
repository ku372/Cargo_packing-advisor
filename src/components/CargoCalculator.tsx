import { useState, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import CalculateIcon from '@mui/icons-material/Calculate'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { calculateFreight, type FreightResult } from '../utils/calculateFreight'
import { optimizePacking, type PackingOptimization } from '../utils/optimizePacking'
import ExtraFreightAnalysisCard from './ExtraFreightAnalysisCard'
import PackingAdvisorCard from './PackingAdvisorCard'
import PackingEfficiencyCard from './PackingEfficiencyCard'
import ResultCards from './ResultCards'
import SmartPackingOptimizerCard from './SmartPackingOptimizerCard'

const MATERIALS = [
  'Flowers',
  'Fish',
  'Vegetables',
  'Fruits',
  'Textiles',
  'Electronics',
  'Machinery',
  'General Cargo',
  'Pharmaceuticals',
  'Perishable Cargo',
  'Other',
]

type CartonGroupForm = {
  id: string
  length: string
  width: string
  height: string
  quantity: string
}

type FormState = {
  material: string
  actualWeight: string
  ratePerKg: string
}

type CartonGroupErrors = Partial<Record<keyof Omit<CartonGroupForm, 'id'>, string>>

type FormErrors = {
  material?: string
  actualWeight?: string
  ratePerKg?: string
  cartonGroups?: Record<string, CartonGroupErrors>
}

const createCartonGroup = (): CartonGroupForm => ({
  id: crypto.randomUUID(),
  length: '',
  width: '',
  height: '',
  quantity: '1',
})

const initialForm: FormState = {
  material: '',
  actualWeight: '',
  ratePerKg: '',
}

function parsePositive(value: string): number | null {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  return num
}

function validateForm(
  form: FormState,
  cartonGroups: CartonGroupForm[],
): FormErrors {
  const errors: FormErrors = {}

  if (!form.material) errors.material = 'Select a material'

  if (!form.actualWeight.trim()) errors.actualWeight = 'Required'
  else if (parsePositive(form.actualWeight) === null) errors.actualWeight = 'Enter a positive number'

  if (!form.ratePerKg.trim()) errors.ratePerKg = 'Required'
  else if (parsePositive(form.ratePerKg) === null) errors.ratePerKg = 'Enter a positive number'

  const groupErrors: Record<string, CartonGroupErrors> = {}

  cartonGroups.forEach((group) => {
    const groupError: CartonGroupErrors = {}

    if (!group.length.trim()) groupError.length = 'Required'
    else if (parsePositive(group.length) === null) groupError.length = 'Enter a positive number'

    if (!group.width.trim()) groupError.width = 'Required'
    else if (parsePositive(group.width) === null) groupError.width = 'Enter a positive number'

    if (!group.height.trim()) groupError.height = 'Required'
    else if (parsePositive(group.height) === null) groupError.height = 'Enter a positive number'

    if (!group.quantity.trim()) groupError.quantity = 'Required'
    else if (parsePositive(group.quantity) === null) groupError.quantity = 'Enter a positive number'

    if (Object.keys(groupError).length > 0) {
      groupErrors[group.id] = groupError
    }
  })

  if (Object.keys(groupErrors).length > 0) {
    errors.cartonGroups = groupErrors
  }

  return errors
}

function hasFormErrors(errors: FormErrors): boolean {
  return Boolean(
    errors.material ||
      errors.actualWeight ||
      errors.ratePerKg ||
      (errors.cartonGroups && Object.keys(errors.cartonGroups).length > 0),
  )
}

export default function CargoCalculator() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [cartonGroups, setCartonGroups] = useState<CartonGroupForm[]>([createCartonGroup()])
  const [errors, setErrors] = useState<FormErrors>({})
  const [results, setResults] = useState<FreightResult | null>(null)
  const [optimization, setOptimization] = useState<PackingOptimization | null>(null)

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const updateCartonGroup = (id: string, field: keyof Omit<CartonGroupForm, 'id'>, value: string) => {
    setCartonGroups((prev) =>
      prev.map((group) => (group.id === id ? { ...group, [field]: value } : group)),
    )

    if (errors.cartonGroups?.[id]?.[field]) {
      setErrors((prev) => {
        const groupErrors = { ...prev.cartonGroups?.[id] }
        delete groupErrors[field]

        const cartonGroupsErrors = { ...prev.cartonGroups }
        if (Object.keys(groupErrors).length === 0) {
          delete cartonGroupsErrors[id]
        } else {
          cartonGroupsErrors[id] = groupErrors
        }

        return {
          ...prev,
          cartonGroups:
            Object.keys(cartonGroupsErrors).length > 0 ? cartonGroupsErrors : undefined,
        }
      })
    }
  }

  const addCartonGroup = () => {
    setCartonGroups((prev) => [...prev, createCartonGroup()])
  }

  const removeCartonGroup = (id: string) => {
    setCartonGroups((prev) => prev.filter((group) => group.id !== id))
    setErrors((prev) => {
      if (!prev.cartonGroups?.[id]) return prev
      const cartonGroupsErrors = { ...prev.cartonGroups }
      delete cartonGroupsErrors[id]
      return {
        ...prev,
        cartonGroups:
          Object.keys(cartonGroupsErrors).length > 0 ? cartonGroupsErrors : undefined,
      }
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const validationErrors = validateForm(form, cartonGroups)
    if (hasFormErrors(validationErrors)) {
      setErrors(validationErrors)
      setResults(null)
      setOptimization(null)
      return
    }

    const cargoValues = {
      material: form.material,
      actualWeight: Number(form.actualWeight),
      ratePerKg: Number(form.ratePerKg),
      cartonGroups: cartonGroups.map((group) => ({
        length: Number(group.length),
        width: Number(group.width),
        height: Number(group.height),
        quantity: Number(group.quantity),
      })),
    }

    setResults(calculateFreight(cargoValues))
    setOptimization(optimizePacking(cargoValues))
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Shipment Details
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter actual weight and carton dimensions to calculate total volumetric weight and freight
            cost.
          </Typography>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth error={Boolean(errors.material)}>
                <InputLabel id="material-label">Material</InputLabel>
                <Select
                  labelId="material-label"
                  id="material"
                  label="Material"
                  value={form.material}
                  onChange={(e) => updateField('material', e.target.value)}
                >
                  {MATERIALS.map((material) => (
                    <MenuItem key={material} value={material}>
                      {material}
                    </MenuItem>
                  ))}
                </Select>
                {errors.material && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {errors.material}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Actual Weight"
                type="number"
                value={form.actualWeight}
                onChange={(e) => updateField('actualWeight', e.target.value)}
                error={Boolean(errors.actualWeight)}
                helperText={errors.actualWeight}
                slotProps={{
                  htmlInput: { min: 0, step: 'any' },
                  input: {
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Rate Per Kg"
                type="number"
                value={form.ratePerKg}
                onChange={(e) => updateField('ratePerKg', e.target.value)}
                error={Boolean(errors.ratePerKg)}
                helperText={errors.ratePerKg}
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Carton Groups
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addCartonGroup}>
            + Add Carton Group
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {cartonGroups.map((group, index) => {
            const groupErrors = errors.cartonGroups?.[group.id]

            return (
              <Card key={group.id} variant="outlined">
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Group {index + 1}
                    </Typography>
                    {cartonGroups.length > 1 && (
                      <IconButton
                        aria-label={`Remove group ${index + 1}`}
                        onClick={() => removeCartonGroup(group.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteOutlinedIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Length"
                        type="number"
                        value={group.length}
                        onChange={(e) => updateCartonGroup(group.id, 'length', e.target.value)}
                        error={Boolean(groupErrors?.length)}
                        helperText={groupErrors?.length}
                        slotProps={{
                          htmlInput: { min: 0, step: 'any' },
                          input: {
                            endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Width"
                        type="number"
                        value={group.width}
                        onChange={(e) => updateCartonGroup(group.id, 'width', e.target.value)}
                        error={Boolean(groupErrors?.width)}
                        helperText={groupErrors?.width}
                        slotProps={{
                          htmlInput: { min: 0, step: 'any' },
                          input: {
                            endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Height"
                        type="number"
                        value={group.height}
                        onChange={(e) => updateCartonGroup(group.id, 'height', e.target.value)}
                        error={Boolean(groupErrors?.height)}
                        helperText={groupErrors?.height}
                        slotProps={{
                          htmlInput: { min: 0, step: 'any' },
                          input: {
                            endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        type="number"
                        value={group.quantity}
                        onChange={(e) => updateCartonGroup(group.id, 'quantity', e.target.value)}
                        error={Boolean(groupErrors?.quantity)}
                        helperText={groupErrors?.quantity}
                        slotProps={{ htmlInput: { min: 1, step: 1 } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </Box>

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        startIcon={<CalculateIcon />}
        sx={{ py: 1.5, fontWeight: 600, mb: 3 }}
      >
        Calculate
      </Button>

      {results && (
        <Box>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Results
          </Typography>
          <PackingEfficiencyCard score={results.packingEfficiency} />
          <PackingAdvisorCard results={results} />
          {optimization && <SmartPackingOptimizerCard optimization={optimization} />}
          <ExtraFreightAnalysisCard results={results} />
          <ResultCards results={results} />
        </Box>
      )}
    </Box>
  )
}
