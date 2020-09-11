var cdd = `
    ({
        isSecretKeyBase64Encoded : false,
        requstKeysMap : new Map(),
        yuy : require('fs'),
        func1()
        {
            console.log('This comes from func1',this.isSecretKeyBase64Encoded);
            fs.readFile('~/a.csv', function(err, data) {
             res.write(data);
            });
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
    })
`;