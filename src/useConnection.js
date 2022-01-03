import { useState } from "react";

function pause(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export const useConnection = (worker, latency) => {
  const [disconnected, setDisconnected] = useState(null);

  const _request = (value) => {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port2.onmessage = (event) => resolve(JSON.parse(event.data));
      worker.postMessage(value, [channel.port1]);
    });
  };

  const request = async (value) => {
    await (disconnected ? disconnected.wait : pause(latency));
    const result = await _request(value);
    await (disconnected ? disconnected.wait : pause(latency));
    return result;
  };

  const setConnected = (value) => {
    if (value && disconnected) {
      disconnected.resolve();
      setDisconnected(null);
    } else if (!value && !disconnected) {
      let resolve,
        wait = new Promise((r) => (resolve = r));
      setDisconnected({ wait, resolve });
    }
  };

  return {
    request,
    setConnected
  };
};
