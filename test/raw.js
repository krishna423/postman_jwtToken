
        

        createJwt(header, payload, jwt_secret){
            console.log("new jwt:-",header, payload);
            encodedHeader = encodingData(header); 
            payload = createPayloadFromBody(payload);
            encodedPayload = encodingData(payload);
            unsignedToken = encodedHeader + "." + encodedPayload;
            if(isSecretKeyBase64Encoded)
                jwt_secret = base64decoder(jwt_secret);
            jwtToken = unsignedToken + "." + addSignature(unsignedToken, jwt_secret);
            console.log("new jwt token  :", jwtToken);
            pm.environment.set("jwt_token", jwtToken);
        },

        encodingData(jsonData){
            stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(jsonData));
            encodedData = base64url(stringifiedData);
            return encodedData;
        },

        
        createPayloadFromBody(jsonBody){
            for(let key of Object.keys(jsonBody)) {
                if(requstKeysMap.has(key)) {
                    jsonBody[key] = requstKeysMap.get(key);   
                }    
            }    
            return jsonBody;
        },

        

        jwtProcess (){
            var jwt_secret =  pm.collectionVariables.get(JWT_SECRET);
            var jwt_sample =  pm.collectionVariables.get(JWT_SAMPLE);
           // createPrerequisiteMetadata();
            console.log("keys map;",this.requstKeysMap);
            setTimeout(function(){
                console.log("keys map;",this.requstKeysMap);
                [header, payload] = parseJwt(jwt_sample, jwt_secret);
                createJwt(header,payload, jwt_secret); 
            }, 100);
            
        }        