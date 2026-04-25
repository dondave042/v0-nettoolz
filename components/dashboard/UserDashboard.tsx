import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils'; // Utility function to format the currency

const UserDashboard: React.FC = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOrders, setFilteredOrders] = useState([]);
    
    useEffect(() => {
        // Fetch orders and other data from API or state management
        const fetchData = async () => {
            // Placeholder fetch, replace with real data source
            const response = await fetch('/api/orders');
            const data = await response.json();
            setOrders(data);
        };
        fetchData();
    }, []);
    
    useEffect(() => {
        // Filter orders based on the search term
        setFilteredOrders(
            orders.filter(order => 
                order.id.includes(searchTerm) ||
                order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm, orders]);
    
    return (
        <div className="p-4">
            <header className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">User Dashboard</h1>
                <div className="flex flex-col items-end">
                    <div>Total Orders: {orders.length}</div>
                    <div>Total Spent: {formatCurrency(orders.reduce((acc, order) => acc + order.amount, 0))}</div>
                </div>
            </header>
            <input
                type="text"
                placeholder="Search orders..."
                className="border p-2 mb-4 w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <table className="min-w-full border">
                <thead>
                    <tr>
                        <th className="border-b p-2">Order ID</th>
                        <th className="border-b p-2">Customer Name</th>
                        <th className="border-b p-2">Amount</th>
                        <th className="border-b p-2">Payment Method</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map(order => (
                        <tr key={order.id} className="border-b">
                            <td className="p-2">{order.id}</td>
                            <td className="p-2">{order.customerName}</td>
                            <td className="p-2">{formatCurrency(order.amount)}</td>
                            <td className="p-2">{order.paymentMethod}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-4">
                <h2 className="text-lg font-semibold">Recent Deposits</h2>
                <table className="min-w-full border">
                    <thead>
                        <tr>
                            <th className="border-b p-2">Date</th>
                            <th className="border-b p-2">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Placeholder for recent deposits data */}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserDashboard;
