import React, { useContext } from 'react';
import { TranslationContext } from '../context/TranslationContext';

const AboutUs = () => {
    const { t } = useContext(TranslationContext);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 bg-white shadow-lg rounded-lg">
            <h1 className="text-4xl font-extrabold mb-8 text-center text-green-700 border-b-4 border-green-500 pb-4">{t('about_page_title')}</h1>

            <section className="mb-10 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-green-600 border-b-2 border-green-300 pb-2">{t('about_page_intro_title')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('about_page_intro_body')}</p>
            </section>

            <section className="mb-10 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-green-600 border-b-2 border-green-300 pb-2">{t('about_page_problem_title')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('about_page_problem_body')}</p>
            </section>

            <section className="mb-10 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-green-600 border-b-2 border-green-300 pb-2">{t('about_page_how_it_works_title')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('about_page_how_it_works_body')}</p>
                <ul className="list-disc ml-8 text-gray-700 space-y-2 mb-4 pl-4">
                    <li className="bg-green-100 p-2 rounded">{t('about_page_how_it_works_item_quantity')}</li>
                    <li className="bg-green-100 p-2 rounded">{t('about_page_how_it_works_item_bags')}</li>
                    <li className="bg-green-100 p-2 rounded">{t('about_page_how_it_works_item_costs')}</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">{t('about_page_how_it_works_note')}</p>
            </section>

            <section className="mb-10 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-green-600 border-b-2 border-green-300 pb-2">{t('about_page_goal_title')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('about_page_goal_body_1')}</p>
                <p className="text-gray-700 leading-relaxed">{t('about_page_goal_body_2')}</p>
            </section>

            <p className="mt-8 text-center text-xl font-bold text-green-700 italic">{t('about_page_cta')}</p>
        </div>
    );
};

export default AboutUs;