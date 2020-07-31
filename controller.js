// import email model
const Email = require("./model");

// import nodemailer 
var nodemailer = require('nodemailer');
// import agenda
const Agenda = require('agenda');
const agenda = new Agenda({db: {address: "mongodb://localhost:27017/agenda",collection:"emails"}});

// start agenda on server restart
(async function() {
    await agenda.start();
})();

// handle index actions
exports.findAll = function(req,res){
    Email.find({},(err, emails) => {
        if(err){
            res.json({
                status: "Error",
                message: err
            });
        }
        res.json({
            status: "Success",
            message: "All emails fetched successfully.",
            data: emails
        })
    })
};

// handle schedule new email task
exports.create = (req,res) => {
    console.log("req.body: ", req.body);

    agenda.define(req.body.jobName, {priority: 'high', concurrency: 10}, async (job,done) => {
    
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "<gmail-id-here>",
                pass: "<gmail-password-here>"
            }
        });
        //console.log("transporter: ", transporter);    
        var mailOptions = {
            from: req.body.from,
            to: req.body.to,
            subject: req.body.subject,
            text: req.body.text
        };
        console.log("mailOptions: ", mailOptions);    
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log("error: " ,error);
                
                res.json({
                    message: "Error occured.",
                    Error: error
                })
            } else {
                console.log('Email sent: ' + info.response);
                transporter.close();
                done();
                res.json({
                    message: "email scheduled successfully.",
                    data: info.response
                })
            }
        });
    });

    (async function() {
        if(req.body.frequency == "Weekly"){
            var job = await agenda.create(req.body.jobName, req.body);
            job.repeatAt(req.body.scheduledTime);
            await job.save();
        }else if(req.body.frequency == "Daily"){
            let dailyReport = await agenda.create(req.body.jobName, req.body);
            dailyReport.repeatEvery('1 day').save();
        }else if(req.body.frequency == "Monthly"){
            let schedule = req.body.scheduledTime;
            let day = schedule.split(" ");
            day = day[0].substring(0,day[0].length-2);
            console.log(day);
            let interval = "0 0 0 " + day + " * *"
            console.log(interval);
            var job = await agenda.create(req.body.jobName, req.body);
            job.repeatEvery(interval, { timezone: "Asia/Kolkata"});
            await job.save();
        }else if(req.body.frequency == "Custom"){
            var scheduleDates = req.body.scheduledTime.split(",")
            console.log(scheduleDates);
            for(let i=0;i<scheduleDates.length;i++){
                let date = new Date(scheduleDates[i]).getTime();
                date = new Date(date)
                req.body.scheduledTime = date
                var job = await agenda.schedule(date, req.body.jobName, req.body);
            }
        }else{
            console.log("Frequency is case-sensitive.")
            res.json({
                message: "Frequency is case-sensitive.First letter should be capital."
            })
        }
    })();   
}

// handle update scheduled email task
exports.update = (req,res) => {
    console.log("updating a schedule.");
    console.log("req.body: ", req.body);
    
    agenda.define(req.body.jobName, {priority: 'high', concurrency: 10}, (job, done) => {
        const jobName = req.body.jobName;
        Email.findOneAndUpdate({name: jobName}, { $set: { 
            "data.text": req.body.text,
            "data.subject": req.body.subject, 
            "data.to": req.body.to,
            "data.from": req.body.from,
            "data.scheduledTime":req.body.scheduledTime,
            "data.frequency":req.body.frequency
        }}, (error, result) => {
            if(result) {
                console.log('Successfully updated scheduled email. jobName: ', jobName);
                console.log("result: ", result);
                done();
                res.jon({
                    Result: result,
                    message: "Successfully updated scheduled email"
                })
            } else {
                console.log("Error updating scheduled email. jobName: ", jobName);
                console.log(error);
                done();
                res.jon({
                    Error: error,
                    message: "Error updating scheduled email"
                })
            }
        })
    });

    (async function() {
        const numRemoved = await agenda.cancel({name: req.body.jobName});
        console.log("numRemoved: ", numRemoved);
        await agenda.schedule(req.body.scheduledTime, req.body.jobName, req.body);
    })();   
}

// handle delete email task
exports.delete = async(req,res) => {
    // Cancel the job, which deletes the document from the 'emails' collection
    console.log("Deleting a schedule named "+ req.params.jobName);
    const numRemoved = await agenda.cancel({name: req.params.jobName});
    console.log("numRemoved: ", numRemoved);
    res.json({ message: `Email ${req.params.jobName} deleted.` });
}

// to gracefully stop and kill the agenda process
let graceful = () => {
    agenda.stop(() => process.exit(0));
}

process.on("SIGTERM", graceful);
process.on("SIGINT", graceful);