import {OpenAPIBackend} from 'openapi-backend';;
import express from 'express';
import postgres from 'postgres';
import Ajv from "ajv"
import addFormats from "ajv-formats"



const ajv = new Ajv()
addFormats(ajv)

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sql = postgres('postgres://Rat:hahaha@127.0.0.1:5432/Rat')



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
      '/transactions': {
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
  '/transactions/create':{
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
      '/transactions/{id}': {
        get: {
          operationId: 'getTransactionById',
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
    
  },
  components: {
    schemas: {
      Transaction: {
        $ref: '#/components/schemas/TransactionProperties'
      },
      TransactionProperties: {
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

    
    async getTransactionById(c, req, res) {
      
      const {id}= parseInt(req.params.id);
      console.log(req.params);
      const transaction = await sql`
        SELECT * FROM transactions WHERE id = ${id}
      `;
      console.log("transaction:", transaction);
      if (transaction.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      return res.status(200).json({ data: transaction });
    },

    async getTransactions(c, req, res) {
      const transaction = await sql`
        SELECT * FROM transactions 
      `;
      if (transaction.length === 0) {
        return res.status(404).json({ error: 'Transactions not found' });
      }
      return res.status(200).json({ data: transaction });
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
