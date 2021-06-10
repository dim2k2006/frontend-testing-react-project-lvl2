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
  buildPreloadedState, buildTask,
} from '../setupTests.js';
import getServer from '../mocks/handlers';

const primaryList = buildList({ name: 'primary', removable: false });
const secondaryList = buildList({ name: 'secondary' });
const preloadedState = buildPreloadedState({
  currentListId: primaryList.id,
  lists: [primaryList, secondaryList],
  tasks: [],
});

const renderComponent = () => {
  render(<Application { ...preloadedState } />);
};

let server = getServer({ lists: preloadedState.lists, tasks: preloadedState.tasks });

beforeEach(() => {
  server = getServer({ lists: preloadedState.lists, tasks: preloadedState.tasks });

  server.listen({ onUnhandledRequest: 'warn' });

  renderComponent();
});

afterEach(() => {
  server.resetHandlers();

  server.close();
});

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

describe('Lists cases.', () => {
  test('Creates a list.', async () => {
    const listName = faker.lorem.word();

    await createList(listName);

    expect(await screen.findByText(listName)).toBeInTheDocument();
  });

  test('Removes a list.', async () => {
    const listName = faker.lorem.word();

    await createList(listName);

    await removeList(listName);

    await waitFor(() => expect(screen.queryByText(listName)).not.toBeInTheDocument());
  });

  test('Does not create empty list.', async () => {
    userEvent.click(getListButton());

    expect(await screen.findByText(/required/i)).toBeVisible();
  });

  test('Does not create list with an existing name.', async () => {
    userEvent.type(getListField(), primaryList.name);

    userEvent.click(getListButton());

    expect(await screen.findByText(/already exists/i)).toBeVisible();
  });

  test('Disables list field and list button during list creation.', async () => {
    const list = buildList();

    server.use(
      rest.post('/api/v1/lists', (req, res, ctx) => res(
        ctx.delay(1000),
        ctx.json(list),
      )),
    );

    userEvent.type(getListField(), list.name);
    userEvent.click(getListButton());

    await waitFor(() => expect(getListField()).toHaveAttribute('readonly'));
    await waitFor(() => expect(getListButton()).toBeDisabled());

    expect(await screen.findByText(list.name)).toBeVisible();
  });
});

test('Shows the application.', async () => {
  expect(screen.getByText('Hexlet Todos')).toBeVisible();
});

test('Creates a task.', async () => {
  const taskText = faker.lorem.word();

  await createTask(taskText);

  expect(screen.getByText(taskText)).toBeVisible();
});

test('Updates a task.', async () => {
  const taskText = faker.lorem.word();

  await createTask(taskText);

  await toggleTask(taskText);

  expect(await screen.findByRole('checkbox', { name: new RegExp(taskText) })).toBeVisible();
  expect(await screen.findByRole('checkbox', { name: new RegExp(taskText) })).toBeChecked();
});

test('Deletes a task.', async () => {
  const taskText = faker.lorem.word();

  await createTask(taskText);

  await removeTask(taskText);

  expect(screen.queryByText(taskText)).toBeNull();
});

test('Does not remove tasks with equal names from different lists.', async () => {
  const listName1 = primaryList.name;
  const listName2 = secondaryList.name;
  const taskText = faker.lorem.word();

  await selectList(listName1);

  await createTask(taskText);

  await selectList(listName2);

  await createTask(taskText);

  await removeTask(taskText);

  await selectList(listName1);

  expect(await screen.findByText(taskText)).toBeVisible();
});

test('Does not recover tasks from recovered list.', async () => {
  const listName = secondaryList.name;
  const taskText1 = faker.lorem.word();
  const taskText2 = faker.lorem.word();

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
  userEvent.click(getTaskButton());

  expect(await screen.findByText(/required/i)).toBeVisible();
});

test('Does not create task with the same name.', async () => {
  const taskText = faker.lorem.word();

  await createTask(taskText);

  userEvent.type(getTaskField(), taskText);

  userEvent.click(getTaskButton());

  expect(await screen.findByText(/already exists/i)).toBeVisible();
});

test('Disables task field and task button during task creation.', async () => {
  const taskText = faker.lorem.word();
  const task = buildTask({ listId: primaryList.id });

  server.use(
    rest.post('/api/v1/lists/:listId/tasks', (req, res, ctx) => res(
      ctx.delay(1000),
      ctx.json(task),
    )),
  );

  userEvent.type(getTaskField(), taskText);
  userEvent.click(getTaskButton());

  await waitFor(() => expect(getTaskField()).toHaveAttribute('readonly'));
  await waitFor(() => expect(getTaskButton()).toBeDisabled());

  expect(await screen.findByText(task.text)).toBeVisible();
});

test('Does not create task if there was an error during task creation.', async () => {
  const taskText = faker.lorem.word();

  server.use(
    rest.post('/api/v1/lists/:listId/tasks', (req, res, ctx) => res(
      ctx.status(500),
    )),
  );

  userEvent.type(getTaskField(), taskText);
  userEvent.click(getTaskButton());

  await waitFor(() => expect(screen.queryByText(taskText)).toBeNull());
  await waitFor(() => expect(screen.queryByText(/network error/i)).toBeVisible());
});

test('Does not create list if there was an error during list creation.', async () => {
  const list = buildList();

  server.use(
    rest.post('/api/v1/lists', (req, res, ctx) => res(
      ctx.status(500),
    )),
  );

  userEvent.type(getListField(), list.name);
  userEvent.click(getListButton());

  await waitFor(() => expect(screen.queryByText(list.name)).toBeNull());
  await waitFor(() => expect(screen.queryByText(/network error/i)).toBeVisible());
});
