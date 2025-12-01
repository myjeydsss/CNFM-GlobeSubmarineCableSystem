import { alpha, Avatar, Box, styled, Typography } from '@mui/material';

const Header = () => {
  return (
    <Box
      textAlign="center"
      py={1}
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
    >
      <Typography variant="h4">International Submarine Cable System</Typography>
    </Box>
  );
};

export default Header;
