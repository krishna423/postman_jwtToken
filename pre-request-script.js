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
//jwtProcess();


var requstKeysMap = new Map();

function parseRequestHeader(){
    var requestHeaderList = pm.request.headers.all();
    parseKeyValuePairFromList(requestHeaderList);
}

function parseRequestQueryParam(){
    var queryParamString = pm.request.url.getQueryString();
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
            requstKeysMap.set(k,JSON.stringify(jsonData[k]));
            //console.log('object',JSON.stringify(jsonData[k]));
           jsonObjectToMap(jsonData[k]);   
        }
        else {
            requstKeysMap.set(k,jsonData[k]);
        }    
    }
}

function parseRawData(requestRawData){
    var language = requestRawData.options.raw.language;
    var rawData = requestRawData.raw; 
    if(language!='json'){
        console.log("Not able to processing language",language);
        return ;
    }
    var jsonData = JSON.parse(rawData);
    jsonObjectToMap(jsonData);

}


function parseRequestBody(){
    var requestBody = pm.request.body;
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
            console.info("requestBody mode not match"); 
    }
    console.log(requstKeysMap);

}

function createPrerequisiteMetadata(){
    parseRequestHeader();
    parseRequestQueryParam();
    parseRequestBody();
}

createPrerequisiteMetadata();
