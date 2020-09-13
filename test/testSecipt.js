var stringScript = `
({
    /**
     * @Author Krishna K. Maurya
     * @Project autoJWTCreation
     * Date 12/09/20 09:41:43 PM
     **/

    isSecretKeyBase64Encoded : false,
    requstKeysMap : new Map(),

/*--------------------create map of keyvalue-------------------------*/
    
    createPayloadFromBody(jsonBody){
        for(let key of Object.keys(jsonBody)) {
            if(requstKeysMap.has(key)) {
                jsonBody[key] = requstKeysMap.get(key);   
            }    
        }    
        return jsonBody;
    },

    parseRequestHeader(){
        requestHeaderList = pm.request.headers.all();
        this.parseKeyValuePairFromList(requestHeaderList);
    },

    parseRequestQueryParam(){
        queryParamString = pm.request.url.getQueryString();
        if(!queryParamString)
            return;
        queryParamList = queryParamString.split('&');
        for( var index in queryParamList){
            queryParam =  queryParamList[index].split(/=(.+)/);
            this.requstKeysMap.set(queryParam[0],queryParam[1]);    
        }
    },

    parseFormData(formdataList){
        for(var index in formdataList){
            formdata = formdataList[index];
            if(formdata.type == "text"){ 
                this.requstKeysMap.set(formdata.key,formdata.value);
            }
        }
    },

    parseUrlEncodedData(urlEncodedDataList){
        this.parseKeyValuePairFromList(urlEncodedDataList);
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

    parseRawData(requestRawData){
        language = requestRawData.options.raw.language;
        rawData = requestRawData.raw; 
        if(language != 'json' ){
            console.log("Not able to processing language",language);
            return ;
        }
        jsonData = JSON.parse(rawData);
        this.jsonObjectToMap(jsonData);
    },

    parseRequestBody(){
        requestBody = pm.request.body;
        switch (requestBody.mode) {
            case "formdata":
                this.parseFormData(requestBody.formdata.all());
                break;
            case "urlencoded":
                this.parseUrlEncodedData(requestBody.urlencoded.all());
                break;
            case "raw":
                this.parseRawData(requestBody);
                break;
            default :
                console.info("requestBody mode not match"); 
        }
    },

    createPrerequisiteMetadata(){
        this.parseRequestHeader();
        this.parseRequestQueryParam();
        this.parseRequestBody();
        /*console.log('request map',this.requstKeysMap)*/
    },

/*-----------------------------parseJwt-----------------------------*/

    parseJwt(token, jwt_secret) {
        base64Header = token.split('.')[0]; 
        base64Payload = token.split('.')[1];
        signature = token.split('.')[2];
        unsignedToken = base64Header + "." + base64Payload;
        this.verifyJWT(unsignedToken, signature, jwt_secret);
        header = Buffer.from(base64Header, 'base64');
        headerJson = JSON.parse(header);
        payload = Buffer.from(base64Payload, 'base64');
        payloadJson = JSON.parse(payload);
        return [headerJson, payloadJson];
    },

    verifyJWT(unsignedToken, signature, jwt_secret){
        calculatedSign = this.addSignature(unsignedToken, jwt_secret);
        if(calculatedSign == signature){
            this.isSecretKeyBase64Encoded = false;
        } else{
            decoded = this.base64decoder(jwt_secret);
            calculatedSign = this.addSignature(unsignedToken, decoded);
            if(calculatedSign == signature){
                this.isSecretKeyBase64Encoded = true ;
            }
            else{
                console.log("Invalid jwt");
                return;
            }
        }
        console.log("is base64 encoded secret ", this.isSecretKeyBase64Encoded);
    },        

    base64decoder(base64){
        words = CryptoJS.enc.Base64.parse(base64);
        decoded = CryptoJS.enc.Utf8.stringify(words);
        return decoded;
    },

/*---------------------utility---------------------------------------*/
    
    addSignature(unsignedToken,jwt_secret){
        return this.base64url(CryptoJS.HmacSHA256(unsignedToken, jwt_secret));
    },
    
    base64url(source) {
        encodedSource = CryptoJS.enc.Base64.stringify(source);
        encodedSource = encodedSource.split('=').join('');
        encodedSource = encodedSource.split('+').join('-');
        encodedSource = encodedSource.split('/').join('_');
        return encodedSource;
    },

/*---------------------create jwt--------------------------------*/
    
    createJwt(header, payload, jwt_secret){
        /*console.log("new jwt:-",header, payload);*/
        encodedHeader = this.encodingData(header); 
        encodedPayload = this.encodingData(payload);
        unsignedToken = encodedHeader + "." + encodedPayload;
        if(this.isSecretKeyBase64Encoded)
            jwt_secret = this.base64decoder(jwt_secret);
        jwtToken = unsignedToken + "." + this.addSignature(unsignedToken, jwt_secret);
        console.log("New jwt token :", jwtToken);
        pm.globals.set("jwt_token", jwtToken);
    },

    encodingData(jsonData){
        stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(jsonData));
        encodedData = this.base64url(stringifiedData);
        return encodedData;
    },
    
    createPayloadFromBody(jsonBody){
        for(let key of Object.keys(jsonBody)) {
            if(this.requstKeysMap.has(key)) {
                jsonBody[key] = this.requstKeysMap.get(key);   
            }    
        }    
        return jsonBody;
    },

/*-------------------------calling funtion--------------------------*/

    jwtProcess(){
        jwt_secret = pm.collectionVariables.get(JWT_SECRET);
        jwt_sample = pm.collectionVariables.get(JWT_SAMPLE);
        this.createPrerequisiteMetadata();
        [header, payload] = this.parseJwt(jwt_sample, jwt_secret);
        thisObj = this;
        setTimeout(function(){
            console.log("New keysMap,",thisObj.requstKeysMap);
            payload = thisObj.createPayloadFromBody(payload);
            setTimeout(function(){
                console.log("New header payload",header,payload);
                thisObj.createJwt(header,payload, jwt_secret); 
            }, 100);

        }, 100);
    }
})
`;


var JWT_SECRET = "ps_jwt_secret_key";
var JWT_SAMPLE = "ps_jwt_sample";
const obj = eval(stringScript);
obj.jwtProcess();
