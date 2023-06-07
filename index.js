import {OpenAPIBackend} from 'openapi-backend';;
import express, { query } from 'express';
import postgres from 'postgres';
import Ajv from "ajv"
import addFormats from "ajv-formats"
import bodyParser from 'body-parser'
import pkg from 'body-parser';
import cors from 'cors'
const { json } = pkg;
import bcrypt, { hash } from 'bcrypt'
import session from 'express-session'
import cookieParser from 'cookie-parser';
import RedisStore from "connect-redis"
import {createClient} from "redis"


const sql = postgres('postgres://Rat:hahaha@127.0.0.1:5432/Rat')
const ajv = new Ajv()
addFormats(ajv)

const app = express();

//client init 
let redisClient = createClient()
redisClient.connect().catch(console.error)

// Initialize store.
let redisStore = new RedisStore({
  client: redisClient,
  prefix: "SessionStore:",
})



app.use(express.json());

app.set('trust proxy', 1)


app.use(
  cors({
    origin: ["http://localhost:3000/login", "http://localhost:3000", "http://localhost:3000/dashboard", 'http://localhost:9000', 'http://localhost:9000/user/getSession', 'https://app.posthog.com'],
    methods: ['GET, POST, OPTIONS, PUT, PATCH, DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type, Authorization, credentials']
  })
);


