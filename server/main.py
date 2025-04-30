from fastapi import FastAPI, Request as FastAPIRequest
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.oauth2 import service_account
from google.auth.transport.requests import Request
import requests
from datetime import datetime, timezone


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Configurations
PROJECT_ID = "iot-plantation-protection"  # 🔁 Change this to your Firestore project ID
COLLECTION = "sensors"  # 🔁 Change this to the Firestore collection name
SERVICE_ACCOUNT_FILE = "/home/admin/IoT-backend/iot-plantation-protection-firebase-adminsdk-fbsvc-d9ce4fb24c.json"  # 🔁 Change this to your service account file location

# Get short-lived access token from service account
def get_access_token():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=["https://www.googleapis.com/auth/datastore"]
    )
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    return creds.token

# Flatten Firestore field formats
def flatten_firestore_doc(doc):
    fields = doc.get("fields", {})
    out = {}
    for key, value in fields.items():
        val_type, val_value = list(value.items())[0]
        if val_type == "integerValue":
            out[key] = int(val_value)
        elif val_type == "doubleValue":
            out[key] = float(val_value)
        elif val_type == "booleanValue":
            out[key] = bool(val_value)
        else:
            out[key] = val_value  # stringValue, etc.
    return out

def get_firestore_data():
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=["https://www.googleapis.com/auth/datastore"]
    )
    credentials.refresh(Request())
    headers = {
        "Authorization": f"Bearer {credentials.token}"
    }

    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/{COLLECTION}"
    response = requests.get(url, headers=headers)
    documents = response.json().get("documents", [])
    return documents

def get_firestore_documents():
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=["https://www.googleapis.com/auth/datastore"]
    )
    credentials.refresh(Request())

    headers = {
        "Authorization": f"Bearer {credentials.token}"
    }
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/{COLLECTION}"
    response = requests.get(url, headers=headers)
    return response.json().get("documents", [])

@app.get("/data")
def get_selected_metrics(metric: str):
    docs = get_firestore_documents()

    # Prepare the series for the requested metric
    series = {
        "BMP_Altitude": [],
        "BMP_Pressure": [],
        "BMP_Temperature": [],
        "MPU_AccelX": [],
        "MPU_AccelY": [],
        "MPU_AccelZ": [],
        "MPU_GyroX": [],
        "MPU_GyroY": [],
        "MPU_GyroZ": []
    }

    for doc in docs:
        try:
            fields = doc["fields"]
            date_str = doc["createTime"]

            # Convert date to Unix timestamp in milliseconds
            if "T" in date_str:  # ISO 8601 format
                ts = int(datetime.fromisoformat(date_str.replace("Z", "+00:00")).timestamp() * 1000)
            else:
                # Format: "May 1, 2025 at 1:11:53 AM UTC+5:30"
                naive_dt = datetime.strptime(date_str.split(" UTC")[0], "%B %d, %Y at %I:%M:%S %p")
                tz = pytz.timezone("Asia/Kolkata")  # UTC+5:30
                localized_dt = tz.localize(naive_dt)
                utc_dt = localized_dt.astimezone(pytz.utc)
                ts = int(utc_dt.timestamp() * 1000)

            # Extract BMP data
            bmp = fields.get("BMP", {}).get("mapValue", {}).get("fields", {})
            if metric == "BMP_Altitude":
                series["BMP_Altitude"].append([float(bmp.get("altitude", {}).get("doubleValue", 0)), ts])
            elif metric == "BMP_Pressure":
                series["BMP_Pressure"].append([float(bmp.get("pressure", {}).get("doubleValue", 0)), ts])
            elif metric == "BMP_Temperature":
                series["BMP_Temperature"].append([float(bmp.get("temperature", {}).get("doubleValue", 0)), ts])

            # Extract MPU data
            mpu = fields.get("MPU", {}).get("mapValue", {}).get("fields", {})
            if metric == "MPU_AccelX":
                series["MPU_AccelX"].append([float(mpu.get("accelX", {}).get("doubleValue", 0)), ts])
            elif metric == "MPU_AccelY":
                series["MPU_AccelY"].append([float(mpu.get("accelY", {}).get("doubleValue", 0)), ts])
            elif metric == "MPU_AccelZ":
                series["MPU_AccelZ"].append([float(mpu.get("accelZ", {}).get("doubleValue", 0)), ts])
            elif metric == "MPU_GyroX":
                series["MPU_GyroX"].append([float(mpu.get("gyroX", {}).get("doubleValue", 0)), ts])
            elif metric == "MPU_GyroY":
                series["MPU_GyroY"].append([float(mpu.get("gyroY", {}).get("doubleValue", 0)), ts])
            elif metric == "MPU_GyroZ":
                series["MPU_GyroZ"].append([float(mpu.get("gyroZ", {}).get("doubleValue", 0)), ts])

        except Exception as e:
            continue

    # Check if the metric exists in the series and return the data
    if metric not in series:
        return {"error": "Invalid metric"}

    # Return the series data as expected by Grafana
    return [{"target": metric, "datapoints": series[metric]}]

@app.post("/ingest")
async def ingest_sensor_data(request: FastAPIRequest):
    try:
        data = await request.json()
        print("Received from Arduino:", data)

        # Generate ISO timestamp (createTime)
        create_time = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=["https://www.googleapis.com/auth/datastore"]
        )
        credentials.refresh(Request())

        headers = {
            "Authorization": f"Bearer {credentials.token}",
            "Content-Type": "application/json"
        }

        def wrap_map_field(section):
            return {
                "mapValue": {
                    "fields": {
                        k: {"doubleValue": float(v)} for k, v in section.items()
                    }
                }
            }

        # Build Firestore payload with required structure
        firestore_payload = {
            "fields": {
                "BMP": wrap_map_field(data["BMP"]),
                "MPU": wrap_map_field(data["MPU"]),
                "GPS": wrap_map_field(data["GPS"]),
                "createTime": {"timestampValue": create_time}
            }
        }

        url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/{COLLECTION}"
        response = requests.post(url, headers=headers, json=firestore_payload)

        if response.status_code in [200, 202]:
            return {"status": "success"}
        else:
            print("Firestore Error:", response.text)
            return JSONResponse(status_code=500, content={
                "status": "error",
                "details": response.text
            })

    except Exception as e:
        return JSONResponse(status_code=400, content={"status": "fail", "error": str(e)})
