const http = require('http');

http.get('http://localhost:5000/bookings', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
            const json = JSON.parse(data);
            if (Array.isArray(json)) {
                console.log('Total bookings:', json.length);
                const completed = json.filter(b => (b.status || '').toLowerCase() === 'completed');
                console.log('Completed bookings:', completed.length);
                json.slice(0, 5).forEach((b, i) => {
                    console.log('[' + i + '] status="' + b.status + '" vaccine=' + (b.vaccineId ? b.vaccineId.name : 'null') + ' userId=' + (b.userId ? b.userId._id : 'null'));
                });
            } else {
                console.log('Not an array. Response:', JSON.stringify(json).substring(0, 300));
            }
        } catch (e) {
            console.log('Parse error. Raw response:', data.substring(0, 300));
        }
    });
}).on('error', e => console.log('Connection error:', e.message));
