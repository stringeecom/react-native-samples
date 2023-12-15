export const createRoom = async (token, name) => {
  return await fetch('https://api.stringee.com/v1/room2/create', {
    headers: {
      'Content-Type': 'application/json',
      'X-STRINGEE-AUTH': token,
    },
    method: 'post',
    body: JSON.stringify({
      name: name,
      uniqueName: name,
    }),
  });
};

export const listRoom = async token => {
  return await fetch('https://api.stringee.com/v1/room2/list', {
    headers: {
      'Content-Type': 'application/json',
      'X-STRINGEE-AUTH': token,
    },
    method: 'get',
  });
};
