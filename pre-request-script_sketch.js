   /**
     * @Author Krishna K. Maurya
     * @Project autoJWTCreation
     * Date 12/09/20 09:41:43 PM
     **/

    FORM_DATA_TEXT              = "text";
    BODY_LANGUAGE_JSON          = "json"; 
    BODY_LANGUAGE_XML           = "xml";
    BODY_FORMDATA               = "formdata";
    BODY_URL_ENCODED            = "urlencoded";
    BODY_RAW                    = "raw";
    isSecretKeyBase64Encoded    = false,
    requstKeysMap               = new Map(),

/*--------------------create map of keyvalue-------------------------*/
    
    function createPayloadFromBody(jsonBody){
        for(let key of Object.keys(jsonBody)) {
            if(requstKeysMap.has(key)) {
                jsonBody[key] = requstKeysMap.get(key);   
            }    
        }    
        return jsonBody;
    }

    function parseRequestHeader(){
        requestHeaderList = pm.request.headers.all();
         parseKeyValuePairFromList(requestHeaderList);
    }

    function parseRequestQueryParam(){
        queryParamString = pm.request.url.getQueryString();
        if(!queryParamString)
            return;
        queryParamList = queryParamString.split('&');
        for( var index in queryParamList){
            queryParam =  queryParamList[index].split(/=(.+)/);
             requstKeysMap.set(queryParam[0],queryParam[1]);    
        }
    }

    function parseFormData(formdataList){
        for(var index in formdataList){
            formdata = formdataList[index];
            if(formdata.type == FORM_DATA_TEXT ){ 
                 requstKeysMap.set(formdata.key,formdata.value);
            }
        }
    }

    function parseUrlEncodedData(urlEncodedDataList){
         parseKeyValuePairFromList(urlEncodedDataList);
    }

    function parseKeyValuePairFromList(dataList){
        for(var index in dataList ){
            keyValuePair = dataList[index];
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
        language = requestRawData.options.raw.language;
        rawData = requestRawData.raw; 
        if(language != BODY_LANGUAGE_JSON ){
            console.log("Not able to processing language",language);
            return ;
        }
        jsonData = JSON.parse(rawData);
         jsonObjectToMap(jsonData);
    }

    function parseRequestBody(){
        requestBody = pm.request.body;
        switch (requestBody.mode) {
            case BODY_FORMDATA :
                 parseFormData(requestBody.formdata.all());
                break;
            case BODY_URL_ENCODED:
                 parseUrlEncodedData(requestBody.urlencoded.all());
                break;
            case BODY_RAW :
                 parseRawData(requestBody);
                break;
            default :
                console.info("requestBody mode not match"); 
        }
    }

    function createPrerequisiteMetadata(){
         parseRequestHeader();
         parseRequestQueryParam();
         parseRequestBody();
        /*console.log('request map', requstKeysMap)*/
    }

/*-----------------------------parseJwt-----------------------------*/

    function parseJwt(token, jwt_secret) {
        base64Header = token.split('.')[0]; 
        base64Payload = token.split('.')[1];
        signature = token.split('.')[2];
        unsignedToken = base64Header + "." + base64Payload;
         verifyJWT(unsignedToken, signature, jwt_secret);
        header = Buffer.from(base64Header, 'base64');
        headerJson = JSON.parse(header);
        payload = Buffer.from(base64Payload, 'base64');
        payloadJson = JSON.parse(payload);
        return [headerJson, payloadJson];
    }

    function verifyJWT(unsignedToken, signature, jwt_secret){
        calculatedSign =  addSignature(unsignedToken, jwt_secret);
        if(calculatedSign == signature){
             isSecretKeyBase64Encoded = false;
        } else{
            decoded =  base64decoder(jwt_secret);
            calculatedSign =  addSignature(unsignedToken, decoded);
            if(calculatedSign == signature){
                 isSecretKeyBase64Encoded = true ;
            }
            else{
                console.log("Invalid jwt");
                return;
            }
        }
        console.log("is base64 encoded secret ",  isSecretKeyBase64Encoded);
    }       

    function base64decoder(base64){
        words = CryptoJS.enc.Base64.parse(base64);
        decoded = CryptoJS.enc.Utf8.stringify(words);
        return decoded;
    }

/*---------------------utility---------------------------------------*/
    
    function addSignature(unsignedToken,jwt_secret){
        return  base64url(CryptoJS.HmacSHA256(unsignedToken, jwt_secret));
    }
    
    function base64url(source) {
        encodedSource = CryptoJS.enc.Base64.stringify(source);
        encodedSource = encodedSource.split('=').join('');
        encodedSource = encodedSource.split('+').join('-');
        encodedSource = encodedSource.split('/').join('_');
        return encodedSource;
    }

/*---------------------create jwt--------------------------------*/
    
    function createJwt(header, payload, jwt_secret){
        /*console.log("new jwt:-",header, payload);*/
        encodedHeader = encodingData(header); 
        encodedPayload = encodingData(payload);
        unsignedToken = encodedHeader + "." + encodedPayload;
        if(isSecretKeyBase64Encoded)
            jwt_secret = base64decoder(jwt_secret);
        jwtToken = unsignedToken + "." + addSignature(unsignedToken, jwt_secret);
        console.log("New jwt token :", jwtToken);
        pm.globals.set("jwt_token", jwtToken);
    }

    function encodingData(jsonData){
        stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(jsonData));
        encodedData = base64url(stringifiedData);
        return encodedData;
    }
    
    function createPayloadFromBody(jsonBody){
        for(let key of Object.keys(jsonBody)) {
            if(requstKeysMap.has(key)) {
                jsonBody[key] =  requstKeysMap.get(key);   
            }    
        }    
        return jsonBody;
    }

/*-------------------------calling funtion--------------------------*/

    function jwtProcess(){
        jwt_secret = pm.collectionVariables.get(JWT_SECRET);
        jwt_sample = pm.collectionVariables.get(JWT_SAMPLE);
        createPrerequisiteMetadata();
        [header, payload] = parseJwt(jwt_sample, jwt_secret);
        setTimeout(function(){
            console.log("New keysMap,",requstKeysMap);
            payload = createPayloadFromBody(payload);
            setTimeout(function(){
                console.log("New header payload",header,payload);
                createJwt(header,payload, jwt_secret); 
            }, 100);

        }, 100);
    }

// //jwt_secret and jwt_sample should be collection variable
var JWT_SECRET = "ps_jwt_secret_key";
var JWT_SAMPLE = "ps_jwt_sample";
jwtProcess();