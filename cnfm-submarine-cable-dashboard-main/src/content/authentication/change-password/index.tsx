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
  FormHelperText,
  InputLabel
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { getFormikErrorText } from '../../../utils/formikHelpers';
import Footer from 'src/components/Footer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

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

// Validation schema
const changePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required')
    .min(6, 'Password must be at least 6 characters'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'New password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: Yup.string()
    .required('Please confirm your new password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
});

function ChangePassword() {
  const navigate = useNavigate();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;
  const handleGoBack = (): void => {
    navigate(-1);
  };

  const handleClickShowCurrentPassword = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const handleClickShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChangePassword = async (values, { setSubmitting, resetForm }) => {
    try {
      const userId = localStorage.getItem('user_id');

      const response = await axios.post(
        `${apiBaseUrl}${port}/change-password`,
        {
          user_id: userId,
          current_password: values.currentPassword,
          new_password: values.newPassword
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Password Changed',
          text: 'Your password has been updated successfully.',
          confirmButtonColor: '#3854A5'
        }).then(() => {
          resetForm();
          navigate(-1);
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Change Password',
          text:
            response.data.error ||
            'Unable to change password. Please try again.',
          confirmButtonColor: '#3854A5'
        });
      }
    } catch (error) {
      // Handle different HTTP status codes with specific error messages
      let errorTitle = 'Server Error';
      let errorMessage = 'Something went wrong. Please try again later.';

      if (error.response) {
        const statusCode = error.response.status;
        const errorData = error.response.data;

        switch (statusCode) {
          case 400:
            errorTitle = 'Invalid Request';
            errorMessage =
              errorData.error || 'Please check your input and try again.';
            break;
          case 401:
            errorTitle = 'Unauthorized';
            errorMessage = 'You are not authorized to perform this action.';
            break;
          case 404:
            errorTitle = 'User Not Found';
            errorMessage = 'The user account could not be found.';
            break;
          case 500:
            errorTitle = 'Server Error';
            errorMessage = 'Internal server error. Please try again later.';
            break;
          default:
            errorTitle = `Error ${statusCode}`;
            errorMessage = errorData.error || 'An unexpected error occurred.';
        }
      } else if (error.request) {
        errorTitle = 'Network Error';
        errorMessage =
          'Unable to connect to the server. Please check your internet connection.';
      } else {
        errorTitle = 'Request Error';
        errorMessage = 'Failed to send request. Please try again.';
      }

      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: '#3854A5'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Change Password</title>
      </Helmet>
      <MainContent>
        <Container maxWidth="md">
          <Box textAlign="center" mb={3}>
            <Typography variant="h3" component="h1" gutterBottom>
              Change Password
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Update your account password
            </Typography>
          </Box>

          <Container maxWidth="sm">
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <FormControl variant="outlined" fullWidth>
                <Box sx={{ m: 1 }}>
                  <Button color="primary" fullWidth onClick={handleGoBack}>
                    <ArrowBackIcon sx={{ mr: 1 }} />
                    Go Back
                  </Button>
                </Box>
              </FormControl>

              <Divider sx={{ my: 3 }} />

              <Formik
                initialValues={{
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                }}
                validationSchema={changePasswordSchema}
                onSubmit={handleChangePassword}
              >
                {({
                  errors,
                  touched,
                  isSubmitting,
                  handleChange,
                  handleBlur,
                  values
                }) => (
                  <Form>
                    <Box sx={{ mb: 3 }}>
                      <FormControl
                        variant="outlined"
                        fullWidth
                        error={
                          !!(errors.currentPassword && touched.currentPassword)
                        }
                      >
                        <InputLabel htmlFor="currentPassword">
                          Current Password
                        </InputLabel>
                        <OutlinedInput
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={values.currentPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowCurrentPassword}
                                edge="end"
                              >
                                {showCurrentPassword ? (
                                  <VisibilityOff />
                                ) : (
                                  <Visibility />
                                )}
                              </IconButton>
                            </InputAdornment>
                          }
                          label="Current Password"
                        />
                        {errors.currentPassword && touched.currentPassword && (
                          <FormHelperText>
                            {getFormikErrorText(errors.currentPassword)}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <FormControl
                        variant="outlined"
                        fullWidth
                        error={!!(errors.newPassword && touched.newPassword)}
                      >
                        <InputLabel htmlFor="newPassword">
                          New Password
                        </InputLabel>
                        <OutlinedInput
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={values.newPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowNewPassword}
                                edge="end"
                              >
                                {showNewPassword ? (
                                  <VisibilityOff />
                                ) : (
                                  <Visibility />
                                )}
                              </IconButton>
                            </InputAdornment>
                          }
                          label="New Password"
                        />
                        {errors.newPassword && touched.newPassword && (
                          <FormHelperText>{getFormikErrorText(errors.newPassword)}</FormHelperText>
                        )}
                      </FormControl>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <FormControl
                        variant="outlined"
                        fullWidth
                        error={
                          !!(errors.confirmPassword && touched.confirmPassword)
                        }
                      >
                        <InputLabel htmlFor="confirmPassword">
                          Confirm New Password
                        </InputLabel>
                        <OutlinedInput
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={values.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowConfirmPassword}
                                edge="end"
                              >
                                {showConfirmPassword ? (
                                  <VisibilityOff />
                                ) : (
                                  <Visibility />
                                )}
                              </IconButton>
                            </InputAdornment>
                          }
                          label="Confirm New Password"
                        />
                        {errors.confirmPassword && touched.confirmPassword && (
                          <FormHelperText>
                            {getFormikErrorText(errors.confirmPassword)}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Box>

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={isSubmitting}
                      sx={{ mt: 2, mb: 2, py: 1.5 }}
                    >
                      {isSubmitting
                        ? 'Changing Password...'
                        : 'Change Password'}
                    </Button>
                  </Form>
                )}
              </Formik>

              <Divider sx={{ my: 2 }} />
              <Footer />
            </Box>
          </Container>
        </Container>
      </MainContent>
    </>
  );
}

export default ChangePassword;
