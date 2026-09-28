const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('nogajengDesktop',{isDesktop:true,setCount:count=>{if(Number.isInteger(count))ipcRenderer.send('alert-count',count)},onAcknowledge:callback=>{ipcRenderer.on('ack-alerts',()=>callback())}});
