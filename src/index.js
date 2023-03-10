// var Routes = require('./routes')
var fs = require('fs');
var https = require('https');
var faceapi = require("face-api.js");
var path = require('path');
var MongoClient = require("mongodb").MongoClient;
var bodyParser = require('body-parser')
var shortid = require('shortid');
const history = require('connect-history-api-fallback');
const simpleParser = require('mailparser').simpleParser;
const tf = require("@tensorflow/tfjs");
const canvas = require('canvas')
const express = require('express')
const formidable = require('express-formidable')
const fetchBlog = require('./crawler')

var app = express(); // define our app using express

var options = {
  pfx: fs.readFileSync(path.join(__dirname + '/ssl', '7656805_www.wangtz.cn.pfx')),
  passphrase: 'yHJ3yh3i'
}

let server = https.createServer(options,app);

app.use(history());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(formidable());

// load modal
async function LoadModels() {
  await faceapi.nets.faceRecognitionNet.loadFromDisk(__dirname + "/models");
  await faceapi.nets.faceLandmark68Net.loadFromDisk(__dirname + "/models");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(__dirname + "/models");
  console.log('modal loaded')
}
// LoadModels()
var faceMatcher;

async function initFaceMatcher () {
  console.log('init face matcher')
  const img = await canvas.loadImage('./zjzw.png');
  const x = getTfBrowserImg(img)

  const detections = await faceapi.detectSingleFace(x).withFaceLandmarks().withFaceDescriptor();

  const face = new faceapi.LabeledFaceDescriptors('wangtianzhu', [new Float32Array(Object.values(detections.descriptor))]);
  const matcher = new faceapi.FaceMatcher([face], 0.6);

  faceMatcher = matcher
  console.log('face matcher init success!')

  return matcher
}

function getTfBrowserImg (img) {
  const myCanvas = canvas.createCanvas(img.width, img.height)
  const ctx = myCanvas.getContext('2d')
  ctx.drawImage(img, 0, 0, img.width, img.height)
  const x = tf.browser.fromPixels(myCanvas)

  return x
}

async function checkface (imagePath) {
  // await LoadModels()
  console.log(imagePath, 'imagePath')

  const target = await canvas.loadImage(imagePath);
  const targetx = getTfBrowserImg(target)

  const tragetdetections = await faceapi.detectSingleFace(targetx).withFaceLandmarks().withFaceDescriptor();
  const result = faceMatcher.findBestMatch(tragetdetections.descriptor)

  console.log(result, 'detections')
  return result
}

function getRange(range,stats){
	var r=range.match(/=(\d+)-(\d+)?/)
	var start=r[1]
	var end=r[2]||stats.size-1
	return [parseInt(start),parseInt(end)];
}

// ??????????????????
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, DELETE, PUT")
  next();
});

// ?????????????????????
app.post('/eassy', function (req, res) {
  console.log("???????????????")
  console.log(req.body)
  var url = "mongodb://localhost:27017/markdown";
  let id = shortid.generate()
  req.body.id = id
  MongoClient.connect(url, function (err, client) {
    //client?????????????????????????????????mongoclient(?????????????????????????????????)
    if (err) {
      console.log("?????????????????????");
      console.log(err, 'err')
      return;
    }
    console.log("?????????????????????");
    //3.0?????????
    var db = client.db("markdown");
    db.collection("workdaily").insertOne(req.body, function (err, result) {
      if (err) {
        res.send("??????????????????");
        console.log("??????????????????")
        return;
      } else {
        res.send({
          id,
        })
        console.log("??????????????????", id)
      }
    })
  })
})

// ?????????????????????
app.get('/eassy', function (req, res) {
  console.log('?????????GET??????')
  var query = req.query
  console.log(query, 'query')
  var url = "mongodb://localhost:27017/markdown";
  MongoClient.connect(url, {
    useNewUrlParser: true
  }, function (err, client) {
    if (err) {
      console.log("?????????????????????");
      console.log(err, 'err')
      return;
    }
    console.log("?????????????????????");
    //3.0?????????
    var db = client.db("markdown");
    db.collection("workdaily").find({
      id: query.id
    }).toArray().then(result => {
      console.log(result)
      res.send(result)
    })
  });
})

