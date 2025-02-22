// renderer.js
const { ipcRenderer } = require('electron');

document.getElementById('selectFolder').addEventListener('click', async () => {
  const path = await ipcRenderer.invoke('select-folder');
  if (path) document.getElementById('sourcePath').value = path;
});

document.getElementById('selectDestFolder').addEventListener('click', async () => {
  const path = await ipcRenderer.invoke('select-folder');
  if (path) document.getElementById('destPath').value = path;
});

document.getElementById('generateDOE').addEventListener('click', async () => {
  const sourcePath = document.getElementById('sourcePath').value;
  const destPath = document.getElementById('destPath').value;

  if (sourcePath && destPath) {
    const result = await ipcRenderer.invoke('generate-doe', sourcePath, destPath);
    document.getElementById('status').innerText = result;
  } else {
    alert('Veuillez sélectionner les deux dossiers (source et destination).');
  }
});