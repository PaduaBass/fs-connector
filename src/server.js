const express = require('express');
const cors = require('cors');
const { Socket } = require('net');
const { Buffer } = require('buffer');
const os = require('os');
 
const server = express();

server.use(express.json());
server.use(cors({ origin: '*' }));


let home = {
    blackout: false,
    freeze: false,
    favorite: false,
    fog: false,
  };
  
  
  let playbacks = [];
  let overrides = [];
  
  let isConvertOverrides = true;
  let isConvertLabels = true;
  
  let socket;
  let count = 0;
  
  
  
  if(socket) {
    socket.on('data', (data) => {
      console.log(data);
    })
  }
  
  const convertDataHome = (data) => {
    home.blackout = data.split(',')[1] === '1' ?? false;
    home.favorite = data.split(',')[3] === '1' ?? false;
    home.freeze = data.split(',')[2] === '1' ?? false;
  }
  
  const convertDataPlaybacks = (data) => {
    if(isConvertLabels) {
      playbacks = [];
      let array = data.split(',');
      array.shift();
      array.forEach((t, i) => {
          playbacks.push({ 
            label: t, 
            status: false,
            timeScene: 100,
            code: `FSOC0${46 + i}255`,
          });
      });
      if(playbacks.length === 20) {
        isConvertLabels = false;
      }
    }
  };
  
  
  const convertDataOverrides = (data) => {
    if(isConvertOverrides) {
      overrides = [];
      let array = data.split(',');
      array.shift();
      array.forEach((t, i) => {
          overrides.push({ 
            label: t, 
            status: false,
            code: `FSOC0${66 + i}255`,
          });
      });
      if(overrides.length === 30) {
        isConvertOverrides = false;
      }
    }
  };
    
  const convertStatusPlaybacks = (data) => {
    let array = data.split(',');
    array.shift();
    if(array.length === playbacks.length) {
      array.forEach((st, i) => {
        playbacks[i].status = st === '1' ?? false;
      });
    }
  }
  
  const getData = async () => {
    let intervalHome = setInterval(() => {
      if(count > 1) {
        clearInterval(intervalHome);
        count = 0;
      }
    
      if(socket) {
        socket.on('data', (data) => {
          let dataString = Buffer.from(data).toString();
          if(dataString.includes('F')) {
            console.log(dataString);
            convertDataHome(dataString);
            clearInterval(intervalHome);
          } 
        });
      }
      count++;
    }, 5);
  }
  
  
  const updateStatusPlaybacks = async () => {
    let intervalHome = setInterval(() => {
      console.log('intervalo rolando')
      if(count > 1) {
        clearInterval(intervalHome);
        count = 0;
      }
  
      if(socket) {
        socket.on('data', (data) => {
          let dataString = Buffer.from(data).toString();
          if(dataString.includes('F')) {
            convertStatusPlaybacks(dataString);
            clearInterval(intervalHome);
          } 
        });
      }
      count++;
    }, 5);
  }
  
  
  
  const convertStatusOverrides = (data) => {
    console.log('convertendo status over', data);
    let array = data.split(',');
    array.shift();
    if(array.length === overrides.length) {
      array.forEach((st, i) => {
        overrides[i].status = st === '1' ?? false;
      });
    }
  }
  
  const updateStatusOverrides = async () => {
    let intervalHome = setInterval(() => {
      if(count > 1) {
        clearInterval(intervalHome);
        count = 0;
      }
  
      if(socket) {
        socket.on('data', (data) => {
          let dataString = Buffer.from(data).toString();
          if(dataString.includes('F')) {
            convertStatusOverrides(dataString);
            clearInterval(intervalHome);
          } 
        });
      }
      count++;
    }, 5);
  }
  
  
  const getDataOverrides = async () => {
    let intervalHome = setInterval(() => {
      if(count > 1) {
        clearInterval(intervalHome);
        count = 0;
      }
  
      if(socket) {
        socket.on('data', (data) => {
          let dataString = Buffer.from(data).toString();
          if(dataString.includes('F')) {
            convertDataOverrides(dataString);
            clearInterval(intervalHome);
          } 
        });
      }
      count++;
    }, 5);
  }
  
  
  const getDataPlaybacks = async () => {
    let intervalHome = setInterval(() => {
      if(count > 1) {
        clearInterval(intervalHome);
        count = 0;
      }
  
      if(socket) {
        socket.on('data', (data) => {
          let dataString = Buffer.from(data).toString();
          if(dataString.includes('F')) {
            convertDataPlaybacks(dataString);
            clearInterval(intervalHome);
          } 
        });
      }
      count++;
    }, 5);
  }
  
async function conectionSocket (ip, port)  {
    console.log(port);
    console.log(ip)
    try {
      if(!socket) {
        socket = new Socket();
        socket.connect(port, ip, () => {
          console.log('Conectou')
          socket?.write('FSBC014');
        });
        
      }
      
      // console.log('validação', socket.on)
    } catch (e) {
      console.log('caiu aqui', e)
    }
  
  }

  
server.get('/', (req, res) => {
    const network = os.networkInterfaces();
    if (!socket) {

    }
    return res.json({ interfaces: network });
  });

server.put('/', async (req, res) => {
    
    try {
      let response = {};
  
      if(socket) {
        
        socket.write(req.body.command);
  
        if(req.body.subCommand) {
          socket.write(req.body.subCommand, (e) => {
          });
          if(req.body.home) {
            console.log('home');
            await getData();
          }
  
          if(req.body.playbacks) {
            console.log('playbacks')
  
            await getDataPlaybacks();
          }
          if(req.body.buttons) {
            console.log('buttons');
            await getData();
          }
  
          if(req.body.statusOR) {
            await updateStatusOverrides();
          }
  
          if(req.body.overrides) {
            await getDataOverrides();
          }
  
          if(req.body.statusPB) {
            console.log('playbackStatus')
            await updateStatusPlaybacks();
          }
          // intervalHome.refresh();
        }
        
      }
  
      return new Promise(async (resolve) => {
  
       setTimeout(() => {
        resolve(res.json({ home, playbacks, overrides }));
       }, 5);
        
  
      })
    } catch(e) {
      console.log(e);
    }
});

server.delete('/', (req, res) => {
    console.log(socket);
    if(socket) {
      socket.end();
      socket = null;
    }
  
    // const { ip, port } = req.body as any;
    try {
      return res.json({ status: false })
    } catch (e) {
      console.log(e);
    }
});
  
server.post('/', async (req, res) => {
   // const { ip, port } = req.body as any;
   try {

    console.log('iniciando conexão');
    await conectionSocket(req.body.ip, req.body.port);
    return new Promise(resolve => {
      setTimeout(() => {
        if(socket?.errored) {
          resolve(res.json({ status: false }))
        } else {
          resolve(res.json({ status: true }))
        }
      }, 1000);
    })
  } catch (e) {
    console.log('errro', e);
  }
});



server.listen(4444, (req, res) => {
   console.log('servidor iniciado na porta 4444 🚀');
})

