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

function phaseOne() {
    const formData = new FormData(document.getElementById('phase1Form'));
    const appNumberName = document.getElementById('appProcess').value;
    let parts = appNumberName.split(" ");
    const appNumber = parts[0];
    const personalDetails = {
        appNumber: appNumber,
        age: formData.get('age'),
        employmentStatus: formData.get('employmentStatus'),
        maritalStatus: formData.get('maritalStatus')
    };


    // Send to backend
    fetch('api/update_personal_details', {
        method:'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(personalDetails)
    })

    .then(response => {
        if(!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message);
            })
        }

        return response.json();
    })

    .then(data => {
        console.log(data.message)
        
        const phaseOneResponse = document.getElementById('phase1Response');
        phaseOneResponse.innerHTML = ''; // Clear existing application list
        const appElement = document.createElement('div');
        appElement.innerHTML = `
            ${data.message}
        `;

        phaseOneResponse.appendChild(appElement);
        document.getElementById('phase1Form').reset();
    })
    certCheck();
}


function phaseTwo() {
    const formData = new FormData(document.getElementById('phase2Form'));
    const appNumberName = document.getElementById('appProcess').value;
    let parts = appNumberName.split(" ");
    const appNumber = parts[0];

    const creditCheck = {
        appNumber: appNumber,
        creditScore: formData.get('creditScore'),
        currentDebt: formData.get('currentDebt'),
        annualIncome: formData.get('income')
    };
    console.log(creditCheck);

     // Send to backend
     fetch('api/credit_check', {
        method:'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(creditCheck)
    })

    .then(response => {
        if(!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message);
            })
        }

        return response.json();
    })

    .then(data => {
        console.log(data.message)
        
        const phaseTwoResponse = document.getElementById('phase2Response');
        phaseTwoResponse.innerHTML = ''; // Clear existing application list
        const appElement = document.createElement('div');
        appElement.innerHTML = `
            ${data.message}
        `;

        phaseTwoResponse.appendChild(appElement);
        document.getElementById('phase2Form').reset();
    })
 
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
        if (data.appStatus){
            statusElement.innerHTML = `
            <strong>Application #${appNumber} -- ${data.appName}</strong><br>
            Status: ${data.appStatus}<br>
            Phase 1: ${data.processing_phase_one?.status || 'Not Started'}<br>
            Phase 2: ${data.processing_phase_two?.status || 'Not Started'}<br>
        
            `;
        } else {
            statusElement.innerHTML = data.message;
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
            data.forEach(app => {
                const pre = document.createElement('pre');
                pre.textContent = JSON.stringify(app, null, 2);
                appList.appendChild(pre);
            })
            //appList.textContent = JSON.stringify(data, null, 2); // Display the list as a string
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

function evaluateApplication(applicantData) {
    let result = "Approved";
    let reasonForRejection = "N/A";

    if (applicantData.processing_phase_two.credit_check.debt_to_income_ratio > 38) {
        result = "Rejected";
        reasonForRejection = `Debt to income ratio is to high. {${applicantData.processing_phase_two.credit_check.debt_to_income_ratio}}`;
    } else if (applicantData.processing_phase_one.personal_details.credit_score === 'poor') {
        result= "Rejected";
        reasonForRejection = "Credit score too low. {Poor (300 - 579)}";
    }

    const eval = {
        result,
        'reason': reasonForRejection,
    };

    return (eval)
    
}

function createButtons(applicantData) {
    const confirm = document.getElementById('confirm');
    confirmButton = document.createElement('button');
    confirmButton.textContent = "OK";
    confirmButton.style.margin = '10px';
    confirmButton.style.border = '1px solid #333';  
    confirmButton.style.backgroundColor = '#f0f0f0'; 
    confirmButton.style.color = '#000';            
    confirmButton.style.borderRadius = '5px';        
    confirm.appendChild(confirmButton);
    confirmButton.onclick = () => {
        alert("shits been confirmed");
        document.getElementById('confirm').innerHTML = `
            <br>The application has been certified!
            <br>Please check status for more information.<br><br>`;
        document.getElementById('certCheck').innerHTML = '';
        console.log(evaluateApplication(applicantData));
    }

    cancelButton = document.createElement('button');
    cancelButton.textContent = "Cancel";
    cancelButton.style.margin = '10px';
    cancelButton.style.border = '1px solid #333';  
    cancelButton.style.backgroundColor = '#f0f0f0'; 
    cancelButton.style.color = '#000';            
    cancelButton.style.borderRadius = '5px'; 
    confirm.appendChild(cancelButton);
    cancelButton.onclick = () => {
        alert("shits been canceled");
        document.getElementById('confirm').innerHTML = '';
        document.getElementById('certCheck').innerHTML = '';

    }

}
function certCheck() {
    appId = document.getElementById('appProcess').value.split(" ")[0];

    fetch(`/api/check_appStatus/${appId}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        const statusElement = document.getElementById('certCheck');
        if (data.appStatus){
            let str = "";
            let certified = false;
            let notes_one = "";
            let notes_two = "";
            let message = "";
            if (data.processing_phase_one?.status === 'Complete' && data.processing_phase_two?.status === 'Complete') {
                certified = true;
            }
            if (certified) {
                notes_one = `<br><br><strong>Personal Details:</strong><br>
                    Age: ${data.processing_phase_one.personal_details.age}<br>
                    Marital Status: ${data.processing_phase_one.personal_details.marital_status}<br>
                    EmploymentStatus: ${data.processing_phase_one.personal_details.employment_status}<br>`;

                notes_two = `<br><br><strong>Credit Check:</strong><br>
                    Credit Score: ${data.processing_phase_two.credit_check.credit_score}<br>
                    Current Debt: ${data.processing_phase_two.credit_check.current_debt}<br>
                    Annual Income: ${data.processing_phase_two.credit_check.annual_income}<br>
                    Debt to Income Ratio: ${data.processing_phase_two.credit_check.debt_to_income_ratio}%<br>
                    `;

                message = "If the above information is correct, click the OK button.<br>If the above information is not correct, click cancel, then re-enter the correct information in the relative phase.";
                str = `Phase 3: Certified<br><br>${message}`;

               let result = createButtons(data);

            } else if (data.notes) {
                notes_one = "<br>Notes: ";
                notes_two = "<br>Notes: ";
                data.notes?.forEach(note => {
                    if (note.message.split(" ")[1] === "1") {
                        notes_one += "{" + note.message + "}, ";
                    } else {
                        notes_two+= "{" + note.message + "}, ";
                    }
                });
                message = "Certification could not be completed.<br>Please check the notes, and update the relevant phase fields."
                str = `Phase 3: Incomplete<br><br>${message}`;
            } else {
                message = "Certification could not be completed.<br>Please complete Phase 1 and Phase 2 then try again.";
                str = `Phase 3: Not Started<br><br>${message}`;
            }

            statusElement.innerHTML = `
            <strong>Application #${appId} -- ${data.appName}</strong><br><br>
            Status: ${data.appStatus}<br><br>
            Phase 1: ${data.processing_phase_one?.status || 'Not Started'} ${notes_one}<br><br>
            Phase 2: ${data.processing_phase_two?.status || 'Not Started'} ${notes_two}<br><br>
            ${str}<br><br>
        
            `;
        } else {
            statusElement.innerHTML = data.message;
        }
    })
    .catch(error => {
        console.error('Error fetching application status:', error);
    })
}