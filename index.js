
(
    async function name() {
        // external dependency
        const { ApolloServer } = require('@apollo/server')
        const { expressMiddleware } = require('@apollo/server/express4')
        const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer')
        const express = require('express')
        const http = require('http')
        const cors = require('cors')
        const bodyParser = require('body-parser')
        const connectDb = require('./db/connectDb')
        const dotenv = require('dotenv')
        const cookieParser = require('cookie-parser')

        // internal dependency
        const { resolvers, typeDefs } = require('./schema/schema')

        // environment variables
        dotenv.config()

        const app = express();
        // Our httpServer handles incoming requests to our Express app.
        // Below, we tell Apollo Server to "drain" this httpServer,
        // enabling our servers to shut down gracefully.
        const httpServer = http.createServer(app);

        // connect with database
        connectDb()

        const server = new ApolloServer({
            typeDefs,
            resolvers,
            plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        });

        // start apollo server
        await server.start();

        // use cors for cors origins policy
        app.use(cors({
            origin: [process.env.UI_ORIGIN],
            credentials: true,
        }))
        // parsing requests body data
        app.use(bodyParser.json())
        // cookie parsing
        app.use(cookieParser(process.env.COOKIE_SECRET))

        app.use(bodyParser.urlencoded({ extended: true }))

        const port = process.env.PORT || 4000;

        app.use(
            '/',
            expressMiddleware(server, {
                context: async ({ req, res }) => ({ req, res }),
            }),
        );
        await new Promise((resolve) => httpServer.listen({ port }, resolve));
        console.log(`🚀 Server ready at http://localhost:${port}/`);
    }
)()