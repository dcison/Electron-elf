/*
 * @LastEditors: dcison
 * @LastEditTime: 2021-01-16 16:10:35
 * @Description:  设置导航菜单、托盘
 */

// 具体文档可以参考：
// 官方文档 https://www.electronjs.org/docs/api/browser-window
// 大神资料 https://segmentfault.com/a/1190000008473121
const electron = require('electron')
const {
  dialog,
  Menu,
  Tray,
  BrowserWindow,
  shell,
} = electron
const path = require('path');
const spawn = require('child_process');
const changeModel = require('./changeModel');
var contextMenu;

function setMenu(systemObj,windowId) {
    //生成子菜单
    var submenuArr = [];
    for (var i in systemObj["menu"]) {
      var tag = systemObj["model"] == systemObj["menu"][i] ? true : false;
      var menuObj = {};
      menuObj.label = systemObj["menu"][i]
      menuObj.type = 'radio';
      menuObj.checked = tag;
      menuObj.enabled = true;
      menuObj.click = function (menuItem) {
        changeModel(menuItem,windowId);
      };
      submenuArr.push(menuObj);
    }
    var trayMenuTemplate = [{
        id: 1,
        label: '更换模型',
        type: 'submenu',
        // icon: path.join(__dirname, '/img/Fairy44 - Face #2220.png'),
        submenu: submenuArr
      },
      {
        type: 'separator'
      },
      {
        label: '小功能',
        type: 'submenu',
        submenu: [
          {
            label: '显示ip',
            click: function() {
                spawn.execFile(path.join(__dirname,"../sh/ip.sh"),function(error,stdout){
                  if (error !== null) {
                    console.log('exec error: ' + error);
                    return
                  }
                  title += stdout;
                  appTray.setTitle("\u001b[36m " + stdout);
                });
            }
          },
          {
            label: 'json格式化',
            click: function() {
              spawn.execFile(path.join(__dirname,"../sh/JsonUtils.sh"),function(error){
                if (error !== null) {
                  console.log('exec error: ' + error);
                  return
                }
              });
            }
          },
          {
            label: '锁定屏幕',
            click: function() {
              spawn.execFile(path.join(__dirname,"../sh/lock.sh"),["lock"],function(error){
                if (error !== null) {
                  console.log('exec error: ' + error);
                  return
                }
              });
            }
          }
        ]
      },
      {
        id: 2,
        label: '系统设置',
        click: function () {
          //let displays = electron.screen.getCursorScreenPoint()
          let systemWindow = new BrowserWindow({
            width: 600,
            height: 450,
            title: '',
            webPreferences: {
              nodeIntegration: true
            }
          });
          systemWindow.loadFile(path.join(__dirname, '../system.html'));
          //打开开发者工具
          //systemWindow.webContents.openDevTools();
          // systemWindowId = systemWindow.id;
        }
      },
      {
        id: 3,
        label: '设置模型仓库',
        click: function () {
          dialog.showOpenDialog(null, {
            title: "请选择文件",
            properties: ["openDirectory"],
            message: "选择自定义的模型仓库位置"
          }, function (filePaths, securityScopedBookmarks) {
            console.log(filePaths,securityScopedBookmarks)
            // if (filePaths != undefined) {
            //   db.set("user_model_path",filePaths).write();
            // }
          });
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'website',
        click: function () {
          //shell打开页面
          shell.openExternal(systemObj.website);
        }
      },
      {
        label: '退出',
        role: 'quit'
      }
    ];
    // //系统托盘图标目录
    const trayIcon = path.join(__dirname, '');
    const appTray = new Tray(path.join(trayIcon, '../img/tomato.png'));
    //图标的上下文菜单
    contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
  
    Menu.setApplicationMenu(contextMenu)
    //设置此托盘图标的悬停提示内容
    appTray.setToolTip('还快不点一下.');
    //
    // spawn.exec(systemObj.menu_text,function (error, stdout, stderr) {
    //   if (error !== null) {
    //     console.log('exec error: ' + error);
    //   }
    //   var command = stdout;
    // });
    var title = "\u001b[34m ";
    //设置此图标的上下文菜单
    appTray.setContextMenu(contextMenu);
    appTray.setTitle(title + systemObj.menu_text);
    return appTray
}

module.exports = setMenu;