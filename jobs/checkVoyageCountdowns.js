const { parentPort } = require("worker_threads");

const warningTimeBeforeVoyageMilliseconds = 300000;

const checkInterval = 5000;

parentPort.on("message", message => {
  if (message === "exit") {
    parentPort.postMessage("exited");
    parentPort.close();
    process.exit();
  } else {
    const voyageCountdowns = JSON.parse(message).keys;
    setInterval(() => {
      voyageCountdowns.forEach((hostId, data) => {
        const { endTime } = data;

        if (Date.now() >= endTime) {
          parentPort.postMessage({ hostId, status: "voyageStart" });
        } else if (endTime - Date.now() <= warningTimeBeforeVoyageMilliseconds) {
          if (!data.warned) {
            parentPort.postMessage({ hostId, status: "voyageWarn" });
          }
        }
      });
    }, checkInterval);
  }
});