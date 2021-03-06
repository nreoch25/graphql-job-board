const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const expressJwt = require("express-jwt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { ApolloServer, gql } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");
const db = require("./db");

const port = 9000;
const jwtSecret = Buffer.from("Zn8Q5tyZ/G1MHltc4F/gTkVJMlrbKiZt", "base64");
// encoding utf-8 allows this function to read file as a string and not a buffer
const typeDefs = gql(
  fs.readFileSync("./schema.graphql", { encoding: "utf-8" })
);
const resolvers = require("./resolvers");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(
  expressJwt({
    secret: jwtSecret,
    credentialsRequired: false
  })
);

const graphqlServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ user: req.user && db.users.get(req.user.sub) })
});
graphqlServer.applyMiddleware({ app });

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.users.list().find(user => user.email === email);
  if (!(user && user.password === password)) {
    res.sendStatus(401);
    return;
  }
  const token = jwt.sign({ sub: user.id }, jwtSecret);
  res.send({ token });
});

app.listen(port, () => console.info(`Server started on port ${port}`));
