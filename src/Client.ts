#!/usr/bin/env node

import crypto, { constants, KeyObject } from "crypto";
import fs from "fs";
import http, { RequestOptions } from "http";

interface SignedMessage {
  message: string;
  signature: string;
}

interface MutualResponse {
  clientRequested: SignedMessage;
  serverRequested: SignedMessage;
}

interface TokenResponse {
  token: string;
}

const encryptOpts = (key: KeyObject) => {
  return {
    key,
    padding: constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  };
};

const signOpts = (key: KeyObject) => ({ key, padding: constants.RSA_PKCS1_PADDING });

const main = async () => {
  const clientPrivateKey = crypto.createPrivateKey(fs.readFileSync("client.key"));
  const serverPubKey = crypto.createPublicKey(fs.readFileSync("server.key.pub"));

  const authRequestOptions = {
    host: "localhost",
    path: "/authenticate",
    port: 8080,
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
  } as RequestOptions;

  const nonce = crypto.randomBytes(128);
  const challengeMessage = crypto.publicEncrypt(encryptOpts(serverPubKey), nonce);
  const challengeSignature = crypto.sign("sha256", nonce, signOpts(clientPrivateKey));

  const challenge = {
    userId: "FAKE_ID_123",
    challenge: {
      message: challengeMessage.toString("base64"),
      signature: challengeSignature.toString("base64"),
    },
  };

  const challengePromise = new Promise<MutualResponse>((resolve, reject) => {
    const request = http.request(authRequestOptions, response => {
      let responseData = "";
      response.on("data", function (chunk) {
        responseData += chunk;
      });

      response.on("end", function () {
        console.log(`Server Response: ${responseData}`);
        resolve(JSON.parse(responseData));
      });
    });

    const message = JSON.stringify(challenge, undefined, 2);
    console.log(`Sending Challenge: ${message}`);

    request.write(message);
    request.end();
  });

  const mutualResponse = await challengePromise;
  const clientReqMessege = Buffer.from(mutualResponse.clientRequested.message, "base64");
  const clientReqSignature = Buffer.from(mutualResponse.clientRequested.signature, "base64");
  const isClientReqVerified = crypto.verify(
    "sha256",
    clientReqMessege,
    signOpts(serverPubKey),
    clientReqSignature
  );

  if (!clientReqMessege.equals(nonce) || !isClientReqVerified) {
    console.log(`Failed to verify client challenge! ${clientReqMessege.toString("hex")}`);
    return 1;
  }

  const serverReqMessege = Buffer.from(mutualResponse.serverRequested.message, "base64");
  const serverReqSignature = Buffer.from(mutualResponse.serverRequested.signature, "base64");
  const responseMessage = crypto.privateDecrypt(encryptOpts(clientPrivateKey), serverReqMessege);
  const isServerReqVerified = crypto.verify(
    "sha256",
    responseMessage,
    signOpts(serverPubKey),
    serverReqSignature
  );

  if (!isServerReqVerified) {
    console.log(`Failed to verify server challenge! ${clientReqMessege.toString("hex")}`);
    return 1;
  }

  const responseSignature = crypto.sign("sha256", responseMessage, signOpts(clientPrivateKey));

  const postResponse = {
    userId: "FAKE_ID_123",
    response: {
      message: responseMessage.toString("base64"),
      signature: responseSignature.toString("base64"),
    },
  };

  const responsePromise = new Promise<TokenResponse>((resolve, reject) => {
    const request = http.request(authRequestOptions, response => {
      let responseData = "";
      response.on("data", function (chunk) {
        responseData += chunk;
      });

      response.on("end", function () {
        console.log(`Server Response: ${responseData}`);
        resolve(JSON.parse(responseData));
      });
    });
    const message = JSON.stringify(postResponse, undefined, 2);
    console.log(`Sending Challenge Response: ${message}`);

    request.write(message);
    request.end();
  });

  
  const tokenResponse = await responsePromise;
  if (!tokenResponse.token) {
    console.log(`Failed to get token!`);
    return 1;
  }

  console.log("\x1b[32mHandshake Success!\x1b[0m");

  await new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: "localhost",
        path: "/protected",
        port: 8080,
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenResponse.token}`,
        },
      },
      response => {
        let responseData = "";
        response.on("data", function (chunk) {
          responseData += chunk;
        });

        response.on("end", function () {
          console.log(`Server Response: ${responseData}`);
          resolve(responseData);
        });
      }
    );
    request.end();
  });

  return 0;
};

main()
  .then(r => process.exit(r))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
