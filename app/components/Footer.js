import { Box, Container, Typography, Link } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        backgroundColor: '#f5f6f7',
        color: '#214d22',
        pt: 2,
        pb: 2,
        mt: 8,
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: 0 }}>
        <Typography variant="body2" align="center">
          @EasyTrack | The Walking Dev
        </Typography>
      </Container>
    </Box>
  );
} 