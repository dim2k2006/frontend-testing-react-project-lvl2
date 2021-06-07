import { rest } from 'msw';
import { buildList, buildTask } from '../setupTests';

let lists = [];

let tasks = [];

const handlers = [
  rest.post('/api/v1/lists/:listId/tasks', (req, res, ctx) => {
    const task = buildTask({ text: req.body.text, listId: req.params.listId });

    tasks = [...tasks, task];

    return res(
      ctx.json(task),
    );
  }),
  rest.patch('/api/v1/tasks/:taskId', (req, res, ctx) => {
    const { completed } = req.body;
    const { taskId } = req.params;

    const currentTask = tasks.find((task) => task.id === taskId);

    const newTask = { ...currentTask, completed, touched: Date.now() };

    tasks = tasks.map((task) => {
      if (task.id !== taskId) return task;

      return newTask;
    });

    return res(
      ctx.json(newTask),
    );
  }),
  rest.delete('/api/v1/tasks/:taskId', (req, res, ctx) => {
    const { taskId } = req.params;

    tasks = tasks.filter((task) => task.id === taskId);

    return res(
      ctx.status(204),
    );
  }),

  rest.post('/api/v1/lists', (req, res, ctx) => {
    const { name } = req.body;
    const newList = buildList({ name });

    lists = [...lists, newList];

    return res(
      ctx.json(newList),
    );
  }),
  rest.delete('/api/v1/lists/:id', (req, res, ctx) => {
    const { id } = req.params;

    lists = lists.filter((list) => list.id === id);

    return res(
      ctx.status(204),
    );
  }),
];

export default handlers;
