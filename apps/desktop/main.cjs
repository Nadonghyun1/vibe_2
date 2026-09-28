const {app,BrowserWindow,Tray,Menu,nativeImage,ipcMain}=require('electron');
const path=require('path');const ORIGIN='https://nogajeng.helionlife.net';let win,tray,quitting=false;
if(!app.requestSingleInstanceLock())app.quit();else{
app.on('second-instance',()=>{win?.show();win?.focus()});
app.whenReady().then(()=>{
 app.setAppUserModelId('net.helionlife.nogajeng.manager');
 win=new BrowserWindow({width:1120,height:850,minWidth:380,minHeight:600,show:false,title:'노가정 예약 관리',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,partition:'persist:nogajeng-manager'}});
 win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',(e,url)=>{try{if(new URL(url).origin!==ORIGIN)e.preventDefault()}catch{e.preventDefault()}});
 win.on('close',e=>{if(!quitting){e.preventDefault();win.hide()}});
 win.once('ready-to-show',()=>win.show());
 win.loadURL(ORIGIN+'/admin.html');
 tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'tray.png')));tray.setToolTip('노가정 예약 관리 · 로그인 후 알림을 켜주세요');
 tray.setContextMenu(Menu.buildFromTemplate([{label:'예약 관리 열기',click:()=>{win.show();win.focus()}},{label:'알림 확인 · 소리 멈춤',click:()=>win.webContents.send('ack-alerts')},{type:'separator'},{label:'앱 완전히 종료',click:()=>{quitting=true;app.quit()}}]));tray.on('double-click',()=>win.show());
 ipcMain.on('alert-count',(event,count)=>{if(event.sender!==win.webContents||event.senderFrame?.url!==ORIGIN+'/admin.html'||!Number.isInteger(count)||count<0||count>3000)return;tray.setToolTip(count?`노가정 · 미확인 예약 ${count}건`:'노가정 예약 관리');if(count>0)win.flashFrame(true);else win.flashFrame(false)});
});app.on('before-quit',()=>{quitting=true});app.on('window-all-closed',()=>{if(quitting)app.quit()});}
