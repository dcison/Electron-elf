const { BrowserWindow } = require('electron');
function changeModel(event,windowId) {
    //event.checked = true;
    //更换模型
    var window = BrowserWindow.fromId(windowId);
    //发送消息
    window.webContents.send('changemodel', event.label);
}

module.exports = changeModel;