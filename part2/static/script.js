// Array to store application data
const applications = [];

// Function to submit an application to the list and send it to the server
function submit() {
    const name = document.getElementById('name').value;
    const zipcode = document.getElementById('zipcode').value;
    const address = document.getElementById('address').value;
    
     // Validate inputs
     if (!name || !zipcode) {
        const appList = document.getElementById('applicationList')
        appList.innerHTML = "Please fill out both Name and Zipcode.";
        return;
    }
    
    const appStatus = "Received";
    
    // Create a JSON object with application data
    const applicationData = {
        appStatus: appStatus,
        appName: name,
        appAddress: address,
        appZip: zipcode
    };

    // Send the application data to the server via POST request
    fetch('/api/add_appNumber', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
    })
        .then(response => response.json())
        .then(data => {
            
            // Display a success message or handle errors if needed
            console.log(data.message);

            // Add the new application data to the applications array
            applications.push(applicationData);
            console.log(applications)


            // Clear the form
            document.getElementById('name').value = '';
            document.getElementById('zipcode').value = '';
            document.getElementById('address').value = '';
            
            // Refresh the application list
            displayApplications();
            processOptions();
        })
        .catch(error => {
            console.error('Error adding application:', error);
        });
}

// Function to display applications in the list
function displayApplications() {
    const appList = document.getElementById('applicationList');
    appList.innerHTML = ''; // Clear existing application list

    applications.forEach(application => { 
        const appElement = document.createElement('div');
        appElement.innerHTML = `
            Application successfully submitted for: ${application.appName}
        `;
        appList.appendChild(appElement);
    });
}

// Funciton to check the status of an application
function checkStatus(){
    const appNumber = document.getElementById('appNumberCheck').value.trim();
    
    fetch(`/api/check_appStatus/${appNumber}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        const statusElement = document.getElementById('applicationStatus');
        if (data.status){
            statusElement.innerHTML = `Application Status of ${appNumber} (${data.appName}): ${data.status}`;
        } else {
            statusElement.innerHTML = 'Application Status: Not Found';
        }
    })
    .catch(error => {
        console.error('Error fetching application status:', error);
    })
}

// Function to change the status of the application
function changeAppStatus(){
    const appNumber = document.getElementById('appNumberChange').value.trim();
    const appStatus = document.getElementById('statusOptions').value;
    fetch(`api/change_appStatus/${appNumber}`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({appStatus: appStatus})
    })
        .then(response => response.json())
        .then(data => {
            const changeMessage = document.getElementById('changeMessage')
            if (data.message === 'Application not found') {
                // Handle case when the application is not found
                changeMessage.innerHTML = `Application with number ${appNumber} was not found`;
            } else {
                // If application is found, update its status
                changeMessage.innerHTML = `Application Status of ${data.appNumber} (${data.appName}) has been updated to ${data.appStatus}`;
            }
        })
        .catch(error => console.error('Error updating status:', error));
}
// Function to fetch and display all applications from the server
function showAllApplications() {
    fetch('/api/allApplications')
        .then(response => response.json())
        .then(data => {
            const appList = document.getElementById('displayApps');
            appList.innerHTML = ''; // Clear existing application list
            console.log(data);
            appList.textContent = JSON.stringify(data); // Display the list as a string
        })
        .catch(error => {
            console.error('Error fetching all applications:', error);
        });
}

//document.getElementById('appProcess').onchange = processOptions;
processOptions.call(document.getElementById('appProcess'));

function processOptions() {
    fetch('api/allApplications')
        .then(response => response.json())
        .then(data => {
            let str = "";
            data.forEach(application => {
                str += "<option>" + application.appNumber + " " + application.appName + "</option>"
            });
            
            document.getElementById('appProcess').innerHTML = str; 
        })
        .catch(error => console.error("Error fetching applications", error));
        
}