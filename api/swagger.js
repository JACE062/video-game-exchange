const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'});

const doc = {
  info: {
    version: '',            // by default: '1.0.0'
    title: 'Video Game Exchange API',              // by default: 'REST API'
    description: 'An API for listing and trading Retro Video Games between users'         // by default: ''
  },
  servers: [
    {
      url: 'http://localhost:5000/',              // by default: 'http://localhost:3000'
      description: 'Locally hosted node server port'       // by default: ''
    },
    // { ... }
  ],
  tags: [                   // by default: empty Array
    {
      name: '',             // Tag name
      description: ''       // Tag description
    },
    // { ... }
  ],
  components: {}
};

const outputFile = './openapi-doc.json';
const routes = ['./index.js'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);