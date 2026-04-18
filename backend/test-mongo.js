const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://bhanu:bhanu@cluster0.sgwpxaf.mongodb.net/hackwithbs_quiz?appName=Cluster0').catch(e => console.error("MONGO ERROR MESSAGE: " + e.message));
