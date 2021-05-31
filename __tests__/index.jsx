import React from 'react';
import Application from '@hexlet/react-todo-app-with-backend';
import { v4 as uuidV4 } from 'uuid';
import faker from 'faker';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';
import { render, waitFor } from '../setupTests.js';

const server = setupServer();

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

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

test('Shows the application.', async () => {
  const preloadedState = buildPreloadedState();
  const { getByText } = render(<Application { ...preloadedState } />);

  expect(getByText('Hexlet Todos')).toBeVisible();
});

test('Creates a task.', async () => {
  const listId = '1';
  const list = buildList({ id: listId, name: 'primary', removable: false });
  const preloadedState = buildPreloadedState({ lists: [list] });
  const taskText = faker.lorem.word();

  server.use(
    rest.post('/api/v1/lists/:listId/tasks', (req, res, ctx) => {
      const task = buildTask({ text: req.body.text, listId: Number(req.params.listId) });

      return res(
        ctx.json(task),
      );
    }),
  );

  const { getByPlaceholderText, getByText } = render(<Application { ...preloadedState } />);

  userEvent.type(getByPlaceholderText('Please type text...'), taskText);

  userEvent.click(getByText('Add'));

  await waitFor(() => {
    expect(getByText(taskText)).toBeVisible();
  });
});

test('Updates a task.', async () => {
  const list = buildList({ name: 'primary', removable: false });
  const task = buildTask({ listId: list.id });
  const preloadedState = buildPreloadedState({
    currentListId: list.id,
    lists: [list],
    tasks: [task],
  });

  server.use(
    rest.patch('/api/v1/tasks/:taskId', (req, res, ctx) => {
      const { completed } = req.body;
      const newTask = { ...task, completed, touched: Date.now() };

      return res(
        ctx.json(newTask),
      );
    }),
  );

  const { getByLabelText, getByRole } = render(<Application { ...preloadedState } />);

  const taskLabel = getByLabelText(task.text);
  const checkbox = getByRole('checkbox', { name: new RegExp(task.text) });

  userEvent.click(taskLabel);

  await waitFor(() => {
    expect(checkbox).toBeChecked();
  });
});
