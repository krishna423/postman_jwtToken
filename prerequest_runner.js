
//jwt_secret and jwt_sample should be collection variable
var JWT_SECRET = "ps_jwt_secret_key";
var JWT_SAMPLE = "ps_jwt_sample";

/** no need to change here */
var jwt_script = pm.globals.get("jwt_script");
const obj = eval(jwt_script);
obj.jwtProcess();
// console.log(jwt_script);
// console.log( typeof pm.request.body.raw);