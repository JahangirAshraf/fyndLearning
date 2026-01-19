import React, { useState, useEffect } from 'react';

/**
 * CHILD COMPONENT
 * Simulates a component that needs an ID from the parent to fetch its own data.
 */
const ChildComponent = ({ authId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    console.log(`[Child] RENDER - Current authId: ${authId}`);

    useEffect(() => {
        // This effect runs whenever authId changes
        // if (!authId) {
        //     console.log("%c[Child] useEffect: No authId yet. Skipping API call.", "color: gray");
        //     return;
        // }

        console.log(`%c[Child] useEffect: STARTING API CALL with authId: ${authId}...`, "color: #007bff; font-weight: bold");
        setLoading(true);

        // Simulate API call
        const timerId = setTimeout(() => {
            console.log(`%c[Child] API SUCCESS: Received data for ${authId}`, "color: #007bff");
            setData(`Specific data for User ${authId}`);
            setLoading(false);
        }, 2000);

        return () => clearTimeout(timerId);
    }, [authId]); // DEPENDENCY: This is the key!

    return (
        <div style={{ border: '2px solid #007bff', padding: '15px', marginTop: '10px', borderRadius: '8px' }}>
            <h3>Child Component (API Sim)</h3>
            <p>Auth ID from Parent: <strong>{authId || 'WAITING...'}</strong></p>
            {loading && <p style={{ color: 'blue' }}>Loading API data...</p>}
            {data && <p style={{ color: 'green' }}>Result: {data}</p>}
        </div>
    );
};

/**
 * PARENT COMPONENT
 * Simulates a component that must "log in" or "initialize" first.
 */
const ParentComponent = () => {
    const [userId, setUserId] = useState(null);

    console.log(`[Parent] RENDER - Current userId: ${userId}`);

    useEffect(() => {
        console.log("%c[Parent] useEffect: Initializing User Sessions...", "color: #28a745; font-weight: bold");

        // Simulate an async initialization (like fetching a token)
        const timerId = setTimeout(() => {
            console.log("%c[Parent] SESSION READY: Setting User ID to 'USR_99'", "color: #28a745");
            setUserId('USR_99');
        }, 4000);

        return () => clearTimeout(timerId);
    }, []);

    return (
        <div style={{ border: '3px dashed #28a745', padding: '30px', maxWidth: '600px', margin: 'auto', borderRadius: '12px' }}>
            <h2>Parent (Initialization Logic)</h2>
            <p>User Status: <strong>{userId ? 'Logged In' : 'Initializing...'}</strong></p>
            <hr />
            {/* The Child is born with no ID, then updated later */}
            <ChildComponent authId={userId} />
        </div>
    );
};

export default ParentComponent;