app.use(session({
  name: 'info',
  store: redisStore,
  secret: '1234',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge:360000000, path:'/', sameSite:'lax', httpOnly:true, secure: true},
}));




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
    '/user' :{
   get:{
    operationId: 'getUsers',
    responses: {
      200: {description: 'ok',
      content:{
        'application/json':{
          schema: {
            $ref: '#/components/schemas/User'
          }
        }
      }},
    },
   },
    },
    '/user/{email}/{password}' :{
      get:{
       operationId: 'loginUser',
       responses: {
         200: {description: 'ok',
         content:{
           'application/json':{
             schema: {
               $ref: '#/components/schemas/User'
             }
           }
         }},
       },
      },
      parameters: [
        {
          name: 'email',
          in: 'path',
          schema: {
            type: 'string',
          },
          required: true
        },
        {
          name: 'password',
          in: 'path',
          schema: {
            type: 'string',
          },
          required: true
        },
      ],
       },
    '/user/{username}/update':{
      put: {
        operationId: 'updatePassword',
        requestBody: {
          content: {
            'application/json': {
              schema:{
                $ref: '#/components/schemas/User'
              }
            }
          }
        },
        responses: {
          200: {description: 'ok'}
        },
      },
      parameters: [
        {
          name: 'username',
          in: 'path',
          schema: {
            type: 'string',
          },
          required: true
        },
      ],
    },
    '/user/{email}': {
      get: {
        operationId: 'getUserByDetails',
        responses: {
          200: { description: 'ok',
          content:{
            'application/json':{
              schema:{
                $ref: '#/components/schemas/User'
              }
            }
          }},
        },
    },
    parameters: [
      {
        name: 'email',
        in: 'path',
        schema: {
          type: 'string',
        },
        required: true
      },
      {
        name: 'password',
        in: 'path',
        schema: {
          type: 'string',
        },
        required: true
      },
    ],
  },
  '/user/create':{
    post: {
      operationId: 'createUser',
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
  '/user/getSession':{
   get:{
    operationId: 'getSession',
    responses: {
      200: {description: 'ok',
      content:{
        'application/json':{
          schema: {
            $ref: '#/components/schemas/User'
          }
        }
      }},
    },
   }
  },
  '/user/logout':{
    delete: {
      operationId: 'logoutUser',
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
          },
          information: {
            type: 'string',
            nullable: true
          },
          target_hash:{
            type:'string'
          },
          transaction_hash:{
            type:'string'
          },
          source_hash:{
            type:'string'
          },
        },
        required: ['id', 'create_time', 'name', 'value','target_hash','transaction_hash','source_hash'],
      },
      User: {
        type: 'object',
        properties: {
          username:{
            type: 'string'
          },
          password:{
            type: 'string'
          },
          createtime: {
            type: 'string'
          },
          email: {
            type: 'string'
          }
        },
        required: ['email','password'],
      }
    },
  },
},
  handlers: {

     postTransaction: async (c, req, res) => {
      const {name, value, information, target_Hash, transaction_Hash, source_Hash } = req.body;

      
      console.log(req.body)
  const result = await sql`
    INSERT INTO transactions (create_time,name,value,information,target_hash,transaction_hash,source_hash) VALUES (now(),${name},${value},${information},${target_Hash},${transaction_Hash},${source_Hash})
  `
  if(!information){
    console.log(`New transaction created with name ${name} and Value ${value}`)
    return res.status(200).json({value, name, target_Hash, transaction_Hash, source_Hash})
    
  }

  console.log(`New transaction created with name ${name} and Value ${value}`)
  return res.status(200).json({value, name, information,target_Hash, transaction_Hash, source_Hash})
    },

    
    getTransactionById: async (c, req, res) => {
      
      const id = c.request.params.id
      
      const transaction = await sql`
      SELECT * FROM transactions WHERE id =${id}
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
      return res.status(200).json(Transactions);
    },
    
    getUsers: async(c, req, res) =>{
    const users = await sql`
    select username from users
    `
    if(users.length ===0){
      return res.status(404).json({error: 'No Users Found'})
    }
    return res.status(200).json(users)
    },


    createUser: async (c, req, res) => {

      

      const {username,email,password,cpassword} = req.body;
     


    

      const usercheck= await sql`
      SELECT * FROM users WHERE username =${username}`

      const emailCheck= await sql`
      SELECT * FROM users WHERE email =${email}`

      
      if(password!==cpassword){
        console.log('password match failed')
        return res.status(400).json({error: 'password match failed'})
      }

      if(usercheck.length===1){
        console.log('username already exists')
        return res.status(400).json({error:'username already exists'})
      }

      if(emailCheck.length===1){
        console.log('email already exists')
        return res.status(400).json({error:'email already exists'})
      }

      const hashPassword = await bcrypt.hash(password, 13)


    console.log('hash completed')
  const result = await sql`
    INSERT INTO users (username,email,password,createtime) VALUES (${username},${email},${hashPassword},now())
  `


console.log(`new user created with username ${username} and email ${email}`)
return res.status(200).json({username, email})
    },

    getUserByDetails: async (c, req, res) => {
      
      const email = c.request.params.email
      const pass = c.request.params.password
      const user = await sql`
      SELECT username FROM Users WHERE username =${email} and password = ${pass}
      `
     
    
    
      if (user.length === 0) {
        return res.status(404).json({ error: 'user not found' });
      }
      console.log(user)
      return res.status(200).json({user}); 
    },

    updatePassword: async (c,req,res) => {
      const name = c.request.params.username
      const pass = req.body.pass
      const newpass =req.body.newpass

      const select = await sql`
      select * from users where username = ${name}
      `
      if(select.length ===0){
        return res.status(400).json({error: 'user does not exist'})
      }

      const passVal = await sql`
      select * from users where password = ${pass}
      `
     if(passVal.length ===0){
      return res.status(400).json({error: 'password incorrect'})
     }

     const update = await sql`
    update users set password = ${newpass} where user = ${name} and where password =${pass}
      `

console.log(update)
return res.status(200).json({username: `${name} password updated`})
    },


    loginUser: async (c, req, res) => {
      
      const email = c.request.params.email
      const password = c.request.params.password


      const usercheck = await sql`
      SELECT id,username,email,createtime FROM Users WHERE email =${email}
      `

      const Id = await sql`
      SELECT id FROM Users WHERE email =${email}
      `

      const hash = await sql`
      select password from Users where email = ${email}
      `

  
      if (usercheck.length === 0) {
        return res.status(404).json({ error: 'user not found' });
      }

      const isValid = await bcrypt.compare(password, hash[0].password)

      if(!isValid){
        console.log('invalid credentials')
        return res.status(404).json({error: 'user not found'})
      }

      req.session.user= Id[0]
console.log(req.sessionID)
      console.log(req.session.user)
      req.session.save(function (err) {
        if (err) return (err)
        console.log('session saved')
        console.log(req.session)
        return res.status(200).json({success: 'good'})
      })


      
    },


    getSession: async (c, req, res) => {

      const sessionId = req.sessionID;

    console.log(res)
console.log(sessionId)
      if (!sessionId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
       if(typeof sessionId !== 'string')
       {
        console.log('invalid')
       return res.status(400).json({error: 'invalid sessionId'})

       }

      if(typeof sessionId =='string')
      {console.log('is valid')
      }
      

      const sessionData = await redisClient.get(`SessionStore:${sessionId}`)

    console.log(sessionData)
      
      if (!sessionData) {
        return res.status(404).json({ error: 'Session data not found' });
      }
    
     
      return res.status(200).json({ sessionData });

    
  },

    logoutUser: async (c,req,res) => {
      res.clearCookie('req.session', { path: '/' });

      return res.status(200).json({success:'cookies deleted'});

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
