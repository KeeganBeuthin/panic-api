import {OpenAPIBackend} from 'openapi-backend';;
import express from 'express';
import postgres from 'postgres';



const app = express();
app.use(express.json());

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
            200: { description: 'ok' },
          },
      },
      post: {
        operationId: 'postTransaction',
        requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Transaction'
            },
          },
        },

        },
        responses: {
          200: {description: 'Valid'}
        }
    },
  },
      '/transactions/{id}': {
        get: {
          operationId: 'getTransactionById',
          responses: {
            200: { description: 'ok' },
          },
        
        
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
      },
    },
  },
  components: {
schemas: {
  Transaction: {
type: 'object',
properties: {
  id: {
    type: 'integer'
  },
  amount: {
    type: 'integer'
  }
},
required: ['id', 'name', 'create_time']
},
},
  },
  },
  handlers: {
    async postTransaction() {
      const id = await generateUniqueId()
  
  const result = await sql`
    INSERT INTO transactions (id, create_time, name, value) VALUES (${id}, now(), ${'Mathew'}, ${value})
  `
  
  console.log(`New transaction created with ID ${id} and Value ${value}`)
  return result
      
    },

    
    async getTransactionById(id) {
      const transaction = await sql`
      select * from transactions where id= ${55606}`
      console.log(transaction)
      return transaction
    } ,

   async getTransactions(){

      const transactions = await sql`
      select * from transactions`
      console.log(transactions)
      return transactions
      
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
