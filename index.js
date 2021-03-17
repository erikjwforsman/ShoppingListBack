// const express = require('express')
const { ApolloServer, gql, UserInputError} = require("apollo-server")
const mongoose = require("mongoose")
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const Shopping_list = require("./models/shopping_list")
const Item = require("./models/item")
const User = require("./models/user")

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

const typeDefs = gql`
  type Shopping_list {
    listName: String!
    items: [Item]
    listMembers: [User]
    id: ID!
  }

  type Item {
    itemName: String
    itemAmount: String
    itemNote:String
    id: ID!
  }

  type User {
    username: String!
    user_shopping_lists: [Shopping_list]
    userContacts: [User]
    id:ID!
  }

  type Token {
    value: String!
  }

  type Query {
    listCount: Int!
    itemCount: Int!
    userCount: Int!
    allItems: [Item!]!
    allLists: [Shopping_list]
    findList(listId:String!): Shopping_list
    allUsers: [User]
    findUser(username:String): User
    me: User
  }

  type Mutation {
    addNewUser(
      username: String!
      password: String!
    ):User

    login(
      username: String!
      password: String!
    ):Token

    addNewList(
      username: String!
      listName: String!
    ):Shopping_list

    addItemToList(
      listId: String!
      itemName: String!
      itemAmount: String
      itemNote: String
    ):Item

    addContact(
      username: String!
      contactName: String!
    ):User

    addUserToList(
      listId: String!
      nameToAdd: String!
    ):Shopping_list

    removeUserFromList(
      listId: String!
      username: String!
    ):Shopping_list

    removeItemFromList(
      listId: String!
      itemId: String!
    ):Item

    removeManyItems(
      listId: String!,
      itemIds: [String!]
    ):Shopping_list

    editItemOnList(
      itemId: String!
      itemName: String!
      itemAmount: String
      itemNote: String
    ):Item

    deleteList(
      listId: String!
    ):Shopping_list

  }
`

