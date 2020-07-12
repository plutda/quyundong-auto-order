

const path = require("path");
const electronInstaller = require('electron-winstaller');

function buildSetup() {
  electronInstaller.createWindowsInstaller({
    appDirectory: path.resolve(__dirname, '../build/qyd-auto-order-win32-x64'),//入口
    outputDirectory: path.resolve(__dirname, '../build/setup'),//出口
    authors: 'wzb',
    exe: path.resolve(__dirname, "../build/qyd-auto-order-win32-x64/qyd-auto-order.exe") ,//名称
    noMsi: true,
  }).then(() => {
      console.log('worked')
    }, (e) => {
      console.log(`No dice: ${e}`)}
    );
}

buildSetup()