# passport-mutual-key-challenge
This npm package implements a [Passport](http://www.passportjs.org/) strategy to authenticate
a client by their public/private key pair. This method was primary meant to be used in an internal 
environment not a public facing site where clients trust can be establish ahead of time.

The client starts authenticating by making a challenge request with a message encrypted by the
server's public key. The server tries to find the public key of the user making the request. If found,
it will decrypt and verify the signature as proof of it's identiy. The decrypted message is sent
back to the client with a encrypted, signed challenge issued by the server. Likewise, the client
will decrypt and verify, sending back the decrypted message. Both parties have verified each others
identiy, so the server can potentially issue a temporary token for subsequent request.

## Getting Started
Install the npm package
```bash
npm install --save @linkedmink/passport-mutual-key-challenge
```

## Build
The project uses Yarn as a package manager. Make sure it's installed globally and install
dependency.
```sh
npm install -g yarn
yarn
```

## Demo Program
The [demo program](demo/App.ts) demonstrates how to use the strategy to do an initial
handshake. Both the client and server have a public/private key pair, so you will need
to generate the keys
```sh
# Generate the server key
ssh-keygen -t rsa -b 4096 -m PEM -f server.key
openssl rsa -in server.key -pubout -outform PEM -out server.key.pub
# Generate the client key
ssh-keygen -t rsa -b 4096 -m PEM -f client.key
openssl rsa -in client.key -pubout -outform PEM -out client.key.pub
# Move to demo root folder
mv ./*.key* ./demo
```

The [demo server](demo/App.ts) uses the mutual authentication to do the initial handshake, using
*server.key* as its private key. The users are mocked by loading a fixed *client.key.pub* file as 
the user's public key. If the handshake is successful, a JWT is issued for subsequent request.
The server has two endpoints:
* POST /authenticate : A route that accepts a challenge messge in the request body.
* GET /protected : A route protected by JWT that just echos back the decoded JWT.
```
yarn start
```

The [demo client](demo/Client.ts) does a handshake with the server using the opposite keys and 
outputs the result of the **/protected** endpoint on success:
```
yarn run startClient
```