const resolvers = {
  Query: {
    listCount: () => Shopping_list.collection.countDocuments(),
    itemCount: () => Item.collection.countDocuments(),
    userCount:() => User.collection.countDocuments(),
    allItems: () => Item.find({}),
    allLists: async(root, args) => Shopping_list.find({}).populate("items"),
    findList: (root, args) => Shopping_list.findOne({_id: args.listId}).populate("items"),
    allUsers: async(root, args) => User.find({}).populate("user_shopping_lists"),
    findUser: (root, args) => {
      if (!args.username){
        return null
      }
      return User.findOne({username: args.username}).populate("user_shopping_lists")
    },
    me: (root, args, context) => { return context.currentUser }
  },
//  User: {
  //  shopping_list: async(root)=> {

    //}
  //},

  User:{
    userContacts: async (root) => {
      const retUsers = []
      for (u of root.userContacts){
        const user = await User.find({_id:u})
        retUsers.push(user[0])
      }
      return retUsers
    }
  },

  Shopping_list: {
    items: async (root) => {
      const retItems = []
      for(i of root.items){
        const item = await Item.find({_id:i})
        retItems.push(item[0])
      }
      return retItems
    },

    listMembers: async (root) => {
      const retUsers = []
      //console.log(root)
      for (u of root.listMembers){
        const user = await User.find({_id:u})
        retUsers.push(user[0])
      }
      return retUsers
    }
  },

  Mutation: {
    addNewUser: async(root, args) => {
      const saltRounds = 10
      const passwordHash = await bcrypt.hash(args.password, saltRounds)
      const user = new User({
        username: args.username,
        passwordHash
      })
      console.log(user)
      return user.save()
    },

    login: async (root, args) => {
      const user = await User.findOne({username: args.username})

      const passwordCorrect = user === null ? false : await bcrypt.compare(args.password, user.passwordHash)

      if ( !(user && passwordCorrect) ) {
        throw new UserInputError("Wrong credentials")
      }

      //// vanha tästä alaspäin
      // if ( !user || args.password !== "Salasana" ) {
      //   throw new UserInputError("Wrong credentials")
      // }

      const userForToken = {
        username: user.username,
        id: user._id
      }

      return { value: jwt.sign(userForToken, JWT_SECRET)}
    },

    addNewList: async(root, args) => {
      //Käyttäjän voisi siirtää myös suoraan propseista
      const user = await User.findOne({username:args.username})

      if(!user){
        return null
      }

      const shopping_list = new Shopping_list({...args, listMembers: {...user}})
      user.user_shopping_lists.push(shopping_list)
      user.save()
      return shopping_list.save()
    },

    addItemToList: async(root, args) => {
      const shopping_list = await Shopping_list.findOne({_id: args.listId})

      if (!shopping_list){
        return null
      }

      const item = new Item({itemName: args.itemName, itemAmount:args.itemAmount, itemNote:args.itemNote})
      item.save()

      shopping_list.items.push(item)
      return shopping_list.save()
    },

    addContact: async(root, args) => {
      const user = await User.findOne({username: args.username})
      const contact = await User.findOne({username: args.contactName})

      if (!user || !contact){
        return null
      }

      if (user.userContacts.includes(contact._id)){
        return null
      }

      user.userContacts.push(contact)
      user.save()
      contact.userContacts.push(user)
      return contact.save()
    },

    addUserToList: async(root, args) => {
      const user = await User.findOne({username: args.nameToAdd})
      const shopping_list = await Shopping_list.findOne({_id: args.listId})

      if (!user || !shopping_list){
        return null
      }
      if (user.user_shopping_lists.includes(shopping_list._id)){
        return null
      }
      user.user_shopping_lists.push(shopping_list)
      shopping_list.listMembers.push(user)

      user.save()
      return shopping_list.save()
    },

    removeUserFromList:async(root, args) =>{
      console.log("ALKAA")
      const user = await User.findOne({username: args.username})
      const shopping_list = await Shopping_list.findOne({_id: args.listId})

      if (!user || !shopping_list){
        return null
      }
      if (!user.user_shopping_lists.includes(shopping_list._id)){
        console.log("EI LISTALLA")
        return null
      }

      console.log("ALKU",shopping_list)
      console.log("ALKU",user)

      //listan päivitys tallennusta vaille valmis
      shopping_list.listMembers = shopping_list.listMembers.filter(single => String(single) !== String(user._id))
      console.log("VIRALLINEN:",shopping_list)

      user.user_shopping_lists = user.user_shopping_lists.filter(single => String(single) !== String(args.listId))
      console.log("LOPPU:",user)
      shopping_list.save()
      user.save()
      return null

      //shopping_list = shopping_list.filter(listMembers => listMembers.)

    },

    removeItemFromList:async(root, args) =>{
      //console.log(args)
      const shopping_list = await Shopping_list.findOne({_id: args.listId})
      const item = await Item.findOne({_id: args.itemId})

      if (!shopping_list || !item || !shopping_list.items.includes(item._id)){
        return null
      }
      const filtered = shopping_list.items.filter(obj => String(obj) !==item.id)
      shopping_list.items= filtered

      await Item.deleteOne({_id:item.id})
      return shopping_list.save()
    },

    removeManyItems:async(root, args) => {
      const shopping_list = await Shopping_list.findOne({_id: args.listId})
      const itemsToBeRemoved = args.itemIds

      for (const item of itemsToBeRemoved){
        // tuotten poistokoodi
        await Item.deleteOne({_id: item})

        //listan siistimiskoodi
        const filtered = shopping_list.items.filter(obj => String(obj) !==item)
        shopping_list.items= filtered
      }
      return shopping_list.save()
    },

    editItemOnList:async(root, args) => {
      //Ei tarvita ostoslistaa, koska jatkossa tunnistaminen tapahtuu ID:lla
      const item = await Item.findOne({_id: args.itemId})
      if (!item){
        return null
      }

      //console.log(item)
    //  return null
      const replacer = {itemName: args.itemName, itemAmount: args.itemAmount, itemNote: args.itemNote}
      console.log(replacer)
      Item.findByIdAndUpdate(item.id, {itemName: args.itemName, itemAmount: args.itemAmount, itemNote: args.itemNote},function(error){ console.log(error) })
      return null
    },

    deleteList:async(root, args) => {
      const shopping_list = await Shopping_list.findOne({_id: args.listId})

      if (!shopping_list){
        return null
      }

      const users = shopping_list.listMembers
      const itemsToBeRemoved = shopping_list.items

      for (const user of users){
        const u = await User.findOne({_id:mongoose.Types.ObjectId(user)})
        u.user_shopping_lists=u.user_shopping_lists.filter(a => String(a) !== String(shopping_list._id))
        await u.save()
      }

      for (const item of itemsToBeRemoved){
        await Item.deleteOne({_id:mongoose.Types.ObjectId(item)})
      }

      await Shopping_list.deleteOne({_id: shopping_list._id})
      return null
    },

  }
}

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
