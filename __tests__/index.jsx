import React from 'react';
import Application from '@hexlet/react-todo-app-with-backend';
import faker from 'faker';
import { rest } from 'msw';
import userEvent from '@testing-library/user-event';
import {
  screen,
  render,
  getByRole,
  waitForElementToBeRemoved,
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

const createTask = async (taskText) => {
  userEvent.type(screen.getByRole('textbox', { name: /new task/i }), taskText);
  userEvent.click(screen.getByRole('button', { name: /add/i }));

  return screen.findByText(taskText);
};

const toggleTask = async (taskText) => {
  userEvent.click(screen.getByRole('checkbox', { name: new RegExp(taskText) }));
};

const removeTask = async (taskText) => {
  const taskCheckbox = screen.getByRole('checkbox', { name: new RegExp(taskText) });
  const container = taskCheckbox.closest('.row');

  userEvent.click(getByRole(container, 'button', { name: /remove/i }));

  return waitForElementToBeRemoved(screen.queryByText(taskText));
};

const createList = async (listName) => {
  const field = screen.getByRole('textbox', { name: /new list/i });
  const container = field.closest('div');
  const button = container.querySelector('button[type="submit"]');

  userEvent.type(field, listName);
  userEvent.click(button);

  return screen.findByText(listName);
};

const selectList = async (listName) => {
  userEvent.click(screen.getByRole('button', { name: new RegExp(listName) }));
};

const removeList = async (listName) => {
  const listButton = screen.getByRole('button', { name: new RegExp(listName) });
  const container = listButton.closest('div');
  const removeListButton = container.querySelector('button:last-child');

  userEvent.click(removeListButton);

  return waitForElementToBeRemoved(screen.queryByText(listName));
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

  await createTask(taskText);

  expect(screen.getByText(taskText)).toBeVisible();
});

test('Updates a task.', async () => {
  const list = buildList({ name: 'primary', removable: false });
  const preloadedState = buildPreloadedState({ currentListId: list.id, lists: [list] });
  const taskText = faker.lorem.word();

  render(<Application { ...preloadedState } />);

  await createTask(taskText);

  await toggleTask(taskText);

  expect(await screen.findByRole('checkbox', { name: new RegExp(taskText) })).toBeVisible();
  expect(await screen.findByRole('checkbox', { name: new RegExp(taskText) })).toBeChecked();
});

test('Deletes a task.', async () => {
  const list = buildList({ name: 'primary', removable: false });
  const preloadedState = buildPreloadedState({ currentListId: list.id, lists: [list] });
  const taskText = faker.lorem.word();

  render(<Application { ...preloadedState } />);

  await createTask(taskText);

  await removeTask(taskText);

  expect(screen.queryByText(taskText)).toBeNull();
});

test('Does not remove tasks with equal names from different lists.', async () => {
  const listName1 = faker.lorem.word();
  const listName2 = faker.lorem.word();
  const taskText = faker.lorem.word();
  const preloadedState = buildPreloadedState({ lists: [], tasks: [] });

  render(<Application { ...preloadedState } />);

  await createList(listName1);

  await createList(listName2);

  await selectList(listName1);

  await createTask(taskText);

  await selectList(listName2);

  await createTask(taskText);

  await removeTask(taskText);

  await selectList(listName1);

  expect(await screen.findByText(taskText)).toBeVisible();
});

test('Does not recover tasks from recovered list.', async () => {
  const listName = faker.lorem.word();
  const taskText1 = faker.lorem.word();
  const taskText2 = faker.lorem.word();
  const preloadedState = buildPreloadedState({ lists: [], tasks: [] });

  render(<Application { ...preloadedState } />);

  await createList(listName);

  await selectList(listName);

  await createTask(taskText1);

  await createTask(taskText2);

  await removeList(listName);

  await waitFor(() => expect(screen.queryByText(listName)).toBeNull());

  await createList(listName);

  await selectList(listName);

  await waitFor(() => expect(screen.queryByText(listName)).toBeVisible());
  await waitFor(() => expect(screen.queryByText(taskText1)).toBeNull());
  await waitFor(() => expect(screen.queryByText(taskText2)).toBeNull());
});

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
