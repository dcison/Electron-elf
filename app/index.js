// Modules to control application life and create native browser window
const electron = require('electron')
const {
  ipcMain,
  app,
  BrowserWindow,
  shell,
  globalShortcut,
  Notification
} = electron
const path = require('path');
var spawn = require('child_process');
var contextMenu;
var Imap = require('imap');
var MailParser = require("mailparser").MailParser;
var fs = require("fs");
const _function = require('./function');

var appTray;
let mainWindow;
let notif;


//窗口id值
var windowId;
//系统设置window
var systemWindowId;
//窗口对象
var windowobj;

//邮件obj
var emails = [];

//设置一个系统的全局变量
var systemObj = {
  "email": "",
  "password": "",
  "pop": "",
  "model": "",
  "texure": "",
  "change_texure_way": "",
  "emailFlag": false,
  "soundFlag": true,
  "menu": [],
  "menu_text": "",
  "website": "",
  "model_path": []
};

function connectEmail() {
  //连接邮箱前先清空邮件数组
  emails = [];
  imap.connect();
}

function setEmailInterval() {
  if (imap != null) setInterval(connectEmail, 10000);
}

//从dbjson里加载数据的function
function setSystemObj() {
  //启动，初始化email
  var dbPath = path.join(__dirname, '/db/db.json')
  const low = require('lowdb');
  const FileSync = require('lowdb/adapters/FileSync');
  const adapter = new FileSync(dbPath);
  const db = low(adapter);
  systemObj['email'] = db.get("email").value();
  systemObj['password'] = db.get("password").value();
  systemObj['pop'] = db.get("pop").value();
  systemObj['model'] = db.get("model").value();
  systemObj['emailFlag'] = db.get("emailFlag").value();
  systemObj['soundFlag'] = db.get("soundFlag").value();
  systemObj['menu'] = db.get("menu").value();
  systemObj['menu_text'] = db.get("menu_text").value();
  systemObj['model_path'] = db.get("model_path").value();
  systemObj['website'] = db.get("website").value();
  systemObj['change_texure_way'] = db.get("change_texure_way").value();
}
//初始化系统设置
setSystemObj();

function initSystemSetUp() {
  imap = new Imap({
    user: systemObj.email,
    password: systemObj.password,
    host: systemObj.pop
  });
  //开启email定时执行
  setEmailInterval();
  //监听
  imapReady();
}

function createWindow() {
  //启动，初始化email
  const {
    width,
    height
  } = electron.screen.getPrimaryDisplay().workAreaSize
  windowobj = {
    x: width - 300,
    y: height - 500,
    width: 300,
    height: 500,
    maximizable: false,
    minimizable: false,
    resizable: false,
    fullscreenable: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    titleBarStyle: 'customButtonsOnHover',
    webPreferences: {
      nodeIntegration: true
    }
  }
  // Create the browser window.
  mainWindow = new BrowserWindow(windowobj);
  // 打开开发者工具
  //mainWindow.webContents.openDevTools()
  windowId = mainWindow.id;
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '/index.html'))

  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  //快捷键注册 模型切换
  globalShortcut.register('CommandOrControl+Y', () => {
    //  notif.show();
    var submenus = contextMenu.items[0].submenu.items;
    for (var i = 0; i < submenus.length; i++) {
      if (submenus[i].checked) {
        var n = i == (submenus.length - 1) ? 0 : i + 1;
        _function.changeModel(submenus[n],windowId);
        //contextMenu.items[0].submenu.items[i].checked = false;
        submenus[n].checked = true;
        break;
      }
    }
  });
  //快捷键注册 换装
  globalShortcut.register('CommandOrControl+J', () => {
    var window = BrowserWindow.fromId(windowId);
    //发送换装消息
    window.webContents.send('asynchronous-reply', 'ping')
  });

  //快捷键json数据格式化
  globalShortcut.register('CommandOrControl+T', () => {
      spawn.execFile(path.join(__dirname,"/sh/JsonUtils.sh"),function(error){
        if (error !== null) {
          console.log('exec error: ' + error);
          return
        }
      });
  });

  // test()
  appTray = _function.setMenu(systemObj,windowId)
  //开启邮箱提醒
  if (systemObj["emailFlag"]) initSystemSetUp();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})


app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

//添加自动播放
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

//监听拖放删除
ipcMain.on('deletefile', (event, filePath) => {
  for (var i in filePath) {
    //移动到废纸篓
    // var command = "mv " + filePath[i] + "  ~/.Trash/";
    // spawn.exec(command);
    var flag = shell.moveItemToTrash(filePath[i]);
    if (flag == true) shell.beep();
  }
});

