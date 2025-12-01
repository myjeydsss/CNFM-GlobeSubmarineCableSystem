import { Box, alpha, lighten, styled, useTheme, Button } from '@mui/material';
import HeaderUserbox from './Userbox';

const HeaderWrapper = styled(Box)(
  ({ theme }) => `
        height: ${theme.header.height};
        color: ${theme.header.textColor};
        padding: ${theme.spacing(0, 5)};
        right: 0;
        z-index: 6;
        background-color: ${alpha(theme.header.background, 0.95)};
        backdrop-filter: blur(3px);
        position: fixed;
        justify-content: space-between;
        width: 100%;
        @media (min-width: ${theme.breakpoints.values.lg}px) {
           
        }
`
);

const LogoWrapper = styled(Box)(
  ({ theme }) => `
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2.5)};
    
    img {
      height: auto;
      max-height: ${theme.spacing(10)};
      width: auto;
      max-width: ${theme.spacing(18)};
      object-fit: contain;
    }
`
);

function Header() {
  const theme = useTheme();

  return (
    <HeaderWrapper
      display="flex"
      alignItems="center"
      sx={{
        boxShadow:
          theme.palette.mode === 'dark'
            ? `0 1px 0 ${alpha(
                lighten(theme.colors.primary.main, 0.7),
                0.15
              )}, 0px 2px 8px -3px rgba(0, 0, 0, 0.2), 0px 5px 22px -4px rgba(0, 0, 0, .1)`
            : `0px 2px 8px -3px ${alpha(
                theme.colors.alpha.black[100],
                0.2
              )}, 0px 5px 22px -4px ${alpha(
                theme.colors.alpha.black[100],
                0.1
              )}`
      }}
    >
      <LogoWrapper>
        <img alt="Globe Telco Logo" src="/images/logos/GlobeLogoDark.png" />
      </LogoWrapper>
      <Box display="flex" alignItems="center">
        <HeaderUserbox />
      </Box>
    </HeaderWrapper>
  );
}

export default Header;
