const { ApolloServer, gql, UserInputError} = require("apollo-server")
const mongoose = require("mongoose")
require('dotenv').config()
const jwt = require('jsonwebtoken')

const Shopping_list = require("./models/shopping_list")
const Item = require("./models/item")
const User = require("./models/user")

const url = process.env.MONGODB_URI


console.log('connecting to Mongo')

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const JWT_SECRET = 'SUPER_SEKRET'


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
    findList(listName:String!): Shopping_list
    allUsers: [User]
    findUser(username:String): User
    me: User
  }

  type Mutation {
    addNewUser(
      username: String!
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
      listName: String!
      itemName: String!
      itemAmount: String
      itemNote: String
    ):Item

    addContact(
      username: String!
      contactName: String!
    ):User

    addUserToList(
      listName: String!
      nameToAdd: String!
    ):Shopping_list

    removeItemFromList(
      listName: String!
      itemName: String!
    ):Item

    editItemOnList(
      itemName: String!
      itemAmount: String
      itemNote: String
    ):Item

    deleteList(
      listName: String!
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
    findList: (root, args) => Shopping_list.findOne({listName: args.listName}).populate("items"),
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
    addNewUser: (root, args) => {
      const user = new User({...args})
      return user.save()
    },

    login:(root, args) => {
      const user = User.findOne({username: args.username})

      if ( !user || args.password !== "Salasana" ) {
        throw new UserInputError("Wrong credentials")
      }

      const userForToken = {
        username: user.username,
        id: user._id
      }

      return { value: jwt.sign(userForToken, JWT_SECRET)}
    },

    addNewList: async(root, args) => {
      const user = await User.findOne({username:args.username})

      if(!user){
        console.log("Failllll")
        return null
      }
      console.log(user)

      const shopping_list = new Shopping_list({...args, listMembers: {...user}})
      console.log("#################")
      user.user_shopping_lists.push(shopping_list)
      console.log(user)
      console.log("Ostoslista:",shopping_list)
      user.save()
      return shopping_list.save()
    },

    addItemToList: async(root, args) => {
      const shopping_list = await Shopping_list.findOne({listName: args.listName})

      if (!shopping_list){
        console.log("Ei löydy")
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
        console.log("Käyttäjä on jo lisätty kontakteihin")
        return null
      }

      user.userContacts.push(contact)
      user.save()
      contact.userContacts.push(user)
      return contact.save()
    },

    addUserToList: async(root, args) => {
      const user = await User.findOne({username: args.nameToAdd})
      const shopping_list = await Shopping_list.findOne({listName: args.listName})
      if (!user || !shopping_list){
        console.log("Käyttäjää tai listaa ei ole olemassa")
        return null
      }
      if (user.user_shopping_lists.includes(shopping_list._id)){
        console.log("Käyttäjä on jo listalla")
        return null
      }
      user.user_shopping_lists.push(shopping_list)
      shopping_list.listMembers.push(user)
      user.save()
      return shopping_list.save()
    },

    removeItemFromList:async(root, args) =>{
      const shopping_list = await Shopping_list.findOne({listName: args.listName})
      const item = await Item.findOne({itemName: args.itemName})

      if (!shopping_list || !item || !shopping_list.items.includes(item._id)){
        console.log("Ongelma!!!")
        return null
      }
      const filtered = shopping_list.items.filter(obj => String(obj) !==item.id)
      shopping_list.items= filtered
      await Item.deleteOne({_id:item.id})
      return shopping_list.save()
    },

    editItemOnList:async(root, args) => {
      //Ei tarvita ostoslistaa, koska jatkossa tunnistaminen tapahtuu ID:lla
      const item = await Item.findOne({itemName: args.itemName})
      if (!item){
        return null
      }
      const replacer = {itemNamename: args.itemName, itemAmount: args.itemAmount, itemNote: args.itemNote}
      Item.findByIdAndUpdate(item.id, {itemNamename: args.itemName, itemAmount: args.itemAmount, itemNote: args.itemNote},function(error){ console.log(error) })
      return null
    },

    deleteList:async(root, args) => {
      const shopping_list = await Shopping_list.findOne({listName: args.listName})

      if (!shopping_list){
        return null
      }

      const users = shopping_list.listMembers
      const itemsToBeRemoved = shopping_list.items

      console.log(shopping_list)
      console.log("(###############)")

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

server.listen().then(({url}) => {
  console.log(`Server ready at ${url}`)
})