//监听渲染器进程发送过来的消息
ipcMain.on('system-set-up', (event, arg) => {
  var window = BrowserWindow.fromId(systemWindowId);
  window.close();
  if (arg == 'cancel') {
    return;
  } else {
    console.log(arg) // prints "ping"
    if (arg.emailFlag) {
      imap.end();
      //根据用户填写信息设置
      imap = new Imap({
        user: arg.email,
        password: arg.password,
        host: arg.pop
      });
      //开启email定时执行
      setEmailInterval();
      //监听
      imapReady();
    }
    var obj = {};
    obj.label = arg.model;
    systemObj.change_texure_way = arg.change_texure_way;
    systemObj.model = arg.model;
    systemObj.website = arg.website;
    //更正声音设置
    var mainWindow = BrowserWindow.fromId(windowId);
    mainWindow.webContents.send('set-up-sound', arg.sound)
    //设置标题
    appTray.setTitle("\u001b[34m " + arg.menutext);
    var submenus = contextMenu.items[0].submenu.items;
    for (var i = 0; i < submenus.length; i++) {
      if (submenus[i].label == arg.model) {
        _function.changeModel(submenus[i],windowId);
        //contextMenu.items[0].submenu.items[i].checked = false;
        submenus[i].checked = true;
        break;
      }
    }
  }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// //打开微信支付界面
// function wechatpay(bounds) {
//   //let displays = electron.screen.getCursorScreenPoint()
//   let wechatWindow = new BrowserWindow({
//     x: bounds.x - 100,
//     y: bounds.y,
//     width: 300,
//     height: 400,
//     title: '资助贫困人口'
//   });
//   wechatWindow.loadFile(path.join(__dirname, '/view/wechat.html'))
// }

//初始化imap
var imap = null;

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

function imapReady() {
  if (imap != null) {
    var emailObj = {};
    imap.on('ready', function () {
      openInbox(function (err) {
        var result = [];
        console.log("打开邮箱")
        imap.expunge();
        if (err) throw err;
        imap.search(['UNSEEN', ['SINCE', 'May 20, 2017']], function (err, results) { //搜寻2017-05-20以后未读的邮件
          if (err) throw err;
          if (results.length == 0) {
            imap.end();
            return;
          }
          var f = imap.fetch(results, {
            bodies: ''
          }); //抓取邮件（默认情况下邮件服务器的邮件是未读状态）
          //没有邮件,退出
          if (f == undefined) {
            imap.end();
            return;
          }
          f.on('message', function (msg) {
            var mailparser = new MailParser();
            msg.on('body', function (stream) {
              stream.pipe(mailparser); //将为解析的数据流pipe到mailparser
              //邮件头内容
              mailparser.once("headers", function (headers) {
                // console.log("邮件主题: " + headers.get('subject'));
                // console.log("发件人: " + headers.get('from').text);
                // // console.log("收件人: " + headers.get('to').text);
                emailObj['subject'] = headers.get('subject');
                emailObj['from'] = headers.get('from').text;
              });
              //邮件内容
              mailparser.on("data", function (data) {
                if (data.type === 'text') { //邮件正文
                  emailObj['type'] = "text";
                  emailObj['text'] = data.text;
                  emailObj['html'] = data.html;
                }
                if (data.type === 'attachment') { //附件
                  emailObj['type'] = "attachment";
                  emailObj['filename'] = data.filename;
                  emailObj['text'] = data.filename + "已为您保存到本地。";
                  data.content.pipe(fs.createWriteStream(data.filename)); //保存附件到当前目录下
                  data.release();
                }
              });
            });
            msg.on('end', function () {
              // console.log(seqno + '完成');
              if ( emailObj.hasOwnProperty("type")) {
                emails.push(emailObj);
                //添加已阅读标志
                imap.addFlags(results, "SEEN");
                result.push(results);
              }
            });
          });
          f.on('error', function (err) {
            console.log('抓取出现错误: ' + err);
          });
          f.on('end', function () {
            // console.log('所有邮件抓取完成!');
            //imap.end();
            if (emails.length > 0) {
              var msg = emails.length > 1 ? "邮箱里总共有" + (emails.length) + "封未读邮件" : "";
              //调用通知
              notif = new Notification({
                title: emails[0].subject,
                subtitle: msg,
                body: emails[0].text,
                hasReply: true
                // icon : path.join(trayIcon, './img/tomato.png')
              });
              notif.show();
              notif.once('click', function () {
                if (!emails[0].hasOwnProperty("filename")) {
                  //用户点击了邮件
                  let emailWindow = new BrowserWindow({
                    x: appTray.getBounds().x - 100,
                    y: appTray.getBounds().y,
                    width: 400,
                    height: 300,
                    darkTheme: true,
                    titleBarStyle: "hidden",
                    webPreferences: {
                      nodeIntegration: true
                    }
                  });
                  global.sharedObject = {
                    someProperty: emailObj
                  };
                  emailWindow.loadFile(path.join(__dirname, '/view/email.html'));
                } else {
                  shell.showItemInFolder("./" + emails[0].filename);
                }
              });
              notif.once('reply', function (event, reply) {
                if (reply == 'RM') {
                  imap.addFlags(result[0], "Deleted");
                  imap.expunge(result[0]);
                }
              });
            }
          });
        });
      });
    });

    imap.on('error', function (err) {
      console.log(err);
    });

    imap.on('end', function () {
      console.log('关闭邮箱');
      //未读邮件数大于0,调用通知。
    });

    imap.on('expunge', function (seqno) {
      //
      console.log("已删除消息" + seqno);
    });
  }
}

// function changeModel(event) {
//   //event.checked = true;
//   //更换模型
//   var window = BrowserWindow.fromId(windowId);
//   //发送消息
//   window.webContents.send('changemodel', event.label);
// }