# @hasagi/core

A TypeScript library that makes using the League of Legends client API (LCU) easy.

# Installation
```
npm install @hasagi/core
```
# Requests

You can use Hasagi to send a request like this

```
import { HasagiClient } from "@hasagi/core";

const client = new HasagiClient();
await client.connect();
const response = await client.request({
    method: "get",
    url: "/lol-summoner/v1/current-summoner"
});

console.log(response);

/* {
    "accountId": 229592706,
    "displayName": "dysolix",
    "internalName": "dysolix",
    "nameChangeFlag": false,
    "percentCompleteForNextLevel": 18,
    "privacy": "PUBLIC",
    "profileIconId": 5635,
    "puuid": "b9e09f32-78a1-5a13-9f6b-5bbbca6e13ae",
    "rerollPoints": {
        "currentPoints": 500,
        "maxRolls": 2,
        "numberOfRolls": 2,
        "pointsCostToRoll": 250,
        "pointsToReroll": 0
    },
    "summonerId": 91258307,
    "summonerLevel": 749,
    "unnamed": false,
    "xpSinceLastLevel": 667,
    "xpUntilNextLevel": 3648
 } */
```
# Documentation
You can find Hasagi's documentation at https://docs.dysolix.dev.
# Disclaimer
Hasagi is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc
