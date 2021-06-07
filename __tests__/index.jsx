import React from 'react';
import Application from '@hexlet/react-todo-app-with-backend';
import faker from 'faker';
import userEvent from '@testing-library/user-event';
import {
  screen,
  render,
  getByRole,
  waitForElementToBeRemoved,
  waitFor,
  buildList,
  buildPreloadedState,
} from '../setupTests.js';
import server from '../mocks/server';

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

const selectList = async (listName, index = 0) => {
  userEvent.click(screen.getAllByRole('button', { name: new RegExp(listName) })[index]);
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

test('Does not duplicate tasks for lists with equal names.', async () => {
  const listName = faker.lorem.word();
  const taskText1 = faker.lorem.word();
  const taskText2 = faker.lorem.word();
  const preloadedState = buildPreloadedState({ lists: [], tasks: [] });

  render(<Application { ...preloadedState } />);

  await createList(listName);

  await selectList(listName);

  await createTask(taskText1);

  await createTask(taskText2);

  await waitFor(() => expect(screen.queryByText(taskText1)).toBeVisible());
  await waitFor(() => expect(screen.queryByText(taskText2)).toBeVisible());

  await createList(listName);

  await waitFor(() => expect(screen.getAllByRole('button', { name: new RegExp(listName) })).toHaveLength(2));

  await selectList(listName, 1);

  await waitFor(() => expect(screen.queryByText(taskText1)).toBeNull());
  await waitFor(() => expect(screen.queryByText(taskText2)).toBeNull());
});