app.delete('/eassy', function (req, res){
  console.log('?????????Delete??????')
  var query = req.query
  console.log(query, 'query')
  var url = "mongodb://localhost:27017/markdown";
  MongoClient.connect(url, {
    useNewUrlParser: true
  }, function (err, client) {
    if (err) {
      console.log("?????????????????????");
      console.log(err, 'err')
      return;
    }
    console.log("?????????????????????");
    //3.0?????????
    var db = client.db("markdown");
    db.collection("workdaily").remove({
      id: query.id
    }).then(result => {
      console.log(result)
      res.send(result)
    })
  });
})

// ??????????????????
app.get('/blogTable', (req, res) => {
  console.log(req.query.classify, 'query')
  var url = "mongodb://localhost:27017/markdown";
  MongoClient.connect(url, {
    useNewUrlParser: true
  }, (err, client) => {
    if (err) {
      console.log("?????????????????????");
      console.log(err, 'err')
      return;
    }
    var db = client.db("markdown");
    if (req.query.classify !== undefined) {
      db.collection("workdaily").find({
        classify: req.query.classify
      }).toArray().then(result => {
        console.log('????????????')
        res.send(result)
      })
    } else {
      db.collection("workdaily").find().toArray().then(result => {
        console.log('????????????')
        res.send(result)
      })
    }
  })
})

app.get('/msg', (req, res) => {
  var url = "mongodb://localhost:27017/visitor";
  MongoClient.connect(url, {
    useNewUrlParser: true
  }, (err, client) => {
    if (err) {
      console.log("?????????????????????");
      console.log(err, 'err')
      return;
    }
    var db = client.db("visitor");
    db.collection("visitor").find().toArray().then(result => {
      console.log('????????????')
      res.send(result)
    })
  })
})

app.get('/resume.mp4', (req, res) => {
  fs.stat('./resume.mp4',(err,stats)=>{
    console.log(req.headers['range'], 'range')
    let start = 0,
        end = 1;
    if (req.headers['range']) {
      [start,end]=getRange(req.headers['range'],stats)
    }

    res.setHeader('Content-Range',`bytes ${start}-${end}/${stats.size}`)
    res.setHeader('Content-Type','video/mp4')
    res.setHeader('Content-Length',end==start?0:end-start+1)
    res.writeHead(206)
    fs.createReadStream('./resume.mp4',{
      start:start,
      end:end
    }).pipe(res)

  })
  return
})

app.post('/msg', function (req, res) {
  console.log("???????????????")
  console.log(req.body)
  var url = "mongodb://localhost:27017/visitor";
  let id = shortid.generate()
  req.body.id = id
  MongoClient.connect(url, function (err, client) {
    //client?????????????????????????????????mongoclient(?????????????????????????????????)
    if (err) {
      console.log("?????????????????????");
      console.log(err, 'err')
      return;
    }
    console.log("?????????????????????");
    //3.0?????????
    var db = client.db("visitor");
    db.collection("visitor").insertOne(req.body, function (err, result) {
      if (err) {
        res.send("??????????????????");
        console.log("??????????????????")
        return;
      } else {
        res.send({
          id,
        })
        console.log("??????????????????", id)
      }
    })
  })
})

app.get('/newmail', (req, result) => {
  console.log(req.query, 'req')
    fs.readdir('/home/wangtianzhu/Maildir/new', (err, res) => {
      const fileName = res && res[res.length - (Number(req.query.index) || 4)]
      fs.readFile('/home/wangtianzhu/Maildir/new/' + fileName, async (err, data) => {
        let parsed = await simpleParser(data);
        result.send(parsed)
      })
    })
})

app.post('/faceDetection', async (req, res) => {
  const faceMatchRes = await checkface(req.files.file.path)

  fs.unlink(req.files.file.path, function(error){
      if(error){
          console.log(error);
          return false;
      }
      console.log('??????????????????');
  })

  if (faceMatchRes && faceMatchRes._distance < 0.6) {
    res.send({ isPass: true, matchTarget: faceMatchRes})
  } else {

    res.send({ isPass: false, matchTarget: faceMatchRes})
  }
})

app.get('/fetchblog', async (req, res) => {
  console.log(req, 'req')

  const data = await fetchBlog('https://blog.csdn.net/weixin_47375788/article/details/126408703')
  console.log(data, 'fetchBlog ')

  
})

console.log(fetchBlog, '????????????')

async function main() {
  try {
    await LoadModels()
    await initFaceMatcher()
  } catch (error) {
    console.log('boot error:', error)
  }

  server.listen('8087', (req, res) => {
    console.info(`?????????????????????????????????8087`)
  })
} 

main()