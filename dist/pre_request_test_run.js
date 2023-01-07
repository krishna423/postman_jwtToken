/**
 * @Author Krishna K. Maurya
 * @Project autoJWTCreation
 * Date 04/05/21 09:41:43 PM
 * release 2.0.0
 **/

sdk = require('postman-collection')
var scriptInString=`({

    FORM_DATA_TEXT              : "text",
    BODY_LANGUAGE_JSON          : "json", 
    BODY_LANGUAGE_XML           : "xml",
    BODY_FORMDATA               : "formdata",
    BODY_URL_ENCODED            : "urlencoded",
    BODY_RAW                    : "raw",
    requstKeysMap               : new Map(),
    resolvedRequest             : new Object(),


/*---------------------utility---------------------------------------*/
    
    addSignature(unsignedToken,jwt_secret,alg){
        if(alg === "HS256")
            return this.base64url(CryptoJS.HmacSHA256(unsignedToken, jwt_secret));
        else if(alg === "HS512")
            return this.base64url(CryptoJS.HmacSHA512(unsignedToken, jwt_secret));
        else{
            throw new Error("Algo is not supported  :" + alg);
        } 

    },
    
    base64url(source) {
        encodedSource = CryptoJS.enc.Base64.stringify(source);
        encodedSource = encodedSource.split('=').join('');
        encodedSource = encodedSource.split('+').join('-');
        encodedSource = encodedSource.split('/').join('_');
        return encodedSource;
    },

    parseKeyValuePairFromList(dataList){
        for(var index in dataList ){
            keyValuePair = dataList[index];
            this.requstKeysMap.set(keyValuePair.key,keyValuePair.value);
        }
    },

    jsonObjectToMap(jsonData) {
        if( Array.isArray(jsonData) ){
            jsonData = jsonData[0];
        }
        for(let k of Object.keys(jsonData)) {
            if(jsonData[k] instanceof Object) {
                this.requstKeysMap.set(k, JSON.stringify(jsonData[k]));
            this.jsonObjectToMap(jsonData[k]);   
            }
            else {
                this.requstKeysMap.set(k, jsonData[k]);
            }    
        }
    },


/*--------------------create map of keyvalue-------------------------*/

    parseRequestHeader(){
        requestHeaderList = resolvedRequest.header;
        this.parseKeyValuePairFromList(requestHeaderList);
    },

    parseRequestQueryParam(){
        queryParamList = resolvedRequest.url.query;
        for( var index in queryParamList){
            queryParamKey =  queryParamList[index].key;
            queryParamValue = queryParamList[index].value;
            this.requstKeysMap.set(queryParamKey,queryParamValue);
        }
    },

    parseFormData(formdataList){
        for(var index in formdataList){
            formdata = formdataList[index];
            if(formdata.type == this.FORM_DATA_TEXT ){ 
                this.requstKeysMap.set(formdata.key,formdata.value);
            }
        }
    },

    parseUrlEncodedData(urlEncodedDataList){
        this.parseKeyValuePairFromList(urlEncodedDataList);
    },

    parseRawData(requestRawData){
        var language = ""; 
            try{
            language = requestRawData.options.raw.language;
        }
        catch(err){
            console.log(err);
            var header = pm.request.getHeaders();
            language = header['Content-Type'].split('/')[1];
        }
        rawData = requestRawData.raw; 
        if(language != this.BODY_LANGUAGE_JSON ){
            console.log("Not able to processing language : " + language + "  Only json is supported right now") ;
        }
        jsonData = JSON.parse(rawData);
        this.jsonObjectToMap(jsonData);
    },

    parseRequestBody(){
        requestBody = resolvedRequest.body;
        if(requestBody == undefined ){
            console.log('request body is empty');
            return;
        }
        switch (requestBody.mode) {
            case this.BODY_FORMDATA :
                this.parseFormData(requestBody.formdata);
                break;
            case this.BODY_URL_ENCODED :
                this.parseUrlEncodedData(requestBody.urlencoded);
                break;
            case this.BODY_RAW :
                this.parseRawData(requestBody);
                break;
            default :
                console.log("Request parsing is not allowed for given mode: " + requestBody.mode );
        }
    },

    parseRequestMetadata(){
        this.parseRequestHeader();
        this.parseRequestQueryParam();
        this.parseRequestBody();
    },

/*-----------------------------parseJwt-----------------------------*/

    parseJwt(token) {
        tokenparts = token.split('.'); 
        if(tokenparts.length != 3){
            throw new Error("Invalid token format, token : "+ token)
        }

        headerJson = JSON.parse( Buffer.from(tokenparts[0], 'base64'));
        payloadJson = JSON.parse(Buffer.from(tokenparts[1], 'base64'));

        return { "header" : headerJson, "payload" : payloadJson };
    },     
    

/*---------------------create jwt--------------------------------*/
    
    createJwt(header, payload, jwt_secret){
        encodedHeader = this.encodingData(header); 
        encodedPayload = this.encodingData(payload);
        unsignedToken = encodedHeader + "." + encodedPayload;
        jwtToken = unsignedToken + "." + this.addSignature(unsignedToken, jwt_secret,header.alg);
        console.log("New jwt token :", jwtToken);
        pm.globals.set("JWT_TOKEN", jwtToken);
    },

    encodingData(jsonData){
        stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(jsonData));
        encodedData = this.base64url(stringifiedData);
        return encodedData;
    },
    
    createPayloadFromBody(payloadJson){
        for(let key of Object.keys(payloadJson)) {
            if(this.requstKeysMap.has(key)) {
                mapValue = this.requstKeysMap.get(key);
                if(typeof mapValue == typeof payloadJson[key]){
                    payloadJson[key] = this.requstKeysMap.get(key);   
                }else{
                     console.log("JWT and request param type mismatch, trying to convert from ",  typeof mapValue, "to " , typeof payloadJson[key])
                    if(typeof payloadJson[key] == 'number')
                        payloadJson[key]=parseInt(mapValue);
                    if(typeof payloadJson[key] == 'string')
                        payloadJson[key]=mapValue.toString();
                    if(typeof payloadJson[key] == 'boolean')
                        payloadJson[key]=Boolean(mapValue);
                }
                  
            }    
        }
        return payloadJson;
    },


/*---------------------validate prerequisite--------------------------------*/

    getResolvedRequest(){
        newRequest = new sdk.Request(pm.request.toJSON());
        return newRequest.toObjectResolved(null, [pm.variables.toObject()], { ignoreOwnVariables: true });
    },

    getJwtKeys (){

        JWT_SAMPLE_KEY_NAME = typeof JWT_SAMPLE == 'undefined' ? "JWT_SAMPLE" : JWT_SAMPLE;
        JWT_SECRET_KEY_NAME = typeof JWT_SECRET == 'undefined' ? "JWT_SECRET" : JWT_SECRET;


        console.log("Fetching JWT sample from variableKey: "+ JWT_SAMPLE_KEY_NAME+ " AND JWT secret from variableKey: "+JWT_SECRET_KEY_NAME);
        jwtSample = pm.collectionVariables.get(JWT_SAMPLE_KEY_NAME);
        jwtSecret = pm.collectionVariables.get(JWT_SECRET_KEY_NAME);
    
        if(jwtSample === undefined){
            pm.collectionVariables.set(JWT_SAMPLE_KEY_NAME,"")
        }
        if(jwtSecret === undefined){
            pm.collectionVariables.set(JWT_SECRET_KEY_NAME,"")
        }

        if(jwtSample === undefined || jwtSecret === undefined){
            throw new Error("Input varibales are not created, Creating variableKey in same collection with name " + JWT_SAMPLE_KEY_NAME +"  for sample JWT Token, and  " + JWT_SECRET_KEY_NAME +" for JWT Secret");
        }
        if(jwtSample == '' || jwtSecret ==''){
            throw new Error("Sample values are not provided in input variables, fetched jwtSample value = " + jwtSample +",and jwtSecret key value = " + jwtSecret + " from collection varibales");
        }
        return { "jwtSample" : jwtSample, "jwtSecret" : jwtSecret };
    },



/*-------------------------calling main funtion--------------------------*/

    jwtProcess(){
        
        try{
            jwtKeys = this.getJwtKeys();
            jwtParsedData = this.parseJwt(jwtKeys.jwtSample);
            resolvedRequest = this.getResolvedRequest();
        }catch(err){
                console.log(err.message);
                return;
        }
        
        thisObj = this;
        setTimeout(function(){

            thisObj.parseRequestMetadata();
            setTimeout(function(){
                console.log("Get updated values from input request : ",thisObj.requstKeysMap);
                console.log("Parsed JWT : ",jwtParsedData);

                payload = thisObj.createPayloadFromBody(jwtParsedData.payload);
                setTimeout(function(){
                    console.log("New header payload",jwtParsedData.header,payload);
                    thisObj.createJwt(jwtParsedData.header,payload, jwtSecret); 
                }, 100);
            }, 100);
        },100);
    }
})`




// JWT_SECRET = "jwt_secret";
// JWT_SAMPLE = "jwt_sample";
/** no need to change here */
pm.globals.set("JWT_SECRET",scriptInString);
var jwt_script = pm.globals.get("JWT_SECRET");
const obj = eval(jwt_script);
obj.jwtProcess();


