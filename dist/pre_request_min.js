/**
 * @Author Krishna K. Maurya
 * @Project autoJWTCreation
 * Date 12/09/20 09:41:43 PM
 * release 1.0.1
 **/
var k=({

    FORM_DATA_TEXT              : "text",
    BODY_LANGUAGE_JSON          : "json", 
    BODY_LANGUAGE_XML           : "xml",
    BODY_FORMDATA               : "formdata",
    BODY_URL_ENCODED            : "urlencoded",
    BODY_RAW                    : "raw",
    requstKeysMap               : new Map(),
    resolvedRequest             : new Object(),

/*--------------------create map of keyvalue-------------------------*/
    
    isEmptyObject(value) {
         return Object.keys(value).length === 0 && value.constructor === Object;
    },

    parseKeyValuePairFromList(dataList){
        for(var index in dataList ){
            keyValuePair = dataList[index];
            this.requstKeysMap.set(keyValuePair.key,keyValuePair.value);
        }
    },

    createPayloadFromBody(jsonBody){
        for(let key of Object.keys(jsonBody)) {
            if(requstKeysMap.has(key)) {
                jsonBody[key] = requstKeysMap.get(key);   
            }    
        }    
        return jsonBody;
    },

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
            throw new Error("Not able to processing language : " + language + "  Only json is supported right now") ;
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
                throw new Error("requestBody mode does not match to supported mode Given mode: " + requestBody.mode +" is not supported right now" );
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
        header = Buffer.from(base64Header, 'base64');
        headerJson = JSON.parse(header);
        payload = Buffer.from(base64Payload, 'base64');
        payloadJson = JSON.parse(payload);
        for(let key of Object.keys(payloadJson)) {
            if(this.requstKeysMap.has(key)) {
                mapValue = this.requstKeysMap.get(key);
                if(typeof mapValue != typeof payloadJson[key]){
                     console.log(typeof payloadJson[key])
                    if(typeof payloadJson[key] == 'number')
                        this.requstKeysMap.set(key,parseInt(mapValue))
                    if(typeof payloadJson[key] == 'string')
                        this.requstKeysMap.set(key,mapValue.toString())
                    if(typeof payloadJson[key] == 'boolean')
                        this.requstKeysMap.set(key,Boolean(mapValue))
                  
                }
                     
            }    
        } 
        return [headerJson, payloadJson];
    },     
    


/*---------------------utility---------------------------------------*/
    
    addSignature(unsignedToken,jwt_secret,alg){
        //console.log(alg)
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

/*---------------------create jwt--------------------------------*/
    
    createJwt(header, payload, jwt_secret){
        /*console.log("new jwt:-",header, payload);*/
        encodedHeader = this.encodingData(header); 
        encodedPayload = this.encodingData(payload);
        unsignedToken = encodedHeader + "." + encodedPayload;
        jwtToken = unsignedToken + "." + this.addSignature(unsignedToken, jwt_secret,header.alg);
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

    getResolvedRequest(){
        newRequest = new sdk.Request(pm.request.toJSON());
        return newRequest.toObjectResolved(null, [pm.variables.toObject()], { ignoreOwnVariables: true });
    },

    getJwtKeys (){

        jwt_sample = pm.collectionVariables.get(JWT_SAMPLE);
        jwt_secret = pm.collectionVariables.get(JWT_SECRET);
    
        if(jwt_sample === undefined || jwt_secret === undefined){
            console.log("Invalid jwt_metaData, fetched jwt_sample value = " , + jwt_sample +"and jwt_secret key = " + jwt_secret);
            return undefined;
        }
    
        return { "jwt_sample" : jwt_sample, "jwt_secret" : jwt_secret };
    },



/*-------------------------calling main funtion--------------------------*/

    jwtProcess(){
        
        jwt_metaData = this.getJwtKeys();
        if(jwt_metaData == undefined)
            return;
        resolvedRequest = this.getResolvedRequest();
        thisObj = this;

        setTimeout(function(){
            try{
                thisObj.createPrerequisiteMetadata();
                [header, payload] = thisObj.parseJwt(jwt_sample, jwt_secret);
            }catch(err){
                console.log(err.message);
                return;
            }
        
            setTimeout(function(){
                console.log("New keysMap,",thisObj.requstKeysMap);
                payload = thisObj.createPayloadFromBody(payload);
                setTimeout(function(){
                    console.log("New header payload",header,payload);
                    thisObj.createJwt(header,payload, jwt_secret); 
                }, 100);

            }, 100);
        },100);
    }
})


var JWT_SECRET = "jwt_secret";
var JWT_SAMPLE = "jwt_sample";
sdk = require('postman-collection')
k.jwtProcess()