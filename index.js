const express = require('express')
const { ApolloServer, gql, UserInputError} = require("apollo-server-express")
const mongoose = require("mongoose")
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cors = require('cors')


const Shopping_list = require("./models/shopping_list")
const Item = require("./models/item")
const User = require("./models/user")

const typeDefs = require("./vali/typeDefs")
const resolvers = require("./vali/resolvers")
const url = process.env.MONGODB_URI

console.log('connecting to Mongo')

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const JWT_SECRET = process.env.JWT_SECRET

const app = express()

app.use(express.static('build'));

app.get("/", (req, res) =>{
  res.sendFile(path.resolve(__dirname, "build", "index.html"))
})

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

app.use(cors())
server.applyMiddleware({ app, path:"/" })

//const PORT = process.env.PORT || 4000

const PORT = "https://quiet-plains-93370.herokuapp.com/"
// server.listen(PORT).then(({url}) => {
//   console.log(`Server ready at ${url}`)
// })
//HUOMHUOMHUOM
//Osoitteen perään => /graphql
  app.listen(PORT, () =>
    console.log(`🚀 Server ready`))
