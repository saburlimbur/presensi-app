import path from "path";
import os from "os";
import { Worker } from "worker_threads";
import logger from "../../utils/logger.js";

const POOL_SIZE = Math.max(
  1,
  Math.min(Number(process.env.FACE_POOL_SIZE) || 2, os.cpus().length),
);

let workers = [];
const queue = [];
const pending = new Map();
let seq = 0;
let started = false;
let failedSpawns = 0;

const dispatch = () => {
  if (queue.length === 0) return;
  const entry = workers.find((w) => !w.busy);
  if (!entry) return;

  const task = queue.shift();
  const id = ++seq;
  entry.busy = true;
  entry.currentId = id;
  pending.set(id, {
    resolve: task.resolve,
    reject: task.reject,
    entry
  });
  entry.worker.postMessage({
    id,
    imagePath: task.imagePath
  });
};

const settle = (entry, msg) => {
  const p = pending.get(msg.id);
  if (!p) return;
  pending.delete(msg.id);
  entry.busy = false;
  entry.currentId = null;
  if (msg.ok) {
    p.resolve(msg.descriptor);
  } else {
    const err = new Error(msg.message || msg.code || "inferensi wajah gagal");
    err.code = msg.code;
    p.reject(err);
  }
  dispatch();
};

const handleDeath = (entry, reason) => {
  if (entry.dead) return;
  entry.dead = true;

  if (entry.currentId && pending.has(entry.currentId)) {
    pending
      .get(entry.currentId)
      .reject(
        reason instanceof Error ? reason : new Error("face worker terminated"),
      );
    pending.delete(entry.currentId);
  }
  workers = workers.filter((w) => w !== entry);

  if (!started) return;

  failedSpawns += 1;
  if (failedSpawns > 5) {
    logger.error(
      `face worker mati (${reason?.message ?? reason}); berhenti respawn setelah 5 kali gagal`,
    );
    return;
  }

  logger.warn(`face worker mati (${reason?.message ?? reason}); respawn`);
  setTimeout(() => {
    if (!started) return;
    workers.push(spawn());
    dispatch();
  }, 1000 * failedSpawns).unref();
};

const spawn = () => {
  const worker = new Worker(new URL("./face.worker.js", import.meta.url), {
    workerData: {
      modelPath: path.join(process.cwd(), "public", "models"),
    },
  });
  const entry = {
    worker,
    busy: false,
    currentId: null,
    dead: false
  };

  worker.on("message", (msg) => {
    if (msg?.ready) {
      failedSpawns = 0;
      logger.info("face worker ready");
      return;
    }
    settle(entry, msg);
  });
  worker.on("error", (err) => handleDeath(entry, err));
  worker.on("exit", (code) => {
    if (code !== 0) handleDeath(entry, new Error(`worker exit ${code}`));
  });

  return entry;
};

const init = () => {
  if (started) return;
  started = true;
  for (let i = 0; i < POOL_SIZE; i++) workers.push(spawn());
  logger.info(`face worker pool started: ${POOL_SIZE} worker(s)`);
};

const embed = (imagePath) =>
  new Promise((resolve, reject) => {
    if (!started) {
      reject(new Error("face worker pool belum di-init"));
      return;
    }
    queue.push({ imagePath, resolve, reject });
    dispatch();
  });

const shutdown = async () => {
  started = false;
  const all = workers.slice();
  workers = [];
  await Promise.all(all.map((w) => w.worker.terminate()));
};

export default { init, embed, shutdown };
