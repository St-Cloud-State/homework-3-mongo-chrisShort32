from flask import Flask, jsonify, render_template, request
import os
import pymongo
from datetime import datetime, timezone

app = Flask(__name__)
applications = [];

#  MongoDB Connection
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['application_database']
application_collection = db['applications']

@app.route('/api/allApplications', methods=['GET'])
def get_all_applications_v2():
    apps = list(application_collection.find())
    for app in apps:
        app['_id'] = str(app['_id'])
    return jsonify(apps)


# API to add an application to the database
@app.route('/api/add_appNumber', methods=['POST'])
def add_application():
    print("adding application")
    data = request.get_json()
    count = application_collection.count_documents({})
    appNumber = 1000 + count
    appStatus = data.get('appStatus')
    appName = data.get('appName')
    appAddress = data.get('appAddress')
    appZip = data.get('appZip')
    
    applications.append({
        'appNumber': appNumber,
        'appStatus': appStatus,
        'appName': appName,
        'appAddress': appAddress,
        'appZip': appZip
    })

    applicant = {
        'appNumber': appNumber,
        'appStatus': appStatus,
        'appName': appName,
        'appAddress': appAddress,
        'appZip': appZip
    }

    application_collection.insert_one(applicant)
    return jsonify({'message': 'Application added successfully'})

@app.route('/api/update_personal_details', methods=['POST'])
def update_personal():
    data = request.get_json()
    app_number = int(data.get('appNumber'))
    age = data.get('age')
    employment_status = data.get('employmentStatus')
    marital_status = data.get('maritalStatus')

    missing_fields = []
    if not age:
        missing_fields.append("age")
    if not employment_status:
        missing_fields.append("employment status")
    if not marital_status:
        missing_fields.append("marital status")

    status = "Incomplete" if missing_fields else "Complete"

    update_fields = {
        "appStatus": "Processing",
        "processing_phase_one": {
            "personal_details": {
                "age": age,
                "employment_status": employment_status,
                "marital_status": marital_status
                },

            "status": status,
            "status_update_time": datetime.now(timezone.utc).isoformat()
        }
    }

    application_collection.update_one(
        {"appNumber": app_number},
        {"$set": update_fields}
    )

    # add a note detailing why the phase is incomplete
    if status == "Incomplete":
        note = {
            "message": f"Phase 1 incomplete: Missing {', '.join(missing_fields)}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        application_collection.update_one(
            {"appNumber": app_number},
            {"$push": {"notes": note}}
        )

    return jsonify({"message": f"Personal details for #{app_number} updated succesfully"})


@app.route('/api/credit_check', methods=['POST'])
def credit_check():
    data = request.get_json()
    app_number = int(data.get('appNumber'))
    credit_score = data.get('creditScore')
    current_debt = int(data.get('currentDebt') or 0)
    annual_income = int(data.get('annualIncome') or 0)

    missing_fields = []
    if not credit_score:
        missing_fields.append("credit score")
    if not current_debt:
        missing_fields.append("current debt")
    if not annual_income:
        missing_fields.append("annual income")

    status = "Incomplete" if missing_fields else "Complete"

    if annual_income > 0:
        debt_to_income = round(current_debt/annual_income * 100, 2)
    else:
        debt_to_income = None
        
    update_fields = {
        "appStatus": "Processing",
        "processing_phase_two": {
            "credit_check": {
                "credit_score": credit_score,
                "current_debt": current_debt,
                "annual_income": annual_income,
                "debt_to_income_ratio": debt_to_income
                },

            "status": status,
            "status_update_time": datetime.now(timezone.utc).isoformat()
        }
    }

    application_collection.update_one(
        {"appNumber": app_number},
        {"$set": update_fields}
    )

    # add a note detailing why the phase is incomplete
    if status == "Incomplete":
        note = {
            "message": f"Phase 2 incomplete: Missing {', '.join(missing_fields)}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        application_collection.update_one(
            {"appNumber": app_number},
            {"$push": {"notes": note}}
        )

    return jsonify({"message": f"Credit details for #{app_number} updated succesfully"})

@app.route('/api/check_appStatus/<appNumber>', methods=['GET'])
def check_status(appNumber):
    appNumber = int(appNumber)
    application = application_collection.find_one({"appNumber": appNumber})
    if application:
        application["_id"] = str(application["_id"])
        return jsonify(application)
    else:
        return jsonify({'message': 'Application Not Found'})

@app.route('/api/change_appStatus', methods=['POST'])
def change_status():
    application = request.get_json()
    appNumber = application.get('appNumber')
    status = application.get('status')
    note = application.get('note')
    print(note)
    new_note = {"message": note, "timestamp": datetime.now(timezone.utc).isoformat()}
    application_collection.update_one({"appNumber": appNumber}, {"$set": {"appStatus": status}})
    application_collection.update_one({"appNumber": appNumber}, {"$push": {"notes": new_note}})   

    return jsonify({'message': 'Application status has been updated'})

@app.route('/api/change_phase_status', methods=['POST'])
def change_phase_status():
    application = request.get_json()
    appNumber = int(application.get('appNumber'))
    status = application.get('status')
    note = application.get('notes')
    print(appNumber, status)
    application_collection.update_one(
        {"appNumber": appNumber}, 
        {"$set": {
            "processing_phase_three": {
                "certification_check": {
                    "status": status,
                    "status_update_time": datetime.now(timezone.utc).isoformat()
                }
            }
        }})
    
    if note:
        if note.get('noteOne') and not note.get('noteTwo'):
            msg = note['noteOne']
        elif note.get('noteTwo') and not note.get('noteOne'):
            msg = note['noteTwo']
        else:
            msg = f"{note.get('noteOne', '')}, {note.get('noteTwo', '')}".strip(', ')

        new_note = {
            "message": f"Phase 3 Incomplete: {msg}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        application_collection.update_one(
            {"appNumber": appNumber}, 
            {"$push": {"notes": new_note}}
        )

    return jsonify({"message": "Phase 3 status has been updated"})

@app.route('/api/get_cert_check', methods=['GET'])
def get_doc():
    app_id = request.args.get('appId')
    app_id = int(app_id)
    application = application_collection.find_one({"appNumber": app_id})
    if application:
        application["_id"] = str(application["_id"])
        return jsonify(application)
    else:
        return jsonify({'message': 'Application Not Found'})
   
@app.route('/api/get_notes', methods=['GET'])
def get_notes():
    app_number = int(request.args.get('appNumber'))

    # Check if the application exists
    application = application_collection.find_one({"appNumber": app_number}, {"notes": 1, "_id": 0})
    if not application:
        return jsonify({"message": "Application Not Found"})

    notes = application.get("notes", [])
    if notes:
        return jsonify({"message": "Notes have been gathered", "notes": notes})
    else:
        return jsonify({"message": "No notes found for this application", "notes": []})


# Route to render the index.html page
@app.route('/')
def index():
    return render_template('index.html')
    
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")