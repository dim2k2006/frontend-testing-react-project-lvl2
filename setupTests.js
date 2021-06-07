import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { v4 as uuidV4 } from 'uuid';
import faker from 'faker';

export * from '@testing-library/react';

export const buildList = (props = {}) => {
  const {
    id = uuidV4(),
    name = faker.lorem.word(),
    removable = true,
  } = props;

  const list = { id, name, removable };

  return list;
};

export const buildTask = (props = {}) => {
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

export const buildPreloadedState = (props = {}) => {
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
