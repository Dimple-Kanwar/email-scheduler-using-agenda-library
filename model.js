const mongoose = require("mongoose");

// setup schema
const emailSchema = mongoose.Schema({
    scheduledTime:{
        type: Date,
        default: Date.now
    },
    to:{
        type: String,
        required: true
    },
    jobName:{
        type: String,
        required: true
    },
    from:{
        type: String,
        required: true
    },
    frequency:{
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createDate:{
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Email', emailSchema);