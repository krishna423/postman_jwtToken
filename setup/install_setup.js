pm.test("Status code should be 200", function () {
    pm.response.to.have.status(200)
    pm.globals.set("JWT_SCRIPT", responseBody)
});