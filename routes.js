module.exports = (app) => {
    // import emailController
    const emailController = require("./controller");

    // route for scheduling a new email
    app.post("/createSchedule",emailController.create);
    // route for fetching all the scheduled emails
    app.get("/findAll",emailController.findAll);
    // route for updating a scheduled email
    app.post("/update",emailController.update);
    // route for deleting an already existing scheduled email
    app.delete("/delete/:jobName",emailController.delete);
}