import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://192.168.1.121:4000');

function App() {
    const [requests, setRequests] = useState([]);
    const [requestCount, setRequestCount] = useState(0);

    useEffect(() => {
        // Initiale Daten vom Server empfangen
        socket.on('initialData', (data) => {
            setRequests(data.slice(-100)); // Nur die letzten 100 Einträge speichern
        });

        // Neue Anfragen empfangen
        socket.on('newRequest', (request) => {
            setRequests((prevRequests) => {
                const updatedRequests = [...prevRequests, request];
                return updatedRequests.slice(-100); // Nur die letzten 100 Einträge behalten
            });
        });

        // Gesamtanzahl der Anfragen empfangen
        socket.on('requestCount', (count) => {
            setRequestCount(count);
        });

        // Cleanup der Socket-Events
        return () => {
            socket.off('initialData');
            socket.off('newRequest');
            socket.off('requestCount');
        };
    }, []);

    return (
        <div>
            <h1>Request Tracker</h1>
            <p>Total Requests: {requestCount}</p>
            <ul>
                {requests.map((req, index) => (
                    <li key={index}>
                        {req.time} - {req.method} {req.path} (IP: {req.ip})
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;