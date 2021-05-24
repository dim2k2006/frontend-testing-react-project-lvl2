import React from 'react';
import Application from '@hexlet/react-todo-app-with-backend';
import { render } from '../setupTests.js';

// Page object pattern!!!!

test('Shows the application.', async () => {
  const { getAllByText } = render(<Application />);

  expect(getAllByText('Hexlet Todos')).toBeVisible();
});
