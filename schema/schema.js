const createHttpError = require('http-errors')
const User = require('../Model/userModel/userModel')
const Product = require('../Model/productsModel/productsModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { GraphQLError } = require('graphql');
// const private = require('../private.key');
// const fs = require('fs');

const typeDefs = `#graphql

type Name{
    firstName: String
    lastName: String
  }
input NameInput{
    firstName: String
    lastName: String
  }

  type User {
    id: ID
    username: String!
    email: String!
    phone: String
    avatar: String
    name:Name!
  }

  enum Status {
    InStock
    OutOfStock  
  }

  type Product{
    id: ID
    name: String!
    description: String!
    price: Float!
    image: String
    stock: Int!
    status: Status!
    owner: User!
  }

  
  type Query {
    user(id:ID!): User
    users: [User]

    # Get all products
    products: [Product!]!

    # Get a product by id
    product(id: ID!): Product
  }

  type Mutation {
    #register user
    registration(username: String!, email: String!, password: String!): User
    
    #login user
    login(email: String!, password: String!): User

    #update user
    updateUser(id: ID!, username: String, email: String, phone: String, avatar: String,name:NameInput): User

    #delete user
    deleteUser(id: ID!): User



    #here is products  CRUD methods

    #create product
    createProduct(name: String!, description: String!, price: Float!, image: String!, stock: Int!, status: Status!, ownerId: ID!): Product
    
    #update product
    updateProduct(id: ID!, name: String, description: String, price: Float, image: String, stock: Int, status: Status): Product

    #delete product
    deleteProduct(id: ID!): Product

    #get product
    product(id: ID!) :  Product

    products: [Product]
  }



`;

// Resolverss define how to fetch the types defined in your schema.
// This resolvers retrieves books from the "books" array above.
const resolvers = {
  Product: {
    async owner(parent) {
      return await User.findById(parent.ownerId);
    }
  },
  Query: {
    users: async () => {
      return await User.find()
    },
    user: async (_, { id }) => {
      return User.findById(id)
    },
    products: async () => {
      return await Product.find()
    },
    product: async (_, { id }) => {
      return Product.findById(id)
    },
  },
  Mutation: {
    //register user
    registration: async (_, { username, email, password }, { req, res }) => {
      try {
        const round = 10
        const getSalt = await bcrypt.genSalt(round)
        const hashPassword = await bcrypt.hash(password, getSalt)

        const user = new User({
          username,
          email,
          password: hashPassword
        })

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' })// jwt will be removed after 8 hours

        res.cookie('userId', token, {
          expires: new Date(Date.now() + 8 * 3600000),// cookie will be removed after 8 hours
          httpOnly: true,
          signed: true,
          secure: true
        })

        const savedUser = await user.save()
        return savedUser
      } catch (error) {
        console.log(error);
      }
    },
    // login
    login: async (_, { email, password }, { req, res }) => {
      try {
        const user = await User.findOne({ email: email })
        if (!user) {
          throw new GraphQLError('Incorrect credentials', {
            extensions: { code: 401 },
          });
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
          throw new GraphQLError('Incorrect credentials', {
            extensions: { code: 401 },
          });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' })// jwt will be removed after 8 hours

        res.cookie('userId', token, {
          expires: new Date(Date.now() + 8 * 3600000),// cookie will be removed after 8 hours
          httpOnly: true,
          signed: true,
          secure: true,
          domain:'http://localhost:5173'//it is for local frontend
        })

        return user
      } catch (error) {
        console.log(error);
      }
    },
    // Update user
    updateUser: async (_, { id, username, email, phone, avatar, name }) => {

      const updateUser = await User.findByIdAndUpdate(id, {
        $set: {
          username,
          email,
          phone,
          avatar,
          name
        }
      })

      return updateUser
    },

    // Delete user
    deleteUser: async (_, { id }) => {
      const deleteUser = await User.findByIdAndDelete(id)
      return deleteUser
    },

    // create product
    createProduct: async (parent, { name, description, price, image, stock, status, ownerId }, { req, res }) => {
      try {

       
        const product = new Product({
          name,
          description,
          price,
          image,
          stock,
          status,
          ownerId
        })

        const savedProduct = await product.save()
        return savedProduct
      } catch (error) {
        console.log(error)
      }
    },

    // update product
    updateProduct: async (parent, { id, name, description, price, image, stock, status }, { req, res }) => {

      console.log(stock);
      const product = await Product.findByIdAndUpdate(id, {
        $set: {
          name,
          description,
          price,
          image,
          stock,
          status
        }
      },{
        new: true
      })

      return product
    },

    // delete product
    deleteProduct: async (parent, { id }, { req, res }) => {
      const product = await Product.findByIdAndDelete(id)
      return product
    },
  }
};


module.exports = {
  typeDefs,
  resolvers
}
