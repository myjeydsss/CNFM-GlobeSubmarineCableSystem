import { MouseEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import { styled, useTheme } from '@mui/material/styles';
import MuiCard, { CardProps } from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import MuiFormControlLabel, {
  FormControlLabelProps
} from '@mui/material/FormControlLabel';
import EyeOutline from 'mdi-material-ui/EyeOutline';
import EyeOffOutline from 'mdi-material-ui/EyeOffOutline';
import Grid from '@mui/material/Grid';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import Swal from 'sweetalert2';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Helmet } from 'react-helmet-async';
import { Link as RouterLink } from 'react-router-dom';

interface User {
  user_fname: string;
  user_lname: string;
  user_email: string;
  user_password: string;
  user_role: string;
}

interface State {
  password: string;
  showPassword: boolean;
}

const Card = styled(MuiCard)<CardProps>(({ theme }) => ({
  width: '90%',
  maxWidth: '28rem',
  [theme.breakpoints.down('sm')]: { width: '100%', padding: theme.spacing(1) }
}));

const SideCard = styled(MuiCard)<CardProps>(({ theme }) => ({
  width: '90%',
  maxWidth: '28rem',
  [theme.breakpoints.down('sm')]: { width: '100%', padding: theme.spacing(2) }
}));

const LinkStyled = styled('a')(({ theme }) => ({
  fontSize: '0.875rem',
  textDecoration: 'none',
  color: theme.palette.primary.main
}));

const FormControlLabel = styled(MuiFormControlLabel)<FormControlLabelProps>(
  ({ theme }) => ({
    '& .MuiFormControlLabel-label': {
      fontSize: '0.875rem',
      color: theme.palette.text.secondary
    }
  })
);

