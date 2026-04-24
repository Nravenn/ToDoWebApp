// Global variables can be used anywhere in this program. Like var, let and const
const taskForm = document.getElementById('taskForm');
const toDoList = document.getElementById('toDoList');
const completedList = document.getElementById('completedList');
const url = "http://localhost:3000";


// general functions that can be used throughout this program or call on multiple times
function resetForm() {   // The displayTasks() function must be created first before writing this one as it calls to it
  taskForm.reset();
}


// GENERAL EVENT LISTENERS - Event listeners look out for specific actions to occur on a target e.g. click or mouseover

// When the page loads, it will reset to the default sorting option

const sortButton = document.getElementById("sortSelect");
window.addEventListener("DOMContentLoaded", () => {
  sortButton.value = "default";
});
sortButton.addEventListener('change', () => {
  displayTasks(); 
});

window.addEventListener("DOMContentLoaded", () => {   // Make sure to create the displayTasks() function first before adding this listener
  displayTasks();
});


// Event Listeners for each Task
// Creating a new task
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createNewTask();
});

// DON'T DO THE OTHER EVENT LISTENERS YET UNTIL YOU DO THE APPROPRIATE FUNCTIONS FOR THEM FIRST

// for each of the inputted to do lists
[toDoList, completedList].forEach(list => {
  list.addEventListener('click', (event) => {
    if (event.target.classList.contains("done")) {                  // Completes the task when 'Done' button is clicked 
      const taskId = event.target.getAttribute("data-id");
      completeTask(taskId);
    }
    else if (event.target.classList.contains("notDone")) {         // Marks the task as not completed when 'Not done' button is clicked
      const taskId = event.target.getAttribute("data-id");
      taskNotCompleted(taskId);
    }
    
    else if (event.target.classList.contains("delete")) {           // Deletes the task when 'Delete' button is clicked
      const taskId = event.target.getAttribute("data-id");
      deleteTask(taskId);
    }
    else if (event.target.classList.contains('edit')) { // Opens the edit task modal, modal is a secondary dialogue box forcing the user to interact before return to the original content 

      // Group task data: id, title, description, due date
      const task = {
        id: event.target.getAttribute('data-id'),
        title: event.target.getAttribute('data-title'),
        description: event.target.getAttribute('data-description'),
        dueDate: new Date(event.target.getAttribute('data-due-date'))
      };

      // Group modal elements: Task name, description, due date, and save button
      const modal = {
        titleInput: document.getElementById('editTaskName'),
        descriptionInput: document.getElementById('editTaskDescription'),
        dueDateInput: document.getElementById('editDueDate'),
        saveButton: document.getElementById('saveButton')
      };

      // Fill modal inputs, ISO standard format on date. Split is used on string objects to divide string into an ordered list
      modal.titleInput.value = task.title;
      modal.descriptionInput.value = task.description;
      modal.dueDateInput.value = task.dueDate.toISOString().split('T')[0];

      // Save changes from function above above 
      modal.saveButton.addEventListener('click', async () => {
        await editTask(task.id);
        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
      }, { once: true });
    }
  });
});


// TASK FUNCTIONS

// Retrieving tasks from api.js file in a task array.
// Displaying tasks asyncronous (start now, finish later)

