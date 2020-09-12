var k=`({
        isSecretKeyBase64Encoded : false,
        requstKeysMap : new Map(),
        func1()
        {
            console.log('This comes from func1',this.isSecretKeyBase64Encoded);
            
        },
        func2()
        {
            this.requstKeysMap.set('as','asaasa');
            console.log('This comes from func2',this.requstKeysMap)
        },
        func3(k)
        {
            console.log('This comes from func3',k)
        }
    })`;

var JWT_SECRET = "ps_jwt_secret_key";
var JWT_SAMPLE = "ps_jwt_sample";
//var t = pm.globals.get('jwt_script')
//console.log(t);
const obj = eval(k);
obj.func1();
obj.func2();
obj.func3();