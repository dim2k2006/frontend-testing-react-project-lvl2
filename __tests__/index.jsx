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

const renderComponent = ({ currentListId, lists, tasks } = {}) => {
  const preloadedState = buildPreloadedState({ currentListId, lists, tasks });

  render(<Application { ...preloadedState } />);
};

const getTaskField = () => screen.getByRole('textbox', { name: /new task/i });
const getTaskButton = () => screen.getByRole('button', { name: 'Add', exact: true });

const createTask = async (taskText) => {
  userEvent.type(getTaskField(), taskText);
  userEvent.click(getTaskButton());

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

const getListField = () => screen.getByRole('textbox', { name: /new list/i });

const getListButton = () => {
  const field = getListField();
  const container = field.closest('div');
  const button = container.querySelector('button[type="submit"]');

  return button;
};

const createList = async (listName) => {
  userEvent.type(getListField(), listName);
  userEvent.click(getListButton());

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
  renderComponent();

  expect(screen.getByText('Hexlet Todos')).toBeVisible();
});

test('Creates a task.', async () => {
  const list = buildList({ name: 'primary', removable: false });
  const taskText = faker.lorem.word();

  renderComponent({ currentListId: list.id, lists: [list] });

  await createTask(taskText);

  expect(screen.getByText(taskText)).toBeVisible();
});

test('Updates a task.', async () => {
  const list = buildList({ name: 'primary', removable: false });
  const taskText = faker.lorem.word();

  renderComponent({ currentListId: list.id, lists: [list] });

  await createTask(taskText);

  await toggleTask(taskText);

  expect(await screen.findByRole('checkbox', { name: new RegExp(taskText) })).toBeVisible();
  expect(await screen.findByRole('checkbox', { name: new RegExp(taskText) })).toBeChecked();
});

test('Deletes a task.', async () => {
  const list = buildList({ name: 'primary', removable: false });
  const taskText = faker.lorem.word();

  renderComponent({ currentListId: list.id, lists: [list] });

  await createTask(taskText);

  await removeTask(taskText);

  expect(screen.queryByText(taskText)).toBeNull();
});

test('Does not remove tasks with equal names from different lists.', async () => {
  const listName1 = faker.lorem.word();
  const listName2 = faker.lorem.word();
  const taskText = faker.lorem.word();

  renderComponent({ lists: [], tasks: [] });

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

  renderComponent({ lists: [], tasks: [] });

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

test('Does not create empty task.', async () => {
  renderComponent();

  userEvent.click(getTaskButton());

  expect(await screen.findByText(/required/i)).toBeVisible();
});

test('Does not create empty list.', async () => {
  renderComponent();

  userEvent.click(getListButton());

  expect(await screen.findByText(/required/i)).toBeVisible();
});

test('Does not create task with the same name.', async () => {
  const list = buildList({ name: 'primary', removable: false });
  const taskText = faker.lorem.word();

  renderComponent({ currentListId: list.id, lists: [list] });

  await createTask(taskText);

  userEvent.type(getTaskField(), taskText);

  userEvent.click(getTaskButton());

  expect(await screen.findByText(/already exists/i)).toBeVisible();
});

test('Does not create list with the same name.', async () => {
  const list = buildList({ name: 'primary', removable: false });

  renderComponent({ currentListId: list.id, lists: [list] });

  userEvent.type(getListField(), list.name);

  userEvent.click(getListButton());

  expect(await screen.findByText(/already exists/i)).toBeVisible();
});

// тесты на ошибки сети