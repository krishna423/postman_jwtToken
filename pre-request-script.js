var CryptoJS = require("crypto-js");

function parseJwt(token) {
  var base64Header = token.split('.')[0]; 
  var base64Payload = token.split('.')[1];
  var header = Buffer.from(base64Header, 'base64');
  var headerJson = JSON.parse(header);
 // console.log("header:- ",JSON.stringify(headerJson));
  var payload = Buffer.from(base64Payload, 'base64');
  var payloadJson = JSON.parse(payload);
  //console.log("payload:- ",JSON.stringify(payloadJson));
  return [headerJson,payloadJson];
}

function createJwt(header,payload,jwt_secret){
    console.log("new jwt:-",header,payload);
    var encodedHeader = encodingData(header); 
    //var encodedPayload = encodingData(payload);
    var encodedPayload = encodingData(payload);
   //console.log("encoded header-",encodedHeader ,"  encoded payload",encodedPayload)
    var unsignedToken = encodedHeader + "." + encodedPayload;
    var jwtToken = unsignedToken + "." + addSignature(unsignedToken, jwt_secret);
    console.log("new jwt token  :",jwtToken);
    pm.environment.set("jwt_token", jwtToken);
}
function encodingData(jsonData){
    var stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(jsonData));
    var encodedData = base64url(stringifiedData);
    return encodedData;
}
function base64url(source) {
  // Encode in classical base64
  encodedSource = CryptoJS.enc.Base64.stringify(source);
  // Remove padding equal characters
  encodedSource = encodedSource.replace(/=+$/, '');
  // Replace characters according to base64url specifications
  encodedSource = encodedSource.replace(/\+/g, '-');
  encodedSource = encodedSource.replace(/\//g, '_');
  return encodedSource;
}


function addSignature(unsignedToken,jwt_secret){
    return base64url(CryptoJS.HmacSHA256(unsignedToken, jwt_secret));
}

function jwtProcess (){
    var jwt_secret =  pm.collectionVariables.get(JWT_SECRET);
    var jwt_sample =  pm.collectionVariables.get(JWT_SAMPLE);
    // console.log("jwt initial:- ",jwt_sample);
    //console.log("jwt secret:- ",jwt_secret);
    var [header,payload] = parseJwt(jwt_sample);
    //console.log("parsed jwt:-  ",header,"    ",payload)
    payload = createPayloadFromBody();
    createJwt(header,payload,jwt_secret); 
}

function createPayloadFromBody(){
    var requestBody=pm.request.body;
    //console.log(requestBody.options.raw.language);
    if(requestBody.mode!="raw"){
    console.error("script not configured for mode : ",requestBody.mode);
    return;
    }
    if(requestBody.options.raw.language!="json"){
    console.error("script not configured for language : ",requestBody.options.raw.language);
    return;
    }
    var requestBodyPayload=JSON.parse(requestBody.raw);
    return modifyPayload(requestBodyPayload);
}


// //---------------------------------config-------------------------------------------



var JWT_SECRET = "ps_jwt_secret_key";
var JWT_SAMPLE = "ps_jwt_sample";

function modifyPayload(payload){
    //add new field in json
    payload['iss']=pm.collectionVariables.get("iss");
    return payload;
}
jwtProcess();

function parseRequestHeader(){}
function parseRequestQueryParam(){}
function parseRequestBody(){}
function parseFormData(){}
function parseUrlEncodedData(){}