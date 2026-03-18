import React from 'react';
import './UserDashboard.css';

const UserDashboard = () => {
    return (
        <div className="user-dashboard">
            <header className="dashboard-header">
                <h1>Total Orders: 100</h1>
                <input type="text" placeholder="Search..." className="search-input" />
            </header>
            <section className="orders-table">
                <h2>Orders</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>#1234</td>
                            <td>2026-03-15</td>
                            <td>Completed</td>
                            <td>$100</td>
                        </tr>
                        <!-- More rows as needed -->
                    </tbody>
                </table>
            </section>
            <section className="payment-methods">
                <h2>Payment Methods</h2>
                <ul>
                    <li>Credit Card</li>
                    <li>PayPal</li>
                    <!-- Add more payment methods as needed -->
                </ul>
            </section>
            <section className="recent-deposits">
                <h2>Recent Deposits</h2>
                <ul>
                    <li>$200 on 2026-03-17</li>
                    <li>$150 on 2026-03-16</li>
                    <!-- More deposits as needed -->
                </ul>
            </section>
        </div>
    );
};

export default UserDashboard;