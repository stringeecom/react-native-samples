import {sign} from 'react-native-pure-jwt';

const apiKeySid = 'SKE1RdUtUaYxNaQQ4Wr15qF1zUJuQdAaVT';
const apiKeySecret = 'M3Fkcmswc1hvYllmOGR0VzY5TXhUcXZxWFJ2OHVudVc=';

export const generateStringeeToken = async userId => {
  var now = Math.floor(Date.now());
  var exp = now + 3600000 * 24;
  var header = {cty: 'stringee-api;v=1'};
  var payload = {
    jti: apiKeySid + '-' + now,
    iss: apiKeySid,
    exp: exp,
    userId: userId,
  };
  return await sign(payload, apiKeySecret, {
    algorithm: 'HS256',
    header: header,
  });
};

export const generateRestApiToken = async () => {
  var now = Math.floor(Date.now());
  var exp = now + 3600000 * 24;
  var header = {cty: 'stringee-api;v=1'};
  var payload = {
    jti: apiKeySid + '-' + now,
    iss: apiKeySid,
    exp: exp,
    rest_api: true,
  };
  return await sign(payload, apiKeySecret, {
    algorithm: 'HS256',
    header: header,
  });
};

export const generateRoomToken = async roomId => {
  var now = Math.floor(Date.now());
  var exp = now + 3600000 * 24;
  var header = {cty: 'stringee-api;v=1'};
  var payload = {
    jti: apiKeySid + '-' + now,
    iss: apiKeySid,
    exp: exp,
    roomId: roomId,
    permissions: {
      publish: true,
      subscribe: true,
      control_room: true,
    },
  };
  return await sign(payload, apiKeySecret, {
    algorithm: 'HS256',
    header: header,
  });
};

export const chunk = (arr: Array<any>) => {
  if (!arr) {
    return [];
  }
  const maxSize = arr.length;
  let size = Math.ceil(Math.sqrt(maxSize));
  if (maxSize === 2) {
    size = 1;
  }

  const result = [];
  let input = [...arr];
  while (input.length > 0) {
    if (input.length > size) {
      result.push(input.splice(0, size));
    } else {
      result.push(input.splice(0, input.length));
    }
  }
  return result;
};
