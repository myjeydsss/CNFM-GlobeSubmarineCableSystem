import {
  Box,
  Card,
  Typography,
  Container,
  Divider,
  Button,
  FormControl,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';

import { styled } from '@mui/material/styles';
import Footer from 'src/components/Footer';
import { useNavigate } from 'react-router-dom';

const MainContent = styled(Box)(
  ({ theme }) => `
    height: 100%;
    display: flex;
    flex: 1;
    overflow: auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`
);

const OutlinedInputWrapper = styled(OutlinedInput)(
  ({ theme }) => `
    background-color: ${theme.colors.alpha.white[100]};
`
);

const ButtonSearch = styled(Button)(
  ({ theme }) => `
    margin-right: -${theme.spacing(1)};
`
);

function Status401() {
  const navigate = useNavigate();

  function handleGoBack() {
    navigate(-2);
  }
  return (
    <>
      <Helmet>
        <title>Status - 401</title>
      </Helmet>
      <MainContent>
        <Container maxWidth="md">
          <Box textAlign="center">
            <img alt="401" height={300} src="/static/images/status/401.svg" />
            <Typography variant="h2" sx={{ my: 2 }}>
              You are not authorized to access this page.
            </Typography>
            <Typography
              variant="h4"
              color="text.secondary"
              fontWeight="normal"
              sx={{ mb: 4 }}
            >
              Sign-in to your account to gain access. Thank you.
            </Typography>
          </Box>
          <Container maxWidth="sm">
            <Card sx={{ textAlign: 'center', mt: 3, p: 4 }}>
              <Button onClick={handleGoBack} variant="outlined">
                Go Back
              </Button>
            </Card>
            <Divider sx={{ my: 4 }} />
            <Footer />
          </Container>
        </Container>
      </MainContent>
    </>
  );
}

export default Status401;
