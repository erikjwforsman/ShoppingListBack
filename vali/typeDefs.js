//import React from "react"
const {gql} =require("apollo-server")

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
module.exports = typeDefs
