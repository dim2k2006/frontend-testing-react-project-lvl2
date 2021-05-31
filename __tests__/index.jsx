import React from 'react';
import Application from '@hexlet/react-todo-app-with-backend';
import { v4 as uuidV4 } from 'uuid';
import faker from 'faker';
import { render } from '../setupTests.js';

const buildList = (props = {}) => {
  const {
    id = uuidV4(),
    name = faker.lorem.word(),
    removable = true,
  } = props;

  const list = { id, name, removable };

  return list;
};

const buildTask = (props = {}) => {
  const {
    id = uuidV4(),
    listId = null,
    text = faker.lorem.word(),
    completed = false,
    touched = Date.now(),
  } = props;

  const task = {
    id,
    listId,
    text,
    completed,
    touched,
  };

  return task;
};

const buildPreloadedState = (props = {}) => {
  const {
    currentListId = 1,
    lists = [
      buildList({ name: 'primary', removable: false }),
      buildList({ name: 'secondary' }),
    ],
    tasks = [],
  } = props;

  const preloadedState = { currentListId, lists, tasks };

  return preloadedState;
};

test('Shows the application.', async () => {
  const preloadedState = buildPreloadedState();
  const { getByText } = render(<Application { ...preloadedState } />);

  expect(getByText('Hexlet Todos')).toBeVisible();
});
