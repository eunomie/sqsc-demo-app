const express = require('express');
const async = require('async');
const router = express.Router();
const db = require('../models');
const amqp = require('amqplib');

const processingQueueName = process.env.PROCESSING_QUEUE_NAME || "processingQueue";

const imageWidth = 900;
const imageHeight= 600;
let channel;
let socketIO;


module.exports = function(app) {
  app.use('/', router);
  channel = app.get("rabbitMQChannel");
  socketIO = app.get('socketIO');
};

router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'SquareScale demo'
  });
});

router.post('/launch', function(req, res) {
  let params = req.body;
  console.log(params)
  for (var i = 0; i < imageWidth / params.stepX; i++) {
    publishNewMessage(i * params.stepX, 
      parseInt(params.precision), 
      parseInt(params.stepX), 
      parseInt(params.stepY));
    socketIO.emit('compute_task_created');
  }
  res.sendStatus(200);
});

async function publishNewMessage(col, precision, stepX, stepY) {

  const mandelbrotData = {
    x: 0,
    y: 0,
    scaleX: 1.5,
    scaleY: 1,
    width: imageWidth,
    height: imageHeight,
    step: col,
    stepX : stepX || 10,
    stepY : stepY || imageHeight,
    iter: precision || 10
  };

  await channel.assertQueue(processingQueueName, {
    durable: true
  });

  let msg = Buffer.from(JSON.stringify(mandelbrotData));
  channel.sendToQueue(processingQueueName, msg);
  console.log(" [x] Sent %s", msg);
}
