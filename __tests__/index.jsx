import React from 'react';
import Application from '@hexlet/react-todo-app-with-backend';
import { render } from '../setupTests.js';

// Page object pattern!!!!

const preloadedState = {
  currentListId: 1,
  lists: [
    { id: 1, name: 'primary', removable: false },
    { id: 2, name: 'secondary', removable: true },
  ],
  tasks: [],
};

test('Shows the application.', async () => {
  const { getByText } = render(<Application { ...preloadedState } />);

  expect(getByText('Hexlet Todos')).toBeVisible();
});
