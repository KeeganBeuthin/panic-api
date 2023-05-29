import postgres from 'postgres'
export  const sql = postgres('postgres://Rat:hahaha@127.0.0.1:5432/Rat')


export async function getTransactions(){
    const transactions = await sql`
    select * from transactions`
    console.log(transactions)
    return transactions
    
}

async function main() {
    try {
      const transactions = await getTransactions()
      console.log(transactions)
    } catch (error) {
      console.error(error)
    }
  }
  
  
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


async function createTransaction() {
  const id = await generateUniqueId()
  
  const result = await sql`
    INSERT INTO transactions (id, create_time, name, value) VALUES (${id}, now(), ${'dwayne'}, ${value})
  `
  
  console.log(`New transaction created with ID ${id} and Value ${value}`)
  return result
}

createTransaction()


export function getSessionData(sessionId) {

  const sessionData = req.session; 

  return sessionData;
}