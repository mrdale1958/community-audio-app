import React from 'react';
import { Schedule, CheckCircle, Error } from '@mui/icons-material';

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'error';
    case 'PROCESSING': return 'warning';
    default: return 'default';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'APPROVED': return React.createElement(CheckCircle);
    case 'REJECTED': return React.createElement(Error);
    case 'PROCESSING': return React.createElement(Schedule);
    default: return React.createElement(Schedule);
  }
};