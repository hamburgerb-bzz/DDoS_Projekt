import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

function App() {
    const [requests, setRequests] = useState([]);
    const [requestCount, setRequestCount] = useState(0);

    useEffect(() => {
        socket.on('initialData', (initialRequests) => {
            setRequests(initialRequests);
        });

        socket.on('newRequest', (newRequest) => {
            setRequests(prev => [newRequest, ...prev]);
        });

        socket.on('requestCount', (count) => {
            setRequestCount(count);
        });

        return () => {
            socket.off('initialData');
            socket.off('newRequest');
            socket.off('requestCount');
        };
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>Live Request Tracker</h1>
            <h2>Total Requests: {requestCount}</h2>
            <div style={{
                backgroundColor: '#f0f0f0',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '20px'
            }}>
                <h2>Latest Requests:</h2>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#ddd' }}>
                            <th style={{ padding: '8px', border: '1px solid #999' }}>Time</th>
                            <th style={{ padding: '8px', border: '1px solid #999' }}>Method</th>
                            <th style={{ padding: '8px', border: '1px solid #999' }}>Path</th>
                            <th style={{ padding: '8px', border: '1px solid #999' }}>IP</th>
                        </tr>
                        </thead>
                        <tbody>
                        {requests.map((request, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                    {new Date(request.time).toLocaleString()}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                    {request.method}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                    {request.path}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                    {request.ip.replace('::ffff:', '')}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default App;