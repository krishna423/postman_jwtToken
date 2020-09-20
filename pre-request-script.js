var CryptoJS = require("crypto-js");

var isSecretKeyBase64Encoded = false;
var requstKeysMap = new Map();

function verifyJWT(unsignedToken, signature, jwt_secret){
    var calculatedSign = addSignature(unsignedToken, jwt_secret);
    if(calculatedSign == signature){
      isSecretKeyBase64Encoded = false;
    } 
    else{
        var decoded = base64decoder(jwt_secret);
        var calculatedSign = addSignature(unsignedToken, decoded);
        if(calculatedSign == signature){
            isSecretKeyBase64Encoded = true ;
        }
        else{
            console.log("Invalid jwt");
            return;
        }
    }
    console.log("is base64 encoded secret ", isSecretKeyBase64Encoded);
}

function parseJwt(token, jwt_secret) {
  var base64Header = token.split('.')[0]; 
  var base64Payload = token.split('.')[1];
  var signature = token.split('.')[2];
  var unsignedToken = base64Header + "." + base64Payload;
  verifyJWT(unsignedToken, signature, jwt_secret);
  var header = Buffer.from(base64Header, 'base64');
  var headerJson = JSON.parse(header);
  var payload = Buffer.from(base64Payload, 'base64');
  var payloadJson = JSON.parse(payload);
  return [headerJson, payloadJson];
}

function createJwt(header, payload, jwt_secret){
    console.log("new jwt:-",header, payload);
    var encodedHeader = encodingData(header); 
    var encodedPayload = encodingData(payload);
    var unsignedToken = encodedHeader + "." + encodedPayload;
    if(isSecretKeyBase64Encoded)
        jwt_secret = base64decoder(jwt_secret);
    var jwtToken = unsignedToken + "." + addSignature(unsignedToken, jwt_secret);
    console.log("new jwt token  :", jwtToken);
    pm.globals.set("jwt_token", jwtToken);
}

function encodingData(jsonData){
    var stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(jsonData));
    var encodedData = base64url(stringifiedData);
    return encodedData;
}

function base64decoder(base64){
    var words = CryptoJS.enc.Base64.parse(base64);
    var decoded = CryptoJS.enc.Utf8.stringify(words);
    return decoded;
}
function base64url(source) {
  encodedSource = CryptoJS.enc.Base64.stringify(source);
  encodedSource = encodedSource.split('=').join('');
  encodedSource = encodedSource.split('+').join('-');
  encodedSource = encodedSource.split('/').join('_');
  //replace with import base64url
  // encodedSource = encodedSource.replace(/=+$/, '');
  // encodedSource = encodedSource.replace(/\+/g, '-');
  // encodedSource = encodedSource.replace(/\//g, '_');
  return encodedSource;
}

function addSignature(unsignedToken,jwt_secret){
    return base64url(CryptoJS.HmacSHA256(unsignedToken, jwt_secret));
}

function createPayloadFromBody(jsonBody){
    for(let key of Object.keys(jsonBody)) {
        if(requstKeysMap.has(key)) {
            jsonBody[key] = requstKeysMap.get(key);   
        }    
    }    
    return jsonBody;
}

function parseRequestHeader(){
    var requestHeaderList = pm.request.headers.all();
    parseKeyValuePairFromList(requestHeaderList);
}

function parseRequestQueryParam(){
    var queryParamString = pm.request.url.getQueryString();
    if(!queryParamString)
       return;
    var queryParamList = queryParamString.split('&');
    for( var index in queryParamList){
        var queryParam =  queryParamList[index].split(/=(.+)/);
        requstKeysMap.set(queryParam[0],queryParam[1]);    
    }
}

function parseFormData(formdataList){
    for(var index in formdataList){
        var formdata = formdataList[index];
        if(formdata.type == "text"){ 
            requstKeysMap.set(formdata.key,formdata.value);
        }
    }
}

function parseUrlEncodedData(urlEncodedDataList){
    parseKeyValuePairFromList(urlEncodedDataList);
}

function parseKeyValuePairFromList(dataList){
    for(var index in dataList ){
         var keyValuePair = dataList[index];
         requstKeysMap.set(keyValuePair.key,keyValuePair.value);
    }
}

function jsonObjectToMap(jsonData) {
    if( Array.isArray(jsonData) ){
        jsonData = jsonData[0];
    }
    for(let k of Object.keys(jsonData)) {
        if(jsonData[k] instanceof Object) {
            requstKeysMap.set(k, JSON.stringify(jsonData[k]));
           jsonObjectToMap(jsonData[k]);   
        }
        else {
            requstKeysMap.set(k, jsonData[k]);
        }    
    }
}

function parseRawData(requestRawData){
    var language = ""; 
    try{
        language = requestRawData.options.raw.language;
    }
    catch(err){
        console.log(err);
        var header = pm.request.getHeaders();
        language = header['Content-Type'].split('/')[1];
    }
    var rawData = requestRawData.raw; 
    if(language != 'json' ){
        console.log("Not able to processing language",language);
        return ;
    }
    var jsonData = JSON.parse(rawData);
    jsonObjectToMap(jsonData);
}

function parseRequestBody(){
    var requestBody = pm.request.body;
    if(request == 'undefined'){
        console.log('request body is empty');
        return;
    }
    switch (requestBody.mode) {
        case "formdata":
            parseFormData(requestBody.formdata.all());
            break;
        case "urlencoded":
            parseUrlEncodedData(requestBody.urlencoded.all());
            break;
        case "raw":
            parseRawData(requestBody);
            break;
        default :
            console.log("requestBody mode not match"); 
    }
}

function createPrerequisiteMetadata(){
    parseRequestHeader();
    parseRequestQueryParam();
    parseRequestBody();
}

function jwtProcess (){
    var jwt_secret =  pm.collectionVariables.get(JWT_SECRET);
    var jwt_sample =  pm.collectionVariables.get(JWT_SAMPLE);
    createPrerequisiteMetadata();
    
    setTimeout(function(){
        console.log("keys map;",requstKeysMap);
        var [header, payload] = parseJwt(jwt_sample, jwt_secret);
        payload = createPayloadFromBody(payload);
        createJwt(header,payload, jwt_secret); 
    }, 100);
    
}

//----------------------------------------config------------------------------------------------------------

var JWT_SECRET = "ps_jwt_secret_key";
var JWT_SAMPLE = "ps_jwt_sample";
jwtProcess();