async function displayTasks() {
  const sortSelect = document.getElementById('sortSelect');
  const sortBy = sortSelect.value; // 'dueDate', 'dateCreated', or 'default'
  let query = '';
  if (sortBy !== 'default') {
    query = `?sortBy=${sortBy}`;
  }

  // try encloses code that might cause an error
  try { 
    // Fetch tasks from the API (sends GET request to API). If request fails, throws an error. Otherwise parses the response as JSON
    const response = await fetch(`${url}/api/tasks${query}`);
    if (!response.ok) {
      throw new Error(`Failed to get tasks: ${response.status}`); // throws error if found
    }
    const data = await response.json();

    // Format task - takes a single task object and builds HTML list item
    function formatTask(task) {
      const li = document.createElement("li"); 
      li.classList.add("card", "p-3", "shadow-sm", "mt-2");
      const done = task.completed ? "text-decoration-line-through opacity-50" : "";  // Class list if task is completed or not

      //setting the HTML content inside this list item
      li.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          <h4 class="${done} col-11">${task.title}</h4>
          <button data-id="${task._id}" type="button" class="btn-close delete" aria-label="Close"></button>
        </div>
        <p class="${done}">${task.description}</p>
        <p class="${done}"><strong>Due: </strong>${new Date(task.dueDate).toLocaleDateString()}</p>
        <div class="d-flex justify-content-between align-items-end">
          <div>
            ${
              task.completed ? 
              `<button data-id="${task._id}" class="btn btn-primary shadow-sm notDone" type="button">Not done</button>`
              : 
              `
                <button data-bs-toggle="modal" data-bs-target="#editModal" data-title="${task.title}" data-description="${task.description}" data-due-date="${task.dueDate}" data-id="${task._id}" class="btn btn-primary shadow-sm edit" type="button">Edit</button>
                <button data-id="${task._id}" class="btn btn-primary shadow-sm done" type="button">Done</button>
              `
            }
          </div>
          <p class="m-0 ${done}"><strong>Created on: </strong>${new Date(task.dateCreated).toLocaleDateString()}</p>
        </div>
      `;
      return li; //return list - stops function and sends value back to code that calls it
    }
    // Both lists are cleared first to avoid duplicates. Render tasks into the DOM
    toDoList.innerHTML = "";
    completedList.innerHTML = "";
    const tasks = data;
    tasks.forEach(task => {
      const formattedTask = formatTask(task);
      task.completed ? completedList.appendChild(formattedTask) : toDoList.appendChild(formattedTask);
    });
    resetForm();

    //clean up and error handling
  } catch (error) {
    console.error("Error: ", error);
  }
}


// Creating new temporary tasks in index.js file 
// async function collects form data, validates it and sends it to an API to create a new task

async function createNewTask() {
    // Collects data and reads in HTML and stores them in an object
  const taskDetails = {
    title: taskForm.taskName.value.trim(),
    description: taskForm.taskDescription.value.trim(),
    dueDate: taskForm.dueDate.value
  }
  // validating: checking that all fields are filled in, else shows alert and exits function early
  if (!taskDetails.title || !taskDetails.description || !taskDetails.dueDate) {
    return alert("All fields required!");
  }
  try {
    // send data to API - POST request to backend API, send taskDetails as JSON string. Await pauses until server responds. 
    const response = await fetch(`${url}/api/tasks/todo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(taskDetails)
    });
    // If server returns error, it throws error. If successful, it parses the JSON response and calls displayTasks() to refresh the task list in the UI
    if (!response.ok) {
      throw new Error(`Failed to post task: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    displayTasks(); 
  } catch (error) { // Catches error are logged to console
    console.error("Error:", error);
  }
}

// Tasks marked as completed
// receives taskId - pulled from data-id attribute on "done" button in previous code
async function completeTask(taskId) {
  try {
    //sending PATCH request (not POST or PUT) because only partially updating the task
    const response = await fetch(`${url}/api/tasks/complete/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ completed: true })
    });
    //
    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.status}`);
    }
    const data = await response.json();
    console.log("Task completed:", data);
    displayTasks(); 
  } 
  catch (error) {
    console.error("Error:", error);
  }
};




// marks task as not complete ↓
async function taskNotCompleted(taskId) {
  try {
    const response = await fetch(`${url}/api/tasks/notComplete/${taskId}`, {
      method: "PATCH", 
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ completed: false })
    });
    if (!response.ok) {
      throw new Error(`Failed to make task incomplete: ${response.status}`);
    }
    const data = await response.json();
    console.log("Task not complete:", data);
    displayTasks();
      
  } catch (error) {
    console.error("Error:", error);
  }
};




// delete task ↓
async function deleteTask(taskId) {
  try {
    const response = await fetch(`${url}/api/tasks/delete/${taskId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.status}`);
    }
    const data = await response.json();
    console.log({ message: "Deleted Task:", Task: data });
    displayTasks(); 
    
  } catch (error) {
    console.error("Error:", error);
  }
};




// enables editing of the task ↓
async function editTask(taskId) {
  const updatedDetails = {     
    title: document.getElementById('editTaskName').value.trim(),
    description: document.getElementById('editTaskDescription').value.trim(),
    dueDate: document.getElementById('editDueDate').value
  };
  if (!updatedDetails.title || !updatedDetails.description || !updatedDetails.dueDate) {
    return alert("All fields required!");
  }
  
  try {
    const response = await fetch(`${url}/api/tasks/update/${taskId}`, {    
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedDetails)
    });
    if (!response.ok) {
      throw new Error(`Failed to edit task: ${response.status}`);
    }
    const data = await response.json();        
    console.log("Edited Task:", data);  
    displayTasks();
  } catch (error) {
    console.error("Error:", error);
  }
};