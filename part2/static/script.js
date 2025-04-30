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
    document.getElementById('acceptOrReject').innerHTML = '';
    fetch(`/api/check_appStatus/${appNumber}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        const statusElement = document.getElementById('applicationStatus');
        const acceptOrReject = document.getElementById('acceptOrReject');
        if (data.appStatus){
            statusElement.innerHTML = `
            <strong>Application #${appNumber} -- ${data.appName}</strong><br>
            Status: ${data.appStatus}<br>
            Phase 1: ${data.processing_phase_one?.status || 'Not Started'}<br>
            Phase 2: ${data.processing_phase_two?.status || 'Not Started'}<br>
            Phase 3: ${data.processing_phase_three?.certification_check.status || 'Not Started'}<br>
        
            `;
        } else {
            statusElement.innerHTML = data.message;
        }

        if (data.appStatus === 'Accepted') {
            const loanTerms = determineLoanTerms(data);
            acceptOrReject.innerHTML = `
            <br><strong>Congratulations ${data.appName}! You have been pre-approved for a loan!<br>
            Please contact our office to finalize your loan.<br><br>
            Approved Loan Amount: ${loanTerms.amount}
            <br>Interest Rate: ${loanTerms.interestRate}</strong><br><br>
            `;
        }
        if (data.appStatus === 'Rejected') {
            let rejectReason = '';
            data.notes.forEach(note => {
                if (note.message?.includes('Rejected'))
                    rejectReason = note.message;
            })

            acceptOrReject.innerHTML= `
            <br><strong>Sorry to inform you that your loan has been Rejected for the following reason(s): 
            <br>${rejectReason}</strong>
            `;
        }
    })
    .catch(error => {
        console.error('Error fetching application status:', error);
    })
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

document.getElementById('appProcess').onchange = () => {
    document.getElementById('confirm').innerHTML = '';
    document.getElementById('certCheck').innerHTML = '';
    document.getElementById('acceptOrReject').innerHTML='';
    document.getElementById('applicationStatus').innerHTML='';
};

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
    let status = "Accepted";
    let result = "";

    if (applicantData.processing_phase_two.credit_check.debt_to_income_ratio > 38) {
        status = "Rejected";
        result = `Rejected: Debt to income ratio is to high. {${applicantData.processing_phase_two.credit_check.debt_to_income_ratio}%}`;
    } else if (applicantData.processing_phase_two.credit_check.credit_score === 'poor') {
        status = "Rejected";
        result = "Rejected: Credit score too low. {Poor (300 - 579)}";
    }

    if (status === 'Accepted') {
        const loanTerms = determineLoanTerms(applicantData);
        result = `Loan Terms: Amount: ${loanTerms.amount}, Interest Rate: ${loanTerms.interestRate}`;
    }
    const eval = {
        'appNumber': applicantData.appNumber,
        'status': status,
        'note': result,
    };

    fetch('/api/change_appStatus', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(eval)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        });
        
    return status;
    
}

function determineLoanTerms(applicantData) {
    // loan amounts = what ever makes the debt to income ratio 40%
    // .4(income) - debt = loan factor
    const loanAmount = 0.4 * (applicantData.processing_phase_two.credit_check.annual_income) - (applicantData.processing_phase_two.credit_check.current_debt);

    // Base interest is 5%
    let baseInterest = 0.05;

    if (applicantData.processing_phase_one.personal_details.marital_status === 'married') {
        baseInterest -= 0.005;
    } else {
        baseInterest += 0.005;
    }
    if (applicantData.processing_phase_one.personal_details.employment_status === 'fullTime') {
        baseInterest -= 0.005;
    } else {
        baseInterest += 0.005;
    }
    if (applicantData.processing_phase_one.personal_details.age > 30) {
        baseInterest -= 0.005;
    } else {
        baseInterest += 0.005;
    }
    const creditScore = applicantData.processing_phase_two.credit_check.credit_score;
    console.log(creditScore);
    if (creditScore == 'exceptional') {
        baseInterest -= 0.01;
    } else if (creditScore == 'veryGood') {
        baseInterest -= 0.005;
    } else if (creditScore == 'good') {
        baseInterest += 0.005;
    } else {
        baseInterest += 0.01;
    }

    
    const loanTerms = {
        amount: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(loanAmount),
    
        interestRate: new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(baseInterest)
    };


    //add note with loan terms
    (fetch)
    
    return loanTerms;
    
}

function createOkButton() {
    const confirm = document.getElementById('confirm');
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = "OK";
    confirmButton.style.margin = '10px';
    confirmButton.style.border = '1px solid #333';  
    confirmButton.style.backgroundColor = '#f0f0f0'; 
    confirmButton.style.color = '#000';            
    confirmButton.style.borderRadius = '5px';        
    confirm.appendChild(confirmButton);
    return confirmButton
}

function createCancelButton() {
    const confirm = document.getElementById('confirm');
    const cancelButton = document.createElement('button');
    cancelButton.textContent = "Cancel";
    cancelButton.style.margin = '10px';
    cancelButton.style.border = '1px solid #333';  
    cancelButton.style.backgroundColor = '#f0f0f0'; 
    cancelButton.style.color = '#000';            
    cancelButton.style.borderRadius = '5px'; 
    confirm.appendChild(cancelButton);
    return cancelButton
}

function phaseThree(certStatus) {
    const appNumber = certStatus.appId;
    const status = certStatus.status;
    const notes = certStatus.notes;
    const payload = {
        'appNumber': appNumber,
        'status': status,
        'notes': notes
    };
    console.log(payload);
    fetch('/api/change_phase_status', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
    .catch(error => {
        console.error("Error updating phase status:", error);
    });

}

function certCheck() {
    
    document.getElementById('confirm').innerHTML = '';
    document.getElementById('certCheck').innerHTML = '';
    appId = document.getElementById('appProcess').value.split(" ")[0];
    let certified = false;
    fetch(`/api/check_appStatus/${appId}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        const statusElement = document.getElementById('certCheck');
        if (data.appStatus){
            let message_one = "";
            let message_two = "";
            let message_three = "";
            if (data.processing_phase_one?.status === 'Complete' && data.processing_phase_two?.status === 'Complete') {
                certified = true;
            }
            if (certified) {
                message_one = `<br><br><strong>Personal Details:</strong><br>
                    Age: ${data.processing_phase_one.personal_details.age}<br>
                    Marital Status: ${data.processing_phase_one.personal_details.marital_status}<br>
                    EmploymentStatus: ${data.processing_phase_one.personal_details.employment_status}<br>`;

                message_two = `<br><br><strong>Credit Check:</strong><br>
                    Credit Score: ${data.processing_phase_two.credit_check.credit_score}<br>
                    Current Debt: ${data.processing_phase_two.credit_check.current_debt}<br>
                    Annual Income: ${data.processing_phase_two.credit_check.annual_income}<br>
                    Debt to Income Ratio: ${data.processing_phase_two.credit_check.debt_to_income_ratio}%<br>
                    `;

                message_three = "<br><br>If the above information is correct, click the OK button.<br>If the above information is not correct, click cancel, then re-enter the correct information in the relevant phase.";
                
                const confirmButton = createOkButton();
                const cancelButton = createCancelButton();
                
                confirmButton.onclick = () => {
                    alert("shits been confirmed");
                    
                    const result = evaluateApplication(data);
                    document.getElementById('confirm').innerHTML = `
                        <br>The application has been certified!
                        <br>Please check status for more information.<br><br>`;
                    document.getElementById('certCheck').innerHTML = '';
                     
                }
  
                cancelButton.onclick = () => {
                    alert("shits been canceled");
                    document.getElementById('confirm').innerHTML = '';
                    document.getElementById('certCheck').innerHTML = '';
                    certified = false;
                }



            } else if (data.notes) {
                
                let incompleteMessageOne = "<br>Notes:<br>";
                let incompleteMessageTwo = "<br>Notes:<br>";
                message_three = "<br>Notes:<br>";
                
                const seenMessages = new Set();
                const uniqueNotes = [];
                
                data.notes?.forEach(note => {
                    if (!seenMessages.has(note.message)) {
                        seenMessages.add(note.message);
                        uniqueNotes.push(note);
                    }
                });
                
                
                uniqueNotes.forEach(note => {
                    const phase = note.message.split(" ")[1];
                    const formatted = `{${note.message}}, `;
                
                    if (phase === "1") {
                        incompleteMessageOne += formatted;
                    } else if (phase === "2") {
                        incompleteMessageTwo += formatted;
                    } else if (phase === "3") {
                        message_three += formatted;
                    }
                });

                if (data.processing_phase_one?.status === 'Incomplete') {
                    message_one = incompleteMessageOne;
                } else if (data.processing_phase_one?.status === 'Complete') {
                    message_one = `
                        <br><br><strong>Personal Details:</strong><br>
                        Age: ${data.processing_phase_one?.personal_details.age}<br>
                        Marital Status: ${data.processing_phase_one?.personal_details.marital_status}<br>
                        EmploymentStatus: ${data.processing_phase_one?.personal_details.employment_status}<br>
                    `;
                } else {
                    message_three = "<br><br>Certification could not be completed.<br>Please complete Phase 1 then try again.";
                }
                if (data.processing_phase_two?.status === 'Incomplete') {
                    message_two = incompleteMessageTwo;
                } else if (data.processing_phase_two?.status === 'Complete') {
                    message_two = `
                        <br><br><strong>Credit Check:</strong><br>
                        Credit Score: ${data.processing_phase_two?.credit_check.credit_score}<br>
                        Current Debt: ${data.processing_phase_two?.credit_check.current_debt}<br>
                        Annual Income: ${data.processing_phase_two?.credit_check.annual_income}<br>
                        Debt to Income Ratio: ${data.processing_phase_two?.credit_check.debt_to_income_ratio}%<br>
                    `;
                } else {
                    message_three = "<br><br>Certification could not be completed.<br>Please complete Phase 2 then try again.";
                }


                // Update phase 3 status to incomplete
                
            } else {
                message_three = "<br><br>Certification could not be completed.<br>Please complete Phase 1 and Phase 2 then try again.";
            }

            // Do the update here and only call one time (big brain)
            let status = "";
            let noteOne = "";
            let noteTwo = "";
            if (certified) {
                status = "Complete";
                
            } else {
                status = "Incomplete";
                if (data.processing_phase_one?.status === 'Incomplete') {
                    noteOne = "Phase 1 incomplete";
                }
                if (data.processing_phase_two?.status === 'Incomplete') {
                    noteTwo = "Phase 2 incomplete";
                }
            }
            
            let notes = {};
            if (noteOne) notes.noteOne = noteOne;
            if (noteTwo) notes.noteTwo = noteTwo;
            console.log("app id:", appId);
            const certStatus = {
                appId,
                status,
                notes
            };

            phaseThree(certStatus);

            statusElement.innerHTML = `
                <strong>Application #${appId} -- ${data.appName}</strong><br><br>
                Status: ${data.appStatus}<br><br>

                Phase 1: ${data.processing_phase_one?.status || 'Not Started'} ${message_one}<br><br>
                

                Phase 2: ${data.processing_phase_two?.status || 'Not Started'} ${message_two}<br><br>
                

                Phase 3: ${data.processing_phase_three?.certification_check?.status || 'Not Started'} ${message_three}<br><br>
`;

        } else {
            statusElement.innerHTML = data.message;
        }    
    })
    .catch(error => {
        console.error('Error fetching application status:', error);
    })
}