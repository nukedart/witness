'use strict';

const { app, BrowserWindow } = require('electron');

require('electron-reload')(__dirname);

let win;

function createWindow () {

    win = new BrowserWindow({ width: 900, height: 600, resizable: false });

    win.loadURL('http://localhost:3000/');

    win.on('closed', () => {

        win = null
    })
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {

    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {

    if (win === null) {
        createWindow()
    }
});
