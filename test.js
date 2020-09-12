var cdd = `
    ({
        isSecretKeyBase64Encoded : false,
        requstKeysMap : new Map(),
        func1()
        {
            console.log('This comes from func1',this.isSecretKeyBase64Encoded)
        },
        /*----------------dasdsa-------------*/
        func2()
        {
            this.requstKeysMap.set('as','asaasa');
            console.log('This comes from func2',this.requstKeysMap)
        },
        func3(k)
        {
            console.log('This comes from func3',k)
        },
        jwtProcess(){
            jwt_secret =  pm.collectionVariables.get(JWT_SECRET);
            jwt_sample =  pm.collectionVariables.get(JWT_SAMPLE);

            this.func3();
            thisObj = this;
            setTimeout(function(){
                console.log("New keysMap,",thisObj.requstKeysMap);
                console.log("ffff",thisObj.func2());
                console.log('secret',jwt_secret,jwt_sample);

            }, 100);
        }
    })
`;