const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("menu", {
  getState: () => ipcRenderer.invoke("menu-state"),
  onState: (cb) => ipcRenderer.on("menu-state", (_e, st) => cb(st)),
  action: (name) => ipcRenderer.send("menu-action", name)
});
