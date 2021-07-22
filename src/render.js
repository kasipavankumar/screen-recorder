(async function () {
  const { desktopCapturer, remote } = require("electron");
  const { writeFile } = require("fs");
  const { Menu, dialog } = remote;

  // Global state.
  let mediaRecorder;
  const recordedChunks = [];

  const mirrorEle = document.getElementById("recording-mirror");
  const startBtn = document.getElementById("start-recording");
  const stopBtn = document.getElementById("stop-recording");
  const videoSelectionBtn = document.getElementById("source-selection");

  async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
      types: ["window", "screen"],
    });

    const videoOptsMenu = Menu.buildFromTemplate(
      inputSources.map((source) => ({
        label: source.name,
        click: () => selectSource(source),
      }))
    );

    videoOptsMenu.popup();
  }

  async function selectSource(source) {
    videoSelectionBtn.innerText = source.name;

    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: source.id,
        },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    mirrorEle.srcObject = stream;
    mirrorEle.play();

    const options = { mimeType: "video/webm; codecs=vp9" };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
  }

  // Captures all recorded chunks
  function handleDataAvailable(e) {
    console.log("video data available");
    recordedChunks.push(e.data);
  }

  // Saves the video file on stop
  async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
      type: "video/webm; codecs=vp9",
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: "Save video",
      defaultPath: `vid-${Date.now()}.webm`,
    });

    if (filePath) {
      writeFile(filePath, buffer, () =>
        console.log("video saved successfully!")
      );
    }
  }

  startBtn.onclick = (e) => {
    mediaRecorder.start();
    startBtn.innerText = "Recording";
  };

  stopBtn.onclick = (e) => {
    mediaRecorder.stop();
    startBtn.innerText = "Start";
  };

  videoSelectionBtn.onclick = getVideoSources;
})();
