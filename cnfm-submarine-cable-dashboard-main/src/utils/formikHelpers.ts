import { FormikErrors, FormikTouched } from 'formik';
import { ReactNode } from 'react';

/**
 * Safely converts a Formik error to a ReactNode
 * Handles string, string[], FormikErrors, and FormikErrors[] types
 */
export const getFormikErrorText = (
  error: string | string[] | FormikErrors<any> | FormikErrors<any>[] | undefined
): ReactNode => {
  if (!error) return '';
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (Array.isArray(error)) {
    // Handle string[] or FormikErrors<any>[]
    const firstError = error[0];
    if (typeof firstError === 'string') {
      return firstError;
    }
    if (typeof firstError === 'object' && firstError !== null) {
      // Get first error from nested object
      const values = Object.values(firstError);
      return values.length > 0 ? String(values[0]) : '';
    }
  }
  
  if (typeof error === 'object' && error !== null) {
    // Handle FormikErrors<any> (nested object)
    const values = Object.values(error);
    return values.length > 0 ? String(values[0]) : '';
  }
  
  return String(error);
};

/**
 * Check if a Formik error exists and should be displayed
 */
export const hasFormikError = (
  touched: boolean | FormikTouched<any> | FormikTouched<any>[] | undefined,
  error: string | string[] | FormikErrors<any> | FormikErrors<any>[] | undefined
): boolean => {
  const isTouched = typeof touched === 'boolean' ? touched : Boolean(touched);
  return Boolean(isTouched && error);
};
