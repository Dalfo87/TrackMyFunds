// client/src/components/layout/Sidebar.tsx

import React from 'react';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Portafoglio', icon: <AccountBalanceWalletIcon />, path: '/portfolio' },
    { text: 'Transazioni', icon: <SwapHorizIcon />, path: '/transactions' },
    { text: 'Analisi', icon: <AssessmentIcon />, path: '/analytics' },
    { text: 'Impostazioni', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text} 
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </>
  );
};

export default Sidebar;