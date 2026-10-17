const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  setIgnore: (ignore) => ipcRenderer.send("set-ignore", !!ignore),
  quit: () => ipcRenderer.send("quit"),
  loadSave: () => ipcRenderer.sendSync("load-save"),
  writeSave: (json) => ipcRenderer.send("write-save", json),
  onOpenPanel: (cb) => ipcRenderer.on("open-panel", () => cb()),
  onNotice: (cb) => ipcRenderer.on("notice", (_e, msg) => cb(msg)),
  onToggleHud: (cb) => ipcRenderer.on("toggle-hud", () => cb())
});