const LoginPage = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { user_id } = useParams<{ user_id: string }>();
  const [user, setUser] = useState<User>({
    user_fname: '',
    user_lname: '',
    user_email: '',
    user_password: '',
    user_role: ''
  });
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;
  // Helper to build login URL safely
  const getLoginUrl = () => {
    console.log('🔍 Environment Variables:', { apiBaseUrl, port });

    if (apiBaseUrl && port) {
      const url = `${apiBaseUrl}${port}/login`;
      console.log('✅ Using full URL with port:', url);
      return url;
    } else if (apiBaseUrl) {
      const url = `${apiBaseUrl}/login`;
      console.log('✅ Using base URL without port:', url);
      return url;
    } else {
      // fallback to relative path
      const url = '/login';
      console.log('⚠️ Using fallback relative path:', url);
      console.log('⚠️ This will likely cause a 404 error - check your .env file!');
      return url;
    }
  };

  const formik = useFormik({
    initialValues: {
      user_email: '',
      user_password: ''
    },
    validationSchema: Yup.object({
      user_email: Yup.string()
        .min(8, 'Username must be at least 8 characters')
        .required('Username is required'),
      user_password: Yup.string().required('Password is required')
    }),
    onSubmit: (values) => {
      handleLogin(values);
    }
  });
  const navigate = useNavigate();
  const handleLogin = async (values: {
    user_email: string;
    user_password: string;
  }) => {
    try {
      const response = await axios.post(getLoginUrl(), values);
      if (response.data.success) {
        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('user_fname', response.data.user_fname);
        localStorage.setItem('user_lname', response.data.user_lname);
        localStorage.setItem('user_id', response.data.user_id);
        localStorage.setItem('user_role', response.data.user_role);

        console.log(response.data.user_role, 'Login Successful!');
        axios.defaults.headers.common['Authorization'] = response.data.user_id;

        // Check if user role is 'User' and deny dashboard access
        if (response.data.user_role === 'User') {
          Swal.fire({
            icon: 'warning',
            title: 'Access Denied',
            text: 'The account you entered does not have access to the dashboard. Redirecting back to home page.',
            confirmButtonColor: '#3854A5'
          }).then(() => {
            navigate('/home');
          });
          return; // Exit early to prevent further navigation logic
        }

        // ✅ SweetAlert for successful login (for authorized roles)
        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: `Welcome back, ${response.data.user_fname}!`,
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          if (response.data.user_role === 'Administrator') {
            navigate('/dashboard/admin');
          } else if (response.data.user_role === 'Simulator') {
            navigate('/dashboard/simulator');
          } else {
            navigate('/home');
          }
        });
      } else {
        // ✅ SweetAlert for invalid login
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: response.data.error,
          confirmButtonColor: '#3854A5'
        });
      }
    } catch (error) {
      console.error('Axios Error:', error);

      // ✅ SweetAlert for server errors
      Swal.fire({
        icon: 'error',
        title: 'Server Error',
        text: 'Something went wrong. Please try again later.'
      });

      if (error.response) {
        console.error('Server Response:', error.response.data);
        console.error('Status Code:', error.response.status);
      } else if (error.request) {
        console.error('No Response Received:', error.request);
      } else {
        console.error('Axios Error Message:', error.message);
      }
    }
  };

  const [values, setValues] = useState<State>({
    password: '',
    showPassword: false
  });

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const handleMouseDownPassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleButtonClick = () => {
    formik.setTouched({ user_email: true, user_password: true });

    if (Object.keys(formik.errors).length === 0) {
      formik.handleSubmit(); // ✅ Only triggers form submission once
    }
  };

  return (
    <>
      <Helmet>
        <title>Login Page</title>
      </Helmet>
      <Box
        className="content-center"
        sx={{
          padding: isSmallScreen ? 4 : 8,
          display: 'flex',
          justifyContent: 'center',
          marginTop: 4
        }}
      >
        <Card>
          <CardContent
            sx={{ padding: (theme) => `${theme.spacing(3, 4, 3)} !important` }}
          >
            <Box
              sx={{
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Grid sx={{ paddingTop: 1, paddingRight: 2 }}>
                <img
                  src="/images/logos/CNFM-LOGO.png"
                  alt="Logo"
                  style={{ paddingTop: 2, paddingLeft: 12, height: '100px' }}
                />
              </Grid>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                Please sign-in to your account to continue
              </Typography>
            </Box>
            <form noValidate autoComplete="off" onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                id="user_email"
                name="user_email"
                label="Username"
                autoComplete="username"
                sx={{
                  marginBottom:
                    formik.touched.user_email && formik.errors.user_email
                      ? 1
                      : 4
                }}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.user_email}
              />
              {formik.touched.user_email && formik.errors.user_email ? (
                <Typography
                  variant="body1"
                  sx={{
                    color: '#db4437',
                    paddingLeft: 1.5,
                    marginBottom: 1
                  }}
                >
                  {formik.errors.user_email}
                </Typography>
              ) : null}
              <FormControl fullWidth>
                <InputLabel htmlFor="password">Password</InputLabel>
                <OutlinedInput
                  id="user_password"
                  name="user_password"
                  label="Password"
                  autoComplete="current-password"
                  sx={{
                    marginBottom:
                      formik.touched.user_password &&
                        formik.errors.user_password
                        ? 1
                        : 4
                  }}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.user_password}
                  type={values.showPassword ? 'text' : 'password'}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        aria-label="toggle password visibility"
                      >
                        {values.showPassword ? (
                          <EyeOutline />
                        ) : (
                          <EyeOffOutline />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {formik.touched.user_password && formik.errors.user_password ? (
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#db4437',
                      paddingLeft: 1.5
                    }}
                  >
                    {formik.errors.user_password}
                  </Typography>
                ) : null}
              </FormControl>
              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                id="login-btn"
                name="login-btn"
                sx={{ marginBottom: 3, marginTop: 1 }}
                onClick={handleButtonClick}
              >
                Login
              </Button>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="body2" sx={{ marginRight: 1 }}>
                  An account will be created for you if you don't have one.
                  Contact your administrator for more information.
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default LoginPage;
