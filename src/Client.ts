#!/usr/bin/env node

import crypto from "crypto";
import fs from "fs";
import http from "http";
import { HandshakeClient } from "@linkedmink/passport-mutual-key-challenge-client";

interface TokenResponse {
  token: string;
}

const main = async () => {
  const clientPrivateKey = crypto.createPrivateKey(fs.readFileSync("client.key"));
  const serverPubKey = crypto.createPublicKey(fs.readFileSync("server.key.pub"));

  const hostPort = {
    host: "localhost",
    port: 8080
  }

  const client = new HandshakeClient();
  const handshake = client.request(
    { ...hostPort, path: "/authenticate", isSslRequest: false },
    "FAKE_ID_123",
    clientPrivateKey,
    serverPubKey);

  const tokenResponse = await handshake
    .then(buf => JSON.parse(buf.toString()) as TokenResponse)
    .catch((e: Error) => {
      console.log(e.stack)
      process.exit(1)
    })

  console.log("\x1b[32mHandshake Success!\x1b[0m");

  const resultPromise = new Promise<Buffer>((resolve, reject) => {
    const options = {
      ...hostPort,
      path: "/protected",
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenResponse.token}`,
      },
    };
    const request = http.request(
      options,
      response => {
        const buffers: Buffer[] = [];
        response.on("data", function (chunk) {
          buffers.push(chunk);
        });

        response.on("end", function () {
          resolve(Buffer.concat(buffers));
        });
      }
    );
    request.on("error", err => {
      reject(err);
    });
    request.end();
  });

  const result = await resultPromise
    .then(buf => buf.toString())
    .catch((e: Error) => {
      console.log(e.stack)
      process.exit(1)
    });

  console.log(result)
  console.log("\x1b[32mCall Protected Success!\x1b[0m");

  return 0;
};

main()
  .then(r => process.exit(r))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
