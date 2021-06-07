import React from 'react';
import Application from '@hexlet/react-todo-app-with-backend';
import faker from 'faker';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';
import {
  render,
  waitFor,
  buildList,
  buildTask,
  buildPreloadedState,
} from '../setupTests.js';

const server = setupServer();

const selectors = {
  addTaskButton: '.row .col-3 form button',
  deleteListButton: (listIndex) => `.row .col-3 ul li:nth-child(${listIndex}) button:last-child`,
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

  const { findByText, getByRole } = render(<Application { ...preloadedState } />);

  userEvent.type(getByRole('textbox', { name: /new task/i }), taskText);

  userEvent.click(getByRole('button', { name: /add/i }));

  expect(await findByText(taskText)).toBeVisible();
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

  const { getByRole, findByRole } = render(<Application { ...preloadedState } />);

  userEvent.click(getByRole('checkbox', { name: new RegExp(task.text) }));

  expect(await findByRole('checkbox', { name: new RegExp(task.text) })).toBeVisible();
  expect(await findByRole('checkbox', { name: new RegExp(task.text) })).toBeChecked();
});

test('Deletes a task.', async () => {
  const list = buildList({ name: 'primary', removable: false });
  const task = buildTask({ listId: list.id });
  const preloadedState = buildPreloadedState({
    currentListId: list.id,
    lists: [list],
    tasks: [task],
  });

  server.use(
    rest.delete('/api/v1/tasks/:taskId', (req, res, ctx) => res(
      ctx.status(204),
    )),
  );

  const { getByRole, findByText, queryByText } = render(<Application { ...preloadedState } />);

  expect(await findByText(task.text)).toBeVisible();

  userEvent.click(getByRole('button', { name: /remove/i }));

  await waitFor(() => expect(queryByText(task.text)).toBeNull());
});

test('Does not remove tasks with equal names from different lists.', async () => {
  const list1 = buildList({ name: 'primary' });
  const list2 = buildList({ name: 'secondary' });
  const taskText = faker.lorem.word();
  const task1 = buildTask({ listId: list1.id, text: taskText });
  const task2 = buildTask({ listId: list2.id, text: taskText });
  const preloadedState = buildPreloadedState({
    currentListId: list1.id,
    lists: [list1, list2],
    tasks: [task1, task2],
  });

  server.use(
    rest.delete('/api/v1/tasks/:taskId', (req, res, ctx) => res(
      ctx.status(204),
    )),
  );

  const { getByRole, findByText, queryByText } = render(<Application { ...preloadedState } />);

  userEvent.click(getByRole('button', { name: /remove/i }));

  await waitFor(() => expect(queryByText(taskText)).toBeNull());

  userEvent.click(getByRole('button', { name: /secondary/i }));

  expect(await findByText(taskText)).toBeVisible();
});

test('Does not recover tasks from recovered list.', async () => {
  const list = buildList({ name: 'primary' });
  const task1 = buildTask();
  const task2 = buildTask();
  const preloadedState = buildPreloadedState({
    currentListId: list.id,
    lists: [list],
    tasks: [task1, task2],
  });

  server.use(
    rest.delete('/api/v1/lists/:id', (req, res, ctx) => res(
      ctx.status(204),
    )),
    rest.post('/api/v1/lists', (req, res, ctx) => {
      const { name } = req.body;
      const newList = buildList({ name });

      return res(
        ctx.json(newList),
      );
    }),
  );

  const { getByRole, queryByText, container } = render(<Application { ...preloadedState } />);

  const deleteListButton = container.querySelector(selectors.deleteListButton(1));

  userEvent.click(deleteListButton);

  await waitFor(() => expect(queryByText(list.name)).toBeNull());
  await waitFor(() => expect(queryByText(task1.text)).toBeNull());
  await waitFor(() => expect(queryByText(task2.text)).toBeNull());

  userEvent.type(getByRole('textbox', { name: /new list/i }), list.name);

  const addTaskButton = container.querySelector(selectors.addTaskButton);

  userEvent.click(addTaskButton);

  await waitFor(() => expect(queryByText(list.name)).toBeVisible());
  await waitFor(() => expect(queryByText(task1.text)).toBeNull());
  await waitFor(() => expect(queryByText(task2.text)).toBeNull());
});

test('Does not duplicate tasks for lists with equal names.', async () => {
  const list = buildList({ name: 'primary' });
  const task1 = buildTask({ listId: list.id });
  const task2 = buildTask({ listId: list.id });
  const preloadedState = buildPreloadedState({
    currentListId: list.id,
    lists: [list],
    tasks: [task1, task2],
  });

  server.use(
    rest.post('/api/v1/lists', (req, res, ctx) => {
      const { name } = req.body;
      const newList = buildList({ name });

      return res(
        ctx.json(newList),
      );
    }),
  );

  const {
    getByRole,
    getAllByRole,
    queryByText,
    container,
  } = render(<Application { ...preloadedState } />);

  await waitFor(() => expect(queryByText(task1.text)).toBeVisible());
  await waitFor(() => expect(queryByText(task2.text)).toBeVisible());

  userEvent.type(getByRole('textbox', { name: /new list/i }), list.name);

  userEvent.click(container.querySelector(selectors.addTaskButton));

  await waitFor(() => expect(getAllByRole('button', { name: /primary/i })).toHaveLength(2));

  userEvent.click(getAllByRole('button', { name: /primary/i })[1]);

  await waitFor(() => expect(queryByText(task1.text)).toBeNull());
  await waitFor(() => expect(queryByText(task2.text)).toBeNull());
});
