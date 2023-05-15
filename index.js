import {OpenAPIBackend} from 'openapi-backend';;
import express, { query } from 'express';
import postgres from 'postgres';
import Ajv from "ajv"
import addFormats from "ajv-formats"
import bodyParser from 'body-parser'
import pkg from 'body-parser';
import cors from 'cors'
const { json } = pkg;






const sql = postgres('postgres://Rat:hahaha@127.0.0.1:5432/Rat')
const ajv = new Ajv()
addFormats(ajv)

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: '*'
  })
)

//functions cause im dumb
function generateSequence() {
  const min = 10000 
  const max = 99999 
  const sequence = Math.floor(Math.random() * (max - min + 1) + min)
  return sequence 
}


async function generateUniqueId() {
  let isUnique = false
  let sequence = ''
  

  while (!isUnique) {
    sequence = generateSequence()
    const transaction = await sql`
      SELECT * FROM transactions WHERE id = ${sequence}
    `
    if (transaction.length === 0) {
      isUnique = true
    }
  }
  console.log(sequence)
  return sequence
  
}


const value =generateSequence()

// define api
const api = new OpenAPIBackend({
  definition: {
    openapi: '3.0.1',
    info: {
      title: 'My API',
      version: '1.0.0',
    },
    paths: {
      '/transaction': {
        get: {
          operationId: 'getTransactions',
          responses: {
            200: { description: 'ok',
          content:{
            'application/json':{
              schema:{
                $ref: '#/components/schemas/Transaction'
              }
            }
          }},
          },
      },
  },
  '/transaction/create':{
    post: {
      operationId: 'postTransaction',
      requestBody: {
        content: {
          'application/json': {
          }
        }
      },
      responses: {
        200: {description: 'ok'}
      },
    },
  },
      '/transaction/{id}': {
        get: {
          operationId: 'getTransactionById',
          responses: {
            200: { description: 'ok',
            content:{
              'application/json':{
                schema:{
                  $ref: '#/components/schemas/Transaction'
                }
              }
            }},
          },
      },
      parameters: [
        {
          name: 'id',
          in: 'path',
          schema: {
            type: 'integer',
          },
          required: true
        },
      ],
    },
    
  },
  components: {
    schemas: {
      Transaction: {    
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          create_time:{
            type: 'string',
          },
          name:{
            type: 'string'
          },
          value: {
            type: 'integer'
          }
        },
        required: ['id', 'create_time', 'name', 'value'],
      },
    },
  },
},
  handlers: {

    async postTransaction(c, req, res) {
      const {name}= req.body;
      const id= await generateUniqueId()
     console.log(req.body)
     
      
      const value = generateSequence();

  const result = await sql`
    INSERT INTO transactions (id, create_time, name, value) VALUES (${id}, now(), ${name}, ${value})
  `
  
  console.log(`New transaction created with ID ${id} and Value ${value}`)
  return res.status(200).json({data: id, value, name,})
      
    },

    
    getTransactionById: async (c, req, res) => {
      
      const id = c.request.params.id
      
      const transaction = await sql`
      SELECT * FROM transactions WHERE user_id =${id}
      `
     
    
    
      if (transaction.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      console.log(transaction)
      return res.status(200).json({transaction }); 
    },

     getTransactions: async(c, req, res) =>{
       const Transactions= await sql`
        SELECT * FROM transactions 
      `;
      if (Transactions.length === 0) {
        return res.status(404).json({ error: 'Transactions not found' });
      }
      return res.status(200).json({Transactions});
    },
    
    
    
    

    validationFail: async (c, req, res) => res.status(400).json({ err: c.validation.errors }),
    notFound: async (c, req, res) => res.status(404).json({ err: 'not found' }),

  },
}
);


api.init();

// use as express middleware
app.use((req, res) => api.handleRequest(req, req, res));

// start server
app.listen(9000, () => console.info('api listening at http://localhost:9000'));
