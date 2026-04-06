from typing import List, Dict
from fastapi import WebSocket


class NotificationManager:
    """WebSocket connection manager for real-time notifications"""

    def __init__(self):
        # Map of office_id -> list of WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Global connections (for admin/all notifications)
        self.global_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, office_id: str = None):
        await websocket.accept()
        if office_id:
            if office_id not in self.active_connections:
                self.active_connections[office_id] = []
            self.active_connections[office_id].append(websocket)
        else:
            self.global_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, office_id: str = None):
        if office_id and office_id in self.active_connections:
            if websocket in self.active_connections[office_id]:
                self.active_connections[office_id].remove(websocket)
        if websocket in self.global_connections:
            self.global_connections.remove(websocket)

    async def send_to_office(self, office_id: str, message: dict):
        """Send notification to all connections for a specific office"""
        if office_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[office_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            for conn in disconnected:
                self.active_connections[office_id].remove(conn)

    async def broadcast(self, message: dict):
        """Send notification to all global connections"""
        disconnected = []
        for connection in self.global_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.global_connections.remove(conn)

    async def notify_document_event(self, event_type: str, document: dict, office_ids: list = None):
        """Send a document-related notification"""
        message = {
            "type": event_type,
            "data": document,
            "timestamp": str(__import__('datetime').datetime.utcnow())
        }
        # Send to specific offices
        if office_ids:
            for oid in office_ids:
                await self.send_to_office(oid, message)
        # Always broadcast to global (admin) connections
        await self.broadcast(message)


notification_manager = NotificationManager()
