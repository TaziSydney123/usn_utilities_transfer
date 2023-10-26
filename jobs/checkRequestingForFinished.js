const { parentPort } = require("worker_threads");

parentPort.on("message", requestingVoyage => {
  if (requestingVoyage === "exit") {
    parentPort.postMessage("exited");
    parentPort.close();
    process.exit();
  } else {
    requestingVoyage = JSON.parse(requestingVoyage).keys;
    setInterval(() => {
      requestingVoyage.forEach(keyValuePair => {
        const userId = keyValuePair.key;
        const data = keyValuePair.value;

        if (Date.now() >= data.expiration) {
          parentPort.postMessage({ userIdRemove: userId });
        }
      });
    }, 5000);
  }
});