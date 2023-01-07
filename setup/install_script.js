
sdk = require('postman-collection')
const obj = eval(pm.globals.get("JWT_SCRIPT"));
obj != undefined ? obj.jwtProcess() : "okay"