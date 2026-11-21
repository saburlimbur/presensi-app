import { parentPort, workerData } from "worker_threads";
import * as canvas from "@napi-rs/canvas";
import * as faceapi from "face-api.js";

const { Canvas, Image, ImageData, createCanvas } = canvas;

faceapi.env.monkeyPatch({
  Canvas,
  Image,
  ImageData,
  createCanvasElement: (width = 1, height = 1) => createCanvas(width, height),
  createImageElement: () => new Image(),
});

const options = new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,
  scoreThreshold: 0.5,
});

const ready = (async () => {
  const modelPath = workerData.modelPath;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
  ]);
})();

const loadImageAsCanvas = async (imagePath) => {
  const img = await canvas.loadImage(imagePath);
  const cvs = createCanvas(img.width, img.height);
  cvs.getContext("2d").drawImage(img, 0, 0, img.width, img.height);
  return cvs;
};

parentPort.on("message", async (msg) => {
  const { id, imagePath } = msg;
  try {
    await ready;
    const canvasImg = await loadImageAsCanvas(imagePath);
    const dets = await faceapi
      .detectAllFaces(canvasImg, options)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (dets.length === 0) {
      parentPort.postMessage({ id, ok: false, code: "NO_FACE" });
      return;
    }
    if (dets.length > 1) {
      parentPort.postMessage({ id, ok: false, code: "MULTI_FACE" });
      return;
    }
    parentPort.postMessage({
      id,
      ok: true,
      descriptor: Array.from(dets[0].descriptor),
    });
  } catch (err) {
    parentPort.postMessage({ id, ok: false, code: "ERROR", message: err.message });
  }
});

ready.then(() => parentPort.postMessage({ ready: true }));
