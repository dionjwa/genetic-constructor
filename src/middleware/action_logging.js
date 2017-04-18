const loggingMiddleware = store => next => (action) => {
  const result = next(action);

  if (process.env.DEBUG_REDUX === 'true') {
    console.group && console.group(action.type);
    console.log('dispatching', action);
    console.log('next state', store.getState());
    console.groupEnd && console.groupEnd(action.type);
  }

  return result;
};

export default loggingMiddleware;
