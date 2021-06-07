import React from 'react';
import Application from '@hexlet/react-todo-app-with-backend';
import faker from 'faker';
import { rest } from 'msw';
import userEvent from '@testing-library/user-event';
import {
  screen,
  render,
  getByRole,
  waitFor,
  buildList,
  buildTask,
  buildPreloadedState,
} from '../setupTests.js';
import server from '../mocks/server';

const selectors = {
  addTaskButton: '.row .col-3 form button',
  deleteListButton: (listIndex) => `.row .col-3 ul li:nth-child(${listIndex}) button:last-child`,
};

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

const createTask = (taskText) => {
  userEvent.type(screen.getByRole('textbox', { name: /new task/i }), taskText);
  userEvent.click(screen.getByRole('button', { name: /add/i }));
};

const toggleTask = (taskText) => {
  userEvent.click(screen.getByRole('checkbox', { name: new RegExp(taskText) }));
};

const removeTask = (taskText) => {
  const taskCheckbox = screen.getByRole('checkbox', { name: new RegExp(taskText) });
  const container = taskCheckbox.closest('.row');

  userEvent.click(getByRole(container, 'button', { name: /remove/i }));
};

const createList = (listName) => {
  const field = screen.getByRole('textbox', { name: /new list/i });
  const container = field.closest('div');
  const button = container.querySelector('button[type="submit"]');

  userEvent.type(field, listName);
  userEvent.click(button);
};

const selectList = (listName) => {
  userEvent.click(screen.getByRole('button', { name: new RegExp(listName) }));
};

test('Shows the application.', async () => {
  const preloadedState = buildPreloadedState();

  render(<Application { ...preloadedState } />);

  expect(screen.getByText('Hexlet Todos')).toBeVisible();
});

test('Creates a task.', async () => {
  const list = buildList({ name: 'primary', removable: false });
  const preloadedState = buildPreloadedState({ currentListId: list.id, lists: [list] });
  const taskText = faker.lorem.word();

  render(<Application { ...preloadedState } />);

  createTask(taskText);

  expect(await screen.findByText(taskText)).toBeVisible();
});

test('Updates a task.', async () => {
  const list = buildList({ name: 'primary', removable: false });
  const preloadedState = buildPreloadedState({ currentListId: list.id, lists: [list] });
  const taskText = faker.lorem.word();

  render(<Application { ...preloadedState } />);

  createTask(taskText);

  expect(await screen.findByText(taskText)).toBeVisible();

  toggleTask(taskText);

  expect(await screen.findByRole('checkbox', { name: new RegExp(taskText) })).toBeVisible();
  expect(await screen.findByRole('checkbox', { name: new RegExp(taskText) })).toBeChecked();
});

test('Deletes a task.', async () => {
  const list = buildList({ name: 'primary', removable: false });
  const preloadedState = buildPreloadedState({ currentListId: list.id, lists: [list] });
  const taskText = faker.lorem.word();

  render(<Application { ...preloadedState } />);

  createTask(taskText);

  expect(await screen.findByText(taskText)).toBeVisible();

  removeTask(taskText);

  await waitFor(() => expect(screen.queryByText(taskText)).toBeNull());
});

test('Does not remove tasks with equal names from different lists.', async () => {
  const listName1 = faker.lorem.word();
  const listName2 = faker.lorem.word();
  const taskText = faker.lorem.word();
  const preloadedState = buildPreloadedState({ lists: [], tasks: [] });

  render(<Application { ...preloadedState } />);

  createList(listName1);

  expect(await screen.findByText(listName1)).toBeVisible();

  createList(listName2);

  expect(await screen.findByText(listName2)).toBeVisible();

  selectList(listName1);

  createTask(taskText);

  expect(await screen.findByText(taskText)).toBeVisible();

  selectList(listName2);

  createTask(taskText);

  expect(await screen.findByText(taskText)).toBeVisible();

  removeTask(taskText);

  await waitFor(() => expect(screen.queryByText(taskText)).toBeNull());

  selectList(listName1);

  expect(await screen.findByText(taskText)).toBeVisible();
});

// test('Does not recover tasks from recovered list.', async () => {
//   const list = buildList({ name: 'primary' });
//   const task1 = buildTask();
//   const task2 = buildTask();
//   const preloadedState = buildPreloadedState({
//     currentListId: list.id,
//     lists: [list],
//     tasks: [task1, task2],
//   });
//
//   // server.use(
//   //   // rest.delete('/api/v1/lists/:id', (req, res, ctx) => res(
//   //   //   ctx.status(204),
//   //   // )),
//   //   // rest.post('/api/v1/lists', (req, res, ctx) => {
//   //   //   const { name } = req.body;
//   //   //   const newList = buildList({ name });
//   //   //
//   //   //   return res(
//   //   //     ctx.json(newList),
//   //   //   );
//   //   // }),
//   // );
//
//   const { getByRole, queryByText, container } = render(<Application { ...preloadedState } />);
//
//   const deleteListButton = container.querySelector(selectors.deleteListButton(1));
//
//   userEvent.click(deleteListButton);
//
//   await waitFor(() => expect(queryByText(list.name)).toBeNull());
//   await waitFor(() => expect(queryByText(task1.text)).toBeNull());
//   await waitFor(() => expect(queryByText(task2.text)).toBeNull());
//
//   userEvent.type(getByRole('textbox', { name: /new list/i }), list.name);
//
//   const addTaskButton = container.querySelector(selectors.addTaskButton);
//
//   userEvent.click(addTaskButton);
//
//   await waitFor(() => expect(queryByText(list.name)).toBeVisible());
//   await waitFor(() => expect(queryByText(task1.text)).toBeNull());
//   await waitFor(() => expect(queryByText(task2.text)).toBeNull());
// });

// test('Does not duplicate tasks for lists with equal names.', async () => {
//   const list = buildList({ name: 'primary' });
//   const task1 = buildTask({ listId: list.id });
//   const task2 = buildTask({ listId: list.id });
//   const preloadedState = buildPreloadedState({
//     currentListId: list.id,
//     lists: [list],
//     tasks: [task1, task2],
//   });
//
//   // server.use(
//   //   // rest.post('/api/v1/lists', (req, res, ctx) => {
//   //   //   const { name } = req.body;
//   //   //   const newList = buildList({ name });
//   //   //
//   //   //   return res(
//   //   //     ctx.json(newList),
//   //   //   );
//   //   // }),
//   // );
//
//   const {
//     getByRole,
//     getAllByRole,
//     queryByText,
//     container,
//   } = render(<Application { ...preloadedState } />);
//
//   await waitFor(() => expect(queryByText(task1.text)).toBeVisible());
//   await waitFor(() => expect(queryByText(task2.text)).toBeVisible());
//
//   userEvent.type(getByRole('textbox', { name: /new list/i }), list.name);
//
//   userEvent.click(container.querySelector(selectors.addTaskButton));
//
//   await waitFor(() => expect(getAllByRole('button', { name: /primary/i })).toHaveLength(2));
//
//   userEvent.click(getAllByRole('button', { name: /primary/i })[1]);
//
//   await waitFor(() => expect(queryByText(task1.text)).toBeNull());
//   await waitFor(() => expect(queryByText(task2.text)).toBeNull());
// });
