import React, { useState } from 'react';

const CheckoutForm = () => {
    const [step, setStep] = useState(1);
    const [shippingDetails, setShippingDetails] = useState({
        name: '',
        address: '',
        city: '',
        zip: ''
    });
    const [paymentDetails, setPaymentDetails] = useState({
        cardNumber: '',
        expiration: '',
        cvv: ''
    });

    const handleShippingChange = (e) => {
        setShippingDetails({ ...shippingDetails, [e.target.name]: e.target.value });
    };

    const handlePaymentChange = (e) => {
        setPaymentDetails({ ...paymentDetails, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        setStep(step + 1);
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    return (
        <div>
            {step === 1 && (
                <div>
                    <h2>Shipping Details</h2>
                    <input type="text" name="name" placeholder="Name" value={shippingDetails.name} onChange={handleShippingChange} />
                    <input type="text" name="address" placeholder="Address" value={shippingDetails.address} onChange={handleShippingChange} />
                    <input type="text" name="city" placeholder="City" value={shippingDetails.city} onChange={handleShippingChange} />
                    <input type="text" name="zip" placeholder="Zip Code" value={shippingDetails.zip} onChange={handleShippingChange} />
                    <button onClick={nextStep}>Next</button>
                </div>
            )}
            {step === 2 && (
                <div>
                    <h2>Payment Details</h2>
                    <input type="text" name="cardNumber" placeholder="Card Number" value={paymentDetails.cardNumber} onChange={handlePaymentChange} />
                    <input type="text" name="expiration" placeholder="MM/YY" value={paymentDetails.expiration} onChange={handlePaymentChange} />
                    <input type="text" name="cvv" placeholder="CVV" value={paymentDetails.cvv} onChange={handlePaymentChange} />
                    <button onClick={prevStep}>Previous</button>
                    <button type="submit">Submit</button>
                </div>
            )}
        </div>
    );
};

export default CheckoutForm;