{
  "collection": {
    "info": {
      "_postman_id": "3",
      "name": "JWT Creation  Lib Testing",
      "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      "updatedAt": "2023-01-07T17:00:36.000Z"
    },
    "item": [
      {
        "name": "install script",
        "event": [
          {
            "listen": "test",
            "script": {
              "id": "72c5114c-9f0b-46f4-b275",
              "exec": [
                "pm.test(\"Status code should be 200\", function () {",
                "    pm.response.to.have.status(200)",
                "    pm.globals.set(\"JWT_SCRIPT\", responseBody)",
                "    pm.globals.set(\"JWT_TOKEN\", \"\")",
                "    pm.collectionVariables.set(\"JWT_SAMPLE\",\"\")",
                "    pm.collectionVariables.set(\"JWT_SECRET\",\"\")",
                "});"
              ],
              "type": "text/javascript"
            }
          },
          {
            "listen": "prerequest",
            "script": {
              "id": "bda5c2df-99a8-4881",
              "exec": [
                ""
              ],
              "type": "text/javascript"
            }
          }
        ],
        "id": "0482a57a-ff57-4cf8",
        "protocolProfileBehavior": {
          "disableBodyPruning": true
        },
        "request": {
          "method": "GET",
          "header": [],
          "body": {
            "mode": "raw",
            "raw": ""
          },
          "url": {
            "raw": "https://krishna423.github.io/postman_jwtToken/dist/pre_request_min.js",
            "protocol": "https",
            "host": [
              "krishna423",
              "github",
              "io"
            ],
            "path": [
              "postman_jwtToken",
              "dist",
              "pre_request_min.js"
            ]
          },
          "description": "Load the postman-util-lib from github.io and load into postman global variable."
        },
        "response": []
      },
      {
        "name": "Test API",
        "event": [
          {
            "listen": "prerequest",
            "script": {
              "id": "5d8b3e7d-cc77-4e99",
              "exec": [
                ""
              ],
              "type": "text/javascript"
            }
          }
        ],
        "id": "a384e0ba-f009-4e12",
        "protocolProfileBehavior": {
          "disableBodyPruning": true
        },
        "request": {
          "method": "GET",
          "header": [
            {
              "key": "jwt_token",
              "value": "{{jWT_TOKEN}}",
              "type": "text"
            }
          ],
          "url": {
            "raw": "https://run.mocky.io/v3/54746da5-27a8-41f3-a3cd-3de0662fecb3",
            "protocol": "https",
            "host": [
              "run",
              "mocky",
              "io"
            ],
            "path": [
              "v3",
              "54746da5-27a8-41f3-a3cd-3de0662fecb3"
            ]
          }
        },
        "response": []
      }
    ],
    "event": [
      {
        "listen": "prerequest",
        "script": {
          "id": "294c0ddf-7111-4638-891f",
          "type": "text/javascript",
          "exec": [
            "",
            "sdk = require('postman-collection')",
            "var jwt_script = pm.globals.get(\"JWT_SCRIPT\");",
            "const obj = eval(jwt_script);",
            "obj.jwtProcess();"
          ]
        }
      },
      {
        "listen": "test",
        "script": {
          "id": "08171ec3-93cf-41b0",
          "type": "text/javascript",
          "exec": [
            ""
          ]
        }
      }
    ],
    "variable": [
      {
        "id": "ddd370f9-bc55-4372",
        "key": "JWT_SAMPLE",
        "value": ""
      },
      {
        "id": "092df3e1-c12c-4",
        "key": "JWT_SECRET",
        "value": ""
      }
    ]
  }
}