

const logEvent = async (logData) => {
    try {
        await fetch('http://localhost:3000/api/v1/log/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData)
        });
    } catch (error) {
        console.error("Failed to log event:", error);
    }
};

export default logEvent;