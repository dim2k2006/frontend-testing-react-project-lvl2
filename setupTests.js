import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { v4 as uuidV4 } from 'uuid';
import faker from 'faker';

// Делаем реэкспорт чтобы в файлах с тестами импортировать все из файла setupTest.js
// С таким подходом можно переопределять методы библиотеки @testing-library/react
// например, метод render https://redux.js.org/recipes/writing-tests
export * from '@testing-library/react';

export const buildList = (props = {}) => {
  const {
    id = uuidV4(),
    name,
    removable = true,
  } = props;

  const list = { id, name, removable };

  return list;
};

export const buildTask = (props = {}) => {
  const {
    id = uuidV4(),
    listId,
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
