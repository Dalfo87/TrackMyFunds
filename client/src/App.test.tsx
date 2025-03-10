// src/App.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter} from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

test('renders learn react link', () => {
  render(<App />);
  // Modifica la tua aspettativa in base a quello che l'App realmente fa
  const headerElement = screen.getByText(/TrackMy Funds/i);
  expect(headerElement).toBeInTheDocument();
});