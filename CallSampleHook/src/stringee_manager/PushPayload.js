export const parseStringeePushData = message => {
  if (message?.data?.stringeePushNotification !== '1.0') {
    return null;
  }
  const rawData = message.data.data;
  if (!rawData) {
    return null;
  }
  try {
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    return data && typeof data === 'object' ? data : null;
  } catch (_) {
    return null;
  }
};

export const isTerminalStringeePush = data => {
  const isOriginal =
    data.original === true || data.original === 1 || data.original === 'true';
  return (
    data.callStatus === 'ended' ||
    data.callStatus === 'busy' ||
    data.callStatus === 'agentEnded' ||
    (data.callStatus === 'answered' && !isOriginal)
  );
};
