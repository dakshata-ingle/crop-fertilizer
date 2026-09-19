import React, { useContext } from 'react';
import { TranslationContext } from '../context/TranslationContext';

const ContactUs = () => {
    const { t } = useContext(TranslationContext);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 bg-white shadow-lg rounded-lg">
            <h1 className="text-4xl font-extrabold mb-8 text-center text-green-700 border-b-4 border-green-500 pb-4">{t('contact_page_title')}</h1>

            <section className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-700 leading-relaxed mb-6">
                    {t('contact_page_intro')}
                </p>

                <div className="space-y-4">
                    <div className="bg-green-100 p-4 rounded-lg shadow-sm">
                        <h2 className="text-2xl font-bold text-green-600 mb-2">Suyog Khose</h2>

                        <div className="space-y-2">
                            <div className="flex items-center justify-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                                <a
                                    href="mailto:khosesuyog@gmail.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-700 hover:text-green-900 underline"
                                >
                                    khosesuyog@gmail.com
                                </a>
                            </div>

                            <div className="flex items-center justify-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                <a
                                    href="tel:+919403613471"
                                    className="text-green-700 hover:text-green-900 underline"
                                >
                                    +91 9403613471
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-gray-600 italic">
                    {t('contact_page_help_text')}
                </p>
            </section>

            <div className="mt-8 bg-green-50 p-4 rounded-lg text-center">
                <p className="text-green-800 font-semibold">
                    {t('contact_page_support_text')}
                </p>
            </div>
        </div>
    );
};

export default ContactUs;