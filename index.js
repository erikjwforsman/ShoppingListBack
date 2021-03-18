// const express = require('express')
const { ApolloServer, gql, UserInputError} = require("apollo-server")
const mongoose = require("mongoose")
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const Shopping_list = require("./models/shopping_list")
const Item = require("./models/item")
const User = require("./models/user")

const typeDefs = require("./vali/typeDefs")
const resolvers = require("./vali/resolvers")

const url = process.env.MONGODB_URI
//Pitää tehdä uusi .env tiedosto

console.log('connecting to Mongo')

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const JWT_SECRET = 'SUPER_SEKRET' //Ei enää käytössä
//const JWT_SECRET = process.env.JWT_KEY

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return {currentUser}
    }
  }
})
/// /// /// /// /// Heroku alkaa
// const app = express()
// server.applyMiddleware({app})

const PORT = process.env.PORT || 4000

   server.listen(PORT).then(({url}) => {
     console.log(`Server ready at ${url}`)
 })
  // app.listen(PORT, () =>
  //   console.log(`🚀 Server ready at ${url}`))
