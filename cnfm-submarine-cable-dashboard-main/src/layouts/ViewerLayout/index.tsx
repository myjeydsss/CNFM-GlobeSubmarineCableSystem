import { FC, ReactNode } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

interface SidebarLayoutProps {
  children?: ReactNode;
}

const SidebarLayout: FC<SidebarLayoutProps> = () => {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      <Outlet />
    </Box>
  );
};

export default SidebarLayout;
