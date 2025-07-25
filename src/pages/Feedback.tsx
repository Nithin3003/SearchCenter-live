import React from 'react';
import Navbar from '../components/Navbar';
import FeedbackForm from '../components/Feedback';
import Footer from '../components/Footer';

export default function Feedback() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
                <FeedbackForm />
            </div>
            <Footer/> 

        </div>
    );
}
