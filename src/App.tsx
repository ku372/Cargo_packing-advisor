import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import CargoCalculator from './components/CargoCalculator'
import Layout from './components/Layout'

export default function App() {
  return (
    <Layout>
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: { xs: 4, md: 5 },
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Cargo Packing Calculator
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 520 }}>
            Calculate volumetric weight, chargeable weight, and freight cost for your shipment.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 } }}>
        <CargoCalculator />
      </Container>
    </Layout>
  )
}
