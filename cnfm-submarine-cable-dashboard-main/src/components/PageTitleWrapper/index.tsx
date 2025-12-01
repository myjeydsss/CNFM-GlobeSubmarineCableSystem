import { FC, ReactNode } from 'react';
import { Box, Container, styled } from '@mui/material';

const PageTitle = styled(Box)(
  ({ theme }) => `
        padding: ${theme.spacing(3)};
`
);

interface PageTitleWrapperProps {
  children?: ReactNode;
}

const PageTitleWrapper: FC<PageTitleWrapperProps> = ({ children }) => {
  return (
    <PageTitle className="MuiPageTitle-wrapper">
      <Container maxWidth="lg">{children}</Container>
    </PageTitle>
  );
};

export default PageTitleWrapper;

