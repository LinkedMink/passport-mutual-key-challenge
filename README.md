# passport-mutual-key-challenge

![Build State](https://github.com/LinkedMink/passport-mutual-key-challenge/actions/workflows/build-main.yml/badge.svg)
![npm version](https://badge.fury.io/js/@linkedmink%2Fpassport-mutual-key-challenge.svg)

This npm package implements a [Passport](http://www.passportjs.org/) strategy to authenticate
a client by their public/private key pair. This method was primarily meant to be used in an internal
environment, not a public facing site, where clients trust can be establish ahead of time.

The client starts authenticating by making a challenge request with a message encrypted by the
server's public key. The server tries to find the public key of the user making the request. If found,
it will decrypt and verify the signature as proof of its identiy. The decrypted message is sent
back to the client with a encrypted, signed challenge issued by the server. Likewise, the client
will decrypt and verify, sending back the decrypted message. Both parties have verified each others
identiy and the handshake is complete.

## Getting Started

Install the npm package

```bash
npm install --save @linkedmink/passport-mutual-key-challenge
```

### Demo Program

The [demo programs](src) demonstrates how to use the strategy to do an initial handshake. Both
the client and server have a public/private key pair, so you will need to generate the keys

```sh
# Generate the server key
ssh-keygen -t rsa -b 4096 -m PEM -f server.key
openssl rsa -in server.key -pubout -outform PEM -out server.key.pub
# Generate the client key
ssh-keygen -t rsa -b 4096 -m PEM -f client.key
openssl rsa -in client.key -pubout -outform PEM -out client.key.pub
# Move keys to demo root folder
mv ./*.key* ./src
```

The project uses Yarn as a package manager. Make sure it's installed globally and install
dependency.

```sh
npm install -g yarn
yarn install
```

The [demo server](src/App.ts) passport mutual authentication to do the initial handshake, using
_server.key_ as its private key. The users are mocked by loading a fixed _client.key.pub_ file as
the user's public key. If the handshake is successful, a JWT is issued for subsequent request.
The server has two endpoints:

- POST /authenticate : A route that accepts a challenge messge in the request body.
- GET /protected : A route protected by JWT that just echos back the decoded JWT.

```sh
# Start the demo server
cd ./src
yarn start
```

The [demo client](src/Client.ts) does a handshake with the server using the opposite keys and
outputs the result of the **/protected** endpoint on success:

```sh
# Run through a handshake
yarn run start:client
```

### Distributed Systems

By default the the strategy uses a local memory cache to store pending challenges. This won't work
if request are load balanced across multiple instances since a request may arrive on a different
instance without the cached challenge.

You can implement the [CachedChallenge](lib/server/Types/ChallengeCache.ts) interface and provide
that as an option.

```TypeScript
new MutualKeyChallengeStrategy({
  serverKey: myPrivateKey,
  userFunc: getUser,
  challengeOrResponseFunc: challengeByBase64Body("userId", "challenge", "response"),
  challengeCache: new MyCustomChallengeCache(),
})
```

See [node-user-service](https://github.com/LinkedMink/node-user-service/blob/master/src/middleware/PassportMutual.ts)
for an example using Redis.
