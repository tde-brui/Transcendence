import { useEffect, useRef } from "react";

const onlineStatus = () => {
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const wsUrl = "ws://localhost:8000/ws/online_status/";
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
            console.log("WebSocket connection established");
        };

        socketRef.current.onmessage = (event) => {
            console.log("Message received:", event.data);
        };

        socketRef.current.onclose = (event) => {
            console.log("WebSocket connection closed:", event.reason || "No reason provided");
        };

        socketRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    return socketRef.current;
};

export default onlineStatus;
