import { useEffect, useRef, useState } from 'react';
import { NavLink, Link as RouterLink, useNavigate } from 'react-router-dom';

import {
  Avatar,
  Box,
  Button,
  Divider,
  Hidden,
  lighten,
  List,
  ListItem,
  ListItemText,
  Popover,
  Typography
} from '@mui/material';

import { styled } from '@mui/material/styles';
import ExpandMoreTwoToneIcon from '@mui/icons-material/ExpandMoreTwoTone';
import LockOpenTwoToneIcon from '@mui/icons-material/LockOpenTwoTone';
import PasswordIcon from '@mui/icons-material/Password';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

const UserBoxButton = styled(Button)(
  ({ theme }) => `
        padding-left: ${theme.spacing(1)};
        padding-right: ${theme.spacing(1)};
`
);

const MenuUserBox = styled(Box)(
  ({ theme }) => `
        background: ${theme.colors.alpha.black[5]};
        padding: ${theme.spacing(2)};
`
);

const UserBoxText = styled(Box)(
  ({ theme }) => `
        text-align: left;
        padding-left: ${theme.spacing(1)};
`
);

const UserBoxLabel = styled(Typography)(
  ({ theme }) => `
        font-weight: ${theme.typography.fontWeightBold};
        color: ${theme.palette.secondary.main};
        display: block;
`
);

const UserBoxDescription = styled(Typography)(
  ({ theme }) => `
        color: ${lighten(theme.palette.secondary.main, 0.5)}
`
);

function HeaderUserbox() {
  const ngalan = localStorage.getItem('user_fname');
  const apilyedo = localStorage.getItem('user_lname');
  const role = localStorage.getItem('user_role');
  const user = {
    user_fname: ngalan,
    user_lname: apilyedo,
    avatar: '/images/logos/CNFM-LOGO.png',
    jobtitle: role
  };

  const ref = useRef<any>(null);
  const [isOpen, setOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  // Check if user is Administrator
  const isAdministrator = role === 'Administrator';

  const handleOpen = (): void => {
    setOpen(true);
  };

  const handleClose = (): void => {
    setOpen(false);
  };

  const handleSignOut = (): void => {
    localStorage.clear();
    console.clear();
    navigate('/');
  };

  const getUserName = () => {
    if (!user.user_fname || !user.user_lname) {
      return 'Blank';
    }
    return `${user.user_fname} ${user.user_lname}`;
  };

  return (
    <>
      <UserBoxButton color="secondary" ref={ref} onClick={handleOpen}>
        <Avatar variant="rounded" alt="avatar" src={user.avatar} />
        <Hidden mdDown>
          <UserBoxText>
            <UserBoxLabel variant="body1">{getUserName()}</UserBoxLabel>
            <UserBoxDescription variant="body2">
              {user.jobtitle}
            </UserBoxDescription>
          </UserBoxText>
        </Hidden>
        <Hidden smDown>
          <ExpandMoreTwoToneIcon sx={{ ml: 1 }} />
        </Hidden>
      </UserBoxButton>
      <Popover
        anchorEl={ref.current}
        onClose={handleClose}
        open={isOpen}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuUserBox sx={{ minWidth: 210 }} display="flex">
          <Avatar variant="rounded" alt={user.user_fname} src={user.avatar} />
          <UserBoxText>
            <UserBoxLabel variant="body1">{user.user_fname}</UserBoxLabel>
            <UserBoxDescription variant="body2">
              {user.jobtitle}
            </UserBoxDescription>
          </UserBoxText>
        </MenuUserBox>
        <Divider sx={{ mb: 0 }} />
        {/* Only show Change Password option for Administrators */}
        {isAdministrator && (
          <List sx={{ p: 1 }} component="nav">
            <ListItem button to="/change-password" component={NavLink}>
              <PasswordIcon fontSize="small" />
              <ListItemText primary="Change Password" />
            </ListItem>

            {/* Uncomment if you want to add Manage Accounts for Administrators only */}
            {/* {isAdministrator && (
            <ListItem button to="/manage-accounts" component={NavLink}>
              <ManageAccountsIcon fontSize="small" />
              <ListItemText primary="Manage Accounts" />
            </ListItem>
          )} */}
          </List>
        )}
        <Divider />
        <Box sx={{ m: 1 }}>
          <Button color="primary" fullWidth onClick={handleSignOut}>
            <LockOpenTwoToneIcon sx={{ mr: 1 }} />
            Sign out
          </Button>
        </Box>
      </Popover>
    </>
  );
}

export default HeaderUserbox;
