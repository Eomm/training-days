'use strict'
const fs = require('node:fs')

const app = require('fastify')({ logger: true })

app.get('/', async (request, reply) => {
  return { hello: 'world from ' + process.env.HOSTNAME }
})

app.get('/read-dir', async (request, reply) => {
  const dir = fs.readdirSync('/data')
  return { dir }
})

app.listen({ port: process.env.PORT || 3099, host: '0.0.0.0' })