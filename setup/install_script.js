sdk = require('postman-collection')
var jwt_script = pm.globals.get("JWT_SCRIPT");
const obj = eval(jwt_script);
obj.jwtProcess();