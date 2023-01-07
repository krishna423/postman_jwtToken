{
  "collection": {
    "info": {
      "_postman_id": "10165f58",
      "name": "JWT Auto Creation template ",
      "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      "updatedAt": "2023-01-07T18:30:21.000Z"
    },
    "item": [
      {
        "name": "install script",
        "event": [
          {
            "listen": "test",
            "script": {
              "id": "0ee7",
              "exec": [
                "pm.test(\"Status code should be 200\", function () {",
                "    pm.response.to.have.status(200)",
                "    pm.globals.set(\"JWT_SCRIPT\", responseBody)",
                "    pm.globals.set(\"JWT_TOKEN\", \"\")",
                "});"
              ],
              "type": "text/javascript"
            }
          },
          {
            "listen": "prerequest",
            "script": {
              "id": "fc33f831-98",
              "exec": [
                ""
              ],
              "type": "text/javascript"
            }
          }
        ],
        "id": "4c59-9c00-b73839e9e623",
        "protocolProfileBehavior": {
          "disableBodyPruning": true
        },
        "request": {
          "method": "GET",
          "header": [],
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
        "name": "Sample API",
        "event": [
          {
            "listen": "prerequest",
            "script": {
              "id": "02371a95b036",
              "exec": [
                ""
              ],
              "type": "text/javascript"
            }
          }
        ],
        "id": "867075447175b17",
        "protocolProfileBehavior": {
          "disableBodyPruning": true
        },
        "request": {
          "method": "POST",
          "header": [
            {
              "key": "jwt_token",
              "value": "{{JWT_TOKEN}}",
              "type": "text"
            },
            {
              "key": "iat",
              "value": "{{$timestamp}}",
              "type": "text"
            }
          ],
          "body": {
            "mode": "raw",
            "raw": "{\n    \"request_id\":\"{{$randomUUID}}\",\n    \"name\":\"{{$randomUserName}}\",\n    \"sub\" : \"{{$randomWords}}\"\n}",
            "options": {
              "raw": {
                "language": "json"
              }
            }
          },
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
              "54746da3de0662fecb3"
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
          "id": "ce29dbd56652a",
          "type": "text/javascript",
          "exec": [
            "",
            "sdk = require('postman-collection')",
            "const obj = eval(pm.globals.get(\"JWT_SCRIPT\"));",
            "obj != undefined ? obj.jwtProcess() : \"okay\"",
            " "
          ]
        }
      },
      {
        "listen": "test",
        "script": {
          "id": "66964640-733b",
          "type": "text/javascript",
          "exec": [
            ""
          ]
        }
      }
    ],
    "variable": [
      {
        "id": "29cae80d-2cef",
        "key": "JWT_SAMPLE",
        "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.QFHowH84hH4yWs9agTAs1xpas-lePeZore-hKMtzq2Y"
      },
      {
        "id": "509bcc83-4c30",
        "key": "JWT_SECRET",
        "value": "1234567"
      }
    ]
  }
}