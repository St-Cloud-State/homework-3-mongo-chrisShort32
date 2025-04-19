from flask import Flask, jsonify, render_template, request
import os
import pymongo

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

@app.route('/api/check_appStatus/<appNumber>', methods=['GET'])
def check_status(appNumber):
    appNumber = int(appNumber)
    for app in applications:
        if app['appNumber'] == appNumber:
            return jsonify({'status': app['appStatus'],
                            'appName': app['appName']})
    
    return jsonify({'message': 'Application Not Found'})

@app.route('/api/change_appStatus/<appNumber>', methods=['POST'])
def change_status(appNumber):
    data = request.get_json()
    new_status = data.get('appStatus')

    for app in applications:
        if int(app['appNumber']) == int(appNumber):
            app['appStatus'] = new_status;
            return jsonify({'appNumber': app['appNumber'],
                            'appName': app['appName'],
                            'appStatus': app['appStatus']})
    
    return jsonify({'message': 'Application not found'})
 
# Route to render the index.html page
@app.route('/')
def index():
    return render_template('index.html')
    
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")