import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Divider,
  OutlinedInput,
  IconButton,
  Tooltip,
  FormControl,
  InputAdornment,
  Button,
  FormHelperText
} from '@mui/material';
import { Helmet } from 'react-helmet-async';

import { styled } from '@mui/material/styles';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import MailTwoToneIcon from '@mui/icons-material/MailTwoTone';
import Footer from 'src/components/Footer';
import LockOpenTwoToneIcon from '@mui/icons-material/LockOpenTwoTone';
import { useNavigate } from 'react-router-dom';

const MainContent = styled(Box)(
  () => `
    height: 100%;
    display: flex;
    flex: 1;
    overflow: auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`
);

const TypographyH1 = styled(Typography)(
  ({ theme }) => `
  font-size: ${theme.typography.pxToRem(75)};
`
);

const TypographyH3 = styled(Typography)(
  ({ theme }) => `
  color: ${theme.colors.alpha.black[50]};
`
);

const OutlinedInputWrapper = styled(OutlinedInput)(
  ({ theme }) => `
    background-color: ${theme.colors.alpha.white[100]};
`
);

const ButtonNotify = styled(Button)(
  ({ theme }) => `
    margin-right: -${theme.spacing(1)};
`
);

function StatusComingSoon() {
  {
    /*const calculateTimeLeft = () => {
    const difference = +new Date(`2024`) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
  });

  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval]) {
      return;
    }

    timerComponents.push(
      <Box textAlign="center" px={3}>
        <TypographyH1 variant="h1">{timeLeft[interval]}</TypographyH1>
        <TypographyH3 variant="h3">{interval}</TypographyH3>
      </Box>
    );
  });*/
  }
  const navigate = useNavigate();
  const handleSignOut = (): void => {
    localStorage.clear();
    console.clear();
    navigate('/login');
  };

  return (
    <>
      <Helmet>
        <title>Status - Coming Soon</title>
      </Helmet>
      <MainContent>
        <Container maxWidth="md">
          <Box textAlign="center" mb={3}>
            <Container maxWidth="xs">
              <Typography variant="h1" sx={{ mt: 4, mb: 2 }}>
                Coming Soon
              </Typography>
              <Typography
                variant="h4"
                color="text.secondary"
                fontWeight="normal"
                sx={{ mb: 2 }}
              >
                Public access is not yet available. This is currently intended
                for the Barangay Catalunan Pequeño response team and officials.
              </Typography>
            </Container>
            <img
              alt="Coming Soon"
              height={260}
              src="/static/images/status/coming-soon.svg"
            />
          </Box>

          {/*<Box display="flex" justifyContent="center">
            {timerComponents.length ? timerComponents : <>Time's up!</>}
          </Box>*/}

          <Container maxWidth="sm">
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <FormControl variant="outlined" fullWidth>
                {/*<OutlinedInputWrapper
                  type="text"
                  placeholder="Enter your email address here..."
                  endAdornment={
                    <InputAdornment position="end">
                      <ButtonNotify variant="contained" size="small">
                        Notify Me
                      </ButtonNotify>
                    </InputAdornment>
                  }
                  startAdornment={
                    <InputAdornment position="start">
                      <MailTwoToneIcon />
                    </InputAdornment>
                  }
                />*/}
                <FormHelperText sx={{ textAlign: 'center' }}>
                  We'll email you once public access is launched!
                </FormHelperText>
                <Box sx={{ m: 1 }}>
                  <Button color="primary" fullWidth onClick={handleSignOut}>
                    <LockOpenTwoToneIcon sx={{ mr: 1 }} />
                    Sign out
                  </Button>
                </Box>
              </FormControl>
              <Divider sx={{ my: 2 }} />
              <Footer />
              <Box sx={{ textAlign: 'center' }}>
                {/*<Tooltip arrow placement="top" title="Facebook">
                  <IconButton color="primary">
                    <FacebookIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip arrow placement="top" title="Twitter">
                  <IconButton color="primary">
                    <TwitterIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip arrow placement="top" title="Instagram">
                  <IconButton color="primary">
                    <InstagramIcon />
                  </IconButton>
                </Tooltip>*/}
              </Box>
            </Box>
          </Container>
        </Container>
      </MainContent>
    </>
  );
}

export default StatusComingSoon;
