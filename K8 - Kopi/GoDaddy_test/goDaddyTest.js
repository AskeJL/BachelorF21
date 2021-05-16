const {createServer} = require('http');
const url = require("url");
var express = require('express');
var app = express();
const cors = require('cors');
const JSONStream = require('json-stream')
const Client = require('kubernetes-client').Client
const config = require('kubernetes-client/backends/request').config

app.use(express.json(), cors());

let pod = {
  "apiVersion": "v1",
  "kind": "Pod",
  "metadata": {
    "name": "godaddypodcreatertest"
  },
  "spec": {
    "containers": [
      {
        "image": "coffeebreak",
        "name": "coffeebreak",
        "imagePullPolicy": "Never",
        "resources": {},
        "ports": [
          {
            "containerPort": 8080
          }
        ]
      }
    ]
  }
}

const Request = require('kubernetes-client/backends/request')
const client = new Client({version: '1.13' })

async function main (client) {
  try {
    
    

    //
    // Fetch all the pods
    const pods = await client.api.v1.namespaces('userpods').pods().get()
    pods.body.items.forEach((item) => {
      console.log(item.metadata.name + " " + item.status.podIP)
    })

    const create = await client.api.v1.namespaces('userpods').pods.post({ body: pod })
    console.log('Create: ', create)

    //
    // Fetch the Deployment from the kube-system namespace.
    //
    /* const deployment = await client.apis.apps.v1.namespaces('default').deployments().get()
    deployment.body.items.forEach((item) => {
      console.log(item.metadata)
    }) */
  } catch (err) {
    console.error('Error: ', err)
  }
}

app.get('/', (request,response) => {
	console.log("get request");
	response.json(AIDS);
	response.end();
});

async function cleanup (client) {
  try {
    await client.api.v1.namespaces('userpods').pods('godaddypodcreatertest').delete()
  } catch (err) {
    console.warn(`Unable to delete pod.  Skipping.`)
  }
}

async function triggerEvents (client) {
  //
  // Trigger some events
  //
  for (let count = 0; count < 3; count++) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log("jeg er i trigger events")
    await client.api.v1.namespaces('userpods').pods.post({ body: pod })
    await new Promise(resolve => setTimeout(resolve, 1000))
    await cleanup(client)
  }
}

async function watchtest (client) {
  try {
    

    //
    // Clean up our cluster and get ready to trigger events.
    //
    await cleanup(client)

    //
    // Get a JSON stream for Deployment events
    //
    console.log("Over Object stream")
    const stream = await client.api.v1.namespaces('userpods').pods.get({qs:{
    watch : 'true', timeoutSeconds : '10'}})
    console.log("jeg er under getObjectStream")
    console.log(stream)
    const jsonStream = await new JSONStream()
    console.log("jeg er ved jsonStream")
    await stream.pipe(jsonStream)
    console.log("jeg er ved stream pipe")
    await jsonStream.on('data', object => {
      console.log('inde i on')
      console.log('Event: ', JSON.stringify(object))
    })

    //
    // Cause Events to be written to `jsonStream`
    //
    await triggerEvents(client)

    //
    // Disconnect from the watch endpoint
    //
    stream.abort() } catch (err) {
      console.error('Error: ', err)
    }}
main(client)
watchtest(client)
app.listen(7000);