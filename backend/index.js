// Setting up Dependancies

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://nnaomiraven:pSnuhBwDpr#a4kx@cluster0.ncn2zq2.mongodb.net/?appName=Cluster0";
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config();
const express = require('express');
const mongoose = require("mongoose");
const cors = require("cors");


// Initial App setup
const port = 3000;
const app = express(); // Using Express.js to power app


//-----------------Middleware setup--------------
app.use(express.json());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// MONGO SETUP
(async () => {
    try{
        //Setting autoIndex to false
        mongoose.set("autoIndex", false);
        //Attempt to connect to cluster
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected!");
        //Sync indexes
        await Task.syncIndexes();
        console.log("✅ Indexes created!");
        //App startup
        app.listen(port, () => {
            console.log(`✅ To Do App listening on port ${port}`);
        });
    }catch (error){
        console.error(`Startup error: ${error}`);
    }
})();

//Define a task (mongoose) Schema. Mongoose is a library that sits on top of MongoDB and add structure.
// MongoDB is schema-less by default, Mongoose lets you enforce rules on your data. Schema is a rule set of how things are layed out
const taskSchema = new mongoose.Schema({
    title: {type: String, required: true},
    completed: {type: Boolean, required: true, default: false},
    description: {type: String, required: true}, //Mongo doesn't do type Text
    dueDate: {type: Date, required: true},
    dateCreated: {type: Date, required: true, default: (Date.now())},
});

//Define indexes for sorting
taskSchema.index({dueDate: 1 });
taskSchema.index({dateCreated: 1});


const Task = mongoose.model("Task", taskSchema);

//-----------------API routes------------------------

// Get all tasks
// This request fetches all tasks from the datavase and send them back to client
// Checks sortBy which was included in URL. Queries database with Task.find({})
//Applies sort if there is one, sends the results back to JSON. 
// Essentially getting a list of all your tasks, optionally sorted by due date or date created
app.get('/api/tasks', async (req, res) => {
  try {
    const { sortBy } = req.query; // ?sortBy=dueDate or ?sortBy=dateCreated
    let sortOption = {};
    if (sortBy === 'dueDate') {
        sortOption = { dueDate: 1 }; // Ascending
    } else if (sortBy === 'dateCreated') {
        sortOption = { dateCreated: 1 };
    }
    const tasks = await Task.find({}).sort(sortOption);
    if (!tasks) {
      return res.status(404).json({ message: "Tasks not found!" });
    }
    res.json(tasks);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error grabbing tasks!" });
  } 
});

//Create a new task and add it to the tasks array/list
// creates a new task and saves it to the database
app.post('/api/tasks/todo', async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const taskData = { title, description, dueDate };
    const createTask = new Task(taskData);
    const newTask = await createTask.save();
    res.json({ task: newTask, message: "New task created successfully!" });
      
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error creating the task!" });
  }
});


// PATCH another HTTP method which partially updating a specific method rather than creating a new one  
// Marks the task as complete (else shows error) 
app.patch('/api/tasks/complete/:id', async (req, res) => {
  try {
    const { completed } = req.body;
    const taskId = req.params.id;
    const completedTask = await Task.findByIdAndUpdate(taskId, { completed }, { new: true });
    if (!completedTask) {
      return res.status(404).json({ message: "Task not found!" });
    }
    res.json({ task: completedTask, message: "Task set to 'Complete'" });
      
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error completing the task!" });
  }
});




// To make the task 'not complete' and move columns
//PATCH because it is updating an existing method
app.patch('/api/tasks/notComplete/:id', async (req, res) => {
  try {
    const { completed } = req.body; 
    const taskId = req.params.id;
    const taskNotComplete = await Task.findByIdAndUpdate(taskId, { completed }, { new: true });
    if (!taskNotComplete) {
      return res.status(404).json({ message: "Task not found!" });
    }
    res.json({ task: taskNotComplete, message: "Task set to 'Not Complete'" });
      
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error making the task NOT complete!" });
  }
});




// Delete method permanently deletes task from database
app.delete('/api/tasks/delete/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const deletedTask = await Task.findByIdAndDelete(taskId);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found!" });
    }
    res.json({ task: deletedTask, message: "Task deleted successfully!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error deleting the task!" });
  }
});


// To edit exisiting task and update
app.put('/api/tasks/update/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, dueDate } = req.body;  // Extract data from front end request
    const taskData = { title, description, dueDate };
    const updatedTask = await Task.findByIdAndUpdate(taskId, taskData, { new: true });
    if (!updatedTask) {
        return res.status(404).json({ message: "Task not found!" });
    }
    res.json({ task: updatedTask, message: "Task updated successfully!" });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: "Error updating the task!" });
  }
});