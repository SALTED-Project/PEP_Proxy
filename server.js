const express = require('express');
const session = require('express-session');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const Keycloak = require('keycloak-connect');
const CONFIG = require("./config.json");
const memoryStore = new session.MemoryStore();

// setup
const keycloak = new Keycloak({ store: memoryStore });
const broker_url = CONFIG.broker_protocol + '://' + CONFIG.broker_ip + ':' + CONFIG.broker_port;
const app = express();
app.use(session({
    secret: CONFIG.session_secret,
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));
app.use(express.json({type:['application/ld+json',"application/json"]}));
app.use(keycloak.middleware());
app.use(cors());

// forward allowed requests to the broker
async function forward(request, response) {
    try {
        var fw_headers = request.headers;
        delete fw_headers["authorization"];
        fw_headers["content-length"] = Buffer.byteLength(JSON.stringify(request.body));
        var req = {
            method: request.method,
            url:    broker_url + request.originalUrl,
            data:   request.body,
            headers: fw_headers
        }
        var res = await axios(req);
        response.status(res.status).set(res.headers).send(res.data);
    } catch (error) {
        if (error.response) {
            // Status code >= 300
            console.log(error.response.data);
            response.status(error.response.status).send(error.response.data);
          } else if (error.request) {
            // No response
            console.log(error.request);
            response.send(error.request);
          } else {
            // Generic error
            console.log('Error', error.message);
            response.send(error.message);
          }
    }
}

// check host
app.use('*', (req, res, next) => {
    if (req.hostname == CONFIG.host_name) {
        next();
    } else {
        console.log('Invalid hostname "%s" was requested',req.hostname);
        res.status(400).send('Invalid hostname');
    }
});

// CSOURCE
app.get('/ngsi-ld/v1/csourceRegistrations*', keycloak.enforcer('csourceRegistrations (Resource):GET'), (req, res) => { forward(req,res) });
app.post('/ngsi-ld/v1/csourceRegistrations*', keycloak.enforcer('csourceRegistrations (Resource):POST'), (req, res) => { forward(req,res) });
app.put('/ngsi-ld/v1/csourceRegistrations*', keycloak.enforcer('csourceRegistrations (Resource):PUT'), (req, res) => { forward(req,res) });
app.patch('/ngsi-ld/v1/csourceRegistrations*', keycloak.enforcer('csourceRegistrations (Resource):PATCH'), (req, res) => { forward(req,res) });
app.delete('/ngsi-ld/v1/csourceRegistrations*', keycloak.enforcer('csourceRegistrations (Resource):DELETE'), (req, res) => { forward(req,res) });

// ENTITIES
app.get('/ngsi-ld/v1/entities*', keycloak.enforcer('Entities (Resource):GET'), (req, res) => { forward(req,res) });
app.post('/ngsi-ld/v1/entities*', keycloak.enforcer('Entities (Resource):POST'), (req, res) => { forward(req,res) });
app.put('/ngsi-ld/v1/entities*', keycloak.enforcer('Entities (Resource):PUT'), (req, res) => { forward(req,res) });
app.patch('/ngsi-ld/v1/entities*', keycloak.enforcer('Entities (Resource):PATCH'), (req, res) => { forward(req,res) });
app.delete('/ngsi-ld/v1/entities*', keycloak.enforcer('Entities (Resource):DELETE'), (req, res) => { forward(req,res) });

// ENTITYOPS
app.post('/ngsi-ld/v1/entityOperations/delete', keycloak.enforcer('EntityOps delete (Resource):POST'), (req, res) => { forward(req,res) });
app.post('/ngsi-ld/v1/entityOperations/update', keycloak.enforcer('EntityOps post (Resource):POST'), (req, res) => { forward(req,res) });
app.post('/ngsi-ld/v1/entityOperations/create', keycloak.enforcer('EntityOps post (Resource):POST'), (req, res) => { forward(req,res) });
app.post('/ngsi-ld/v1/entityOperations/upsert', keycloak.enforcer('EntityOps post (Resource):POST'), (req, res) => { forward(req,res) });

// SUBSCRIPTIONS
app.get('/ngsi-ld/v1/subscriptions*', keycloak.enforcer('Subscriptions (Resource):GET'), (req, res) => { forward(req,res) });
app.post('/ngsi-ld/v1/subscriptions*', keycloak.enforcer('Subscriptions (Resource):POST'), (req, res) => { forward(req,res) });
app.put('/ngsi-ld/v1/subscriptions*', keycloak.enforcer('Subscriptions (Resource):PUT'), (req, res) => { forward(req,res) });
app.patch('/ngsi-ld/v1/subscriptions*', keycloak.enforcer('Subscriptions (Resource):PATCH'), (req, res) => { forward(req,res) });
app.delete('/ngsi-ld/v1/subscriptions*', keycloak.enforcer('Subscriptions (Resource):DELETE'), (req, res) => { forward(req,res) });

// TEMPORAL
app.get('/ngsi-ld/v1/temporal/entities*', keycloak.enforcer('Temporal (Resource):GET'), (req, res) => { forward(req,res) });
app.post('/ngsi-ld/v1/temporal/entities*', keycloak.enforcer('Temporal (Resource):POST'), (req, res) => { forward(req,res) });
app.put('/ngsi-ld/v1/temporal/entities*', keycloak.enforcer('Temporal (Resource):PUT'), (req, res) => { forward(req,res) });
app.patch('/ngsi-ld/v1/temporal/entities*', keycloak.enforcer('Temporal (Resource):PATCH'), (req, res) => { forward(req,res) });
app.delete('/ngsi-ld/v1/temporal/entities*', keycloak.enforcer('Temporal (Resource):DELETE'), (req, res) => { forward(req,res) });

// TYPES
app.get('/ngsi-ld/v1/types', keycloak.enforcer('Types (Resource):GET'), (req, res) => { forward(req,res) });

// default
app.use('*', (req, res) => {
    console.log('Invalid endpoint "%s" was requested',req.originalUrl);
    res.status(404).send('Requested endpoint not found or not available');
});

// add TLS and listen
const server = https.createServer({
    cert: fs.readFileSync(CONFIG.cert_file),
    key: fs.readFileSync(CONFIG.key_file)
},app).listen(CONFIG.listen_port, () => {
    console.log('Server listening on port %d',CONFIG.listen_port);
});

// handle interruption
process.on('SIGTERM', () => {
    console.log('SIGTERM received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
});