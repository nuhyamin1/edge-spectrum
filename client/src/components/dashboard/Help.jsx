import React, { useState } from 'react';
import { QuestionMarkCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Help = () => {
  const [selectedFaq, setSelectedFaq] = useState(null);

  const faqs = [
    {
      question: "What is PF Speaking Master?",
      answer: "PF Speaking Master is an innovative online platform designed to help students improve their English speaking skills through interactive sessions, real-time feedback, and structured learning materials."
    },
    {
      question: "How do I join a session?",
      answer: "Students can join sessions by browsing available sessions in the 'Available Sessions' section, enrolling in their chosen session, and clicking 'Join Session' when it's time for the class."
    },
    {
      question: "How can I contact my teacher?",
      answer: "You can reach out to your teacher through the platform's messaging system or during live sessions. For general inquiries, visit our Contact page."
    },
    {
      question: "What technical requirements do I need?",
      answer: "You need a stable internet connection, a device with a microphone and camera, and an up-to-date web browser (Chrome recommended) to participate in sessions."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Help Center</h1>
        <p className="text-gray-600">
          Find answers to common questions about using PF Speaking Master. Can't find what you're looking for?{' '}
          <Link to="/dashboard/contact" className="text-blue-600 hover:text-blue-700 font-medium">
            Contact our support team
          </Link>
          .
        </p>
      </div>

      {/* FAQ Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors"
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                onClick={() => setSelectedFaq(selectedFaq === index ? null : index)}
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                    selectedFaq === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {selectedFaq === index && (
                <div className="px-6 py-4 bg-gray-50">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Help;
