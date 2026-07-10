import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI(title="Multi-Feed Smart Traffic Management Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolo11n.pt")

VEHICLE_CLASSES = {2, 3, 5, 7}
TIME_INTERVALS = [60, 40, 20, 10]

# Mapping feed IDs to their respective video file paths
# VIDEO_FEEDS = {
#     "1": "TrafficVideo.mp4",
#     "2": "TrafficVideo2.mp4"
# }

VIDEO_FEEDS = {
    "1": "https://res.cloudinary.com/bxnkuruz/video/upload/v1783675631/TrafficVideo_l3z2cx.mp4",
    "2": "https://res.cloudinary.com/bxnkuruz/video/upload/v1783675640/TrafficVideo2_chz2c6.mp4"
}

def analyze_traffic_frame(frame):
    h, w, _ = frame.shape
    virtual_lines = [h // 4, h // 2, (3 * h) // 4, h]
    
    results = model(frame, verbose=False)
    boxes = results[0].boxes
    
    highest_zone_idx = 4  
    vehicle_count = 0

    for box in boxes:
        cls = int(box.cls[0])
        if cls not in VEHICLE_CLASSES:
            continue
            
        vehicle_count += 1
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        center_y = (y1 + y2) // 2
        
        cv2.rectangle(frame, (x1, y1), (x2, y2), (71, 99, 255), 2)
        
        for i, line_y in enumerate(virtual_lines):
            if center_y <= line_y:
                if i < highest_zone_idx:
                    highest_zone_idx = i
                break

    signal_time = 10 if highest_zone_idx == 4 else TIME_INTERVALS[highest_zone_idx]
        
    for i, y in enumerate(virtual_lines):
        is_active = (highest_zone_idx != 4 and i == highest_zone_idx)
        color = (0, 255, 0) if is_active else (0, 0, 255)
        cv2.line(frame, (0, y), (w, y), color, 2)

    # Simplified HUD since the web interface will display the core countdown telemetry
    cv2.rectangle(frame, (15, 15), (240, 65), (0, 0, 0), -1)
    cv2.putText(frame, f"Vehicles: {vehicle_count}", (25, 45), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
    return frame, signal_time

def frame_streaming_generator(video_source: str):
    cap = cv2.VideoCapture(video_source)
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
            
        processed, _ = analyze_traffic_frame(frame)
        ret, buffer = cv2.imencode('.jpg', processed)
        if not ret:
            continue
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
               
    cap.release()

@app.get("/api/stream/{feed_id}")
async def get_traffic_stream(feed_id: str):
    if feed_id not in VIDEO_FEEDS:
        raise HTTPException(status_code=404, detail="Traffic feed channel not found")
    return StreamingResponse(frame_streaming_generator(VIDEO_FEEDS[feed_id]), 
                             media_type="multipart/x-mixed-replace; boundary=frame")

# Endpoint for the frontend to fetch the raw telemetry data contextually
@app.get("/api/telemetry/{feed_id}")
async def get_telemetry(feed_id: str):
    if feed_id not in VIDEO_FEEDS:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    cap = cv2.VideoCapture(VIDEO_FEEDS[feed_id])
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        return {"signal_time": 10}
        
    _, signal_time = analyze_traffic_frame(frame)
    return {"signal_time": signal_time}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)