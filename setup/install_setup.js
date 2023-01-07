pm.test("Status code should be 200", function () {
    pm.response.to.have.status(200)
    pm.globals.set("JWT_SCRIPT", responseBody)
    pm.globals.set("JWT_TOKEN", "")
    pm.collectionVariables.set("JWT_SAMPLE","")
    pm.collectionVariables.set("JWT_SECRET","")
});