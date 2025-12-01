import { Fragment, MouseEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
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

interface State {
  user_password: string;
  showPassword: boolean;
}

const Card = styled(MuiCard)<CardProps>(({ theme }) => ({
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

const RegisterPage = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;

  const formik = useFormik({
    initialValues: {
      user_fname: '',
      user_lname: '',
      user_email: '',
      user_password: '',
      confirmPassword: ''
    },
    validationSchema: Yup.object({
      user_fname: Yup.string().required('First Name is required'),
      user_lname: Yup.string().required('Last Name is required'),
      user_email: Yup.string()
        .min(8, 'Username must be at least 8 characters')
        .max(16, 'Username must be less than 16 characters')
        .required('Username is required'),
      user_password: Yup.string()
        .min(8, 'Password must be at least 8 characters long')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('user_password')], 'Passwords must match')
        .required('Confirm Password is required')
    }),
    onSubmit: (values) => {
      handleAddItem(values);
    }
  });
  //http://localhost/cnfm-php-api/register?action=register
  const navigate = useNavigate();
  const handleAddItem = async (values) => {
    const isValid = await formik.validateForm();

    if (Object.keys(isValid).length === 0) {
      try {
        const response = await axios.post(
          `${apiBaseUrl}${port}/register`,
          values,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Response:', response); // Check if the response is valid

        if (response.status === 200 && response.data.status === 1) {
          Swal.fire({
            title: 'Registered Successfully',
            text: 'You can now log in with your account',
            icon: 'success',
            confirmButtonColor: '#3854A5'
          }).then(() => {
            navigate('/');
          });
        } else {
          throw new Error(
            response.data.message || 'Unexpected response status'
          );
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          Swal.fire({
            title: 'Error',
            text: 'User already exists. Please use a different user credentials.',
            icon: 'error',
            confirmButtonColor: '#3854A5',
            preConfirm: () => {
              window.location.reload();
            }
          });
        } else if (error.response && error.response.status === 500) {
          navigate('/status/500');
        }
      }
    } else {
      formik.setTouched({
        user_fname: true,
        user_lname: true,
        user_email: true,
        user_password: true,
        confirmPassword: true
      });
    }
  };

  const [values, setValues] = useState<State>({
    user_password: '',
    showPassword: false
  });

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const handleMouseDownPassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <>
      <Helmet>
        <title>Sign Up Page</title>
      </Helmet>
      <Box
        className="content-center"
        sx={{
          padding: isSmallScreen ? 4 : 8,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Card>
          <CardContent
            sx={{ padding: (theme) => `${theme.spacing(4, 5, 4)} !important` }}
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
                Sign up here to create your account
              </Typography>
            </Box>
            <form noValidate autoComplete="off" onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                id="user_fname"
                name="user_fname"
                label="First Name"
                autoComplete="given-name"
                sx={{
                  marginBottom:
                    formik.touched.user_fname && formik.errors.user_fname
                      ? 1
                      : 4
                }}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.user_fname}
              />
              {formik.touched.user_fname && formik.errors.user_fname ? (
                <Typography
                  variant="body1"
                  sx={{
                    color: '#db4437',
                    paddingLeft: 1.5,
                    marginBottom: 1
                  }}
                >
                  {formik.errors.user_fname}
                </Typography>
              ) : null}
              <TextField
                fullWidth
                id="user_lname"
                name="user_lname"
                label="Last Name"
                autoComplete="family-name"
                sx={{
                  marginBottom:
                    formik.touched.user_lname && formik.errors.user_lname
                      ? 1
                      : 4
                }}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.user_lname}
              />
              {formik.touched.user_lname && formik.errors.user_lname ? (
                <Typography
                  variant="body1"
                  sx={{
                    color: '#db4437',
                    paddingLeft: 1.5,
                    marginBottom: 1
                  }}
                >
                  {formik.errors.user_lname}
                </Typography>
              ) : null}
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
                  autoComplete="new-password"
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
                      paddingLeft: 1.5,
                      marginBottom: 1
                    }}
                  >
                    {formik.errors.user_password}
                  </Typography>
                ) : null}
              </FormControl>
              <FormControl fullWidth>
                <InputLabel htmlFor="confirmPassword">
                  Confirm Password
                </InputLabel>
                <OutlinedInput
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  sx={{
                    marginBottom:
                      formik.touched.confirmPassword &&
                      formik.errors.confirmPassword
                        ? 1
                        : 4
                  }}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.confirmPassword}
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
                {formik.touched.confirmPassword &&
                formik.errors.confirmPassword ? (
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#db4437',
                      paddingLeft: 1.5,
                      marginBottom: 1
                    }}
                  >
                    {formik.errors.confirmPassword}
                  </Typography>
                ) : null}
              </FormControl>
              <Box
                sx={{
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between'
                }}
              ></Box>
              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                sx={{ marginBottom: 3 }}
                onClick={handleAddItem}
              >
                Sign up
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
                  Already have an account?
                </Typography>
                <Typography variant="subtitle2">
                  <LinkStyled href="/">Sign in instead</LinkStyled>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default RegisterPage;
