import React from 'react';

const ReportTemplate = ({
    t,
    cropName,
    fieldArea,
    areaUnit,
    results,
    reportDate,
    reportLanguage,
    nutrientCalcs,
    soilTestRanges,
    soilTestValues,
    hasSoilTest,
    clientBranding
}) => {
    return (
        <div className="report-document" lang={reportLanguage}>
            <style>
                    {`
                        @page {
                            size: A4;
                            margin: 20mm;
                            @bottom-center {
                                content: "Page " counter(page) " of " counter(pages);
                                font-size: 10px;
                                color: #666;
                            }
                        }
                        
                        @media print {
                            body {
                                margin: 0;
                                padding: 0;
                                print-color-adjust: exact;
                                -webkit-print-color-adjust: exact;
                            }
                            
                            .page-break {
                                page-break-before: always;
                                break-before: page;
                            }
                            
                            .page-break-inside-avoid {
                                page-break-inside: avoid;
                                break-inside: avoid;
                            }
                            
                            .keep-together {
                                page-break-inside: avoid;
                                break-inside: avoid;
                            }
                            
                            .nutrient-section {
                                page-break-inside: avoid;
                                break-inside: avoid;
                                margin-bottom: 5px;
                            }
                            
                            .ranges-table {
                                page-break-inside: avoid;
                                break-inside: avoid;
                            }
                            
                            .header {
                                page-break-after: avoid;
                                break-after: avoid;
                            }
                        }
                        
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background: white;
                            color: #000;
                            font-size: 12px;
                            line-height: 1.4;
                            counter-reset: page;
                        }
                        
                        .page {
                            max-width: 210mm;
                            margin: 0 auto;
                            background: white;
                            padding: 20px;
                            box-sizing: border-box;
                        }
                        
                        .header {
                            background: linear-gradient(135deg, #2c5530 0%, #4a7c59 100%);
                            color: white;
                            padding: 25px 30px;
                            margin: -20px -20px 30px -20px;
                            border-radius: 0 0 15px 15px;
                            position: relative;
                            overflow: hidden;
                            page-break-after: avoid;
                            break-after: avoid;
                        }
                        
                        .header::before {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" opacity="0.1"><path d="M20,20 Q50,5 80,20 Q95,50 80,80 Q50,95 20,80 Q5,50 20,20 Z" fill="white"/></svg>') center/cover;
                            opacity: 0.1;
                        }
                        
                        .header-content {
                            position: relative;
                            z-index: 1;
                        }
                        
                        .header-top {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            margin-bottom: 20px;
                        }
                        
                        .logo-section {
                            display: flex;
                            align-items: center;
                            gap: 15px;
                        }
                        
                        .logo-icon {
                            width: 100px;
                            height: 50px;
                            background: rgba(255, 255, 255, 0.2);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            font-weight: bold;
                            backdrop-filter: blur(10px);
                            border: 2px solid rgba(255, 255, 255, 0.3);
                        }
                        
                        .company-info {
                            display: flex;
                            flex-direction: column;
                        }
                        
                        .company-name {
                            font-size: 16px;
                            font-weight: bold;
                            margin-bottom: 2px;
                            letter-spacing: 0.5px;
                        }
                        
                        .company-tagline {
                            font-size: 11px;
                            opacity: 0.9;
                            font-style: italic;
                        }
                        
                        .report-meta {
                            text-align: right;
                            font-size: 11px;
                            opacity: 0.9;
                        }
                        
                        .report-id {
                            margin-bottom: 5px;
                            font-weight: 500;
                        }
                        
                        .report-date {
                            font-size: 10px;
                        }
                        
                        .title {
                            font-size: 24px;
                            font-weight: bold;
                            text-align: center;
                            margin: 0;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                            letter-spacing: 1px;
                        }
                        
                        .subtitle {
                            text-align: center;
                            font-size: 13px;
                            margin-top: 8px;
                            opacity: 0.9;
                            font-weight: 300;
                        }
                        
                        .header-divider {
                            width: 60px;
                            height: 3px;
                            background: rgba(255, 255, 255, 0.8);
                            margin: 15px auto 0;
                            border-radius: 2px;
                        }
                        
                        .section {
                            margin-bottom: 25px;
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        
                        .section-title {
                            font-size: 14px;
                            font-weight: bold;
                            margin-bottom: 10px;
                            color: #2c5530;
                            border-bottom: 2px solid #e0e0e0;
                            padding-bottom: 5px;
                            page-break-after: avoid;
                            break-after: avoid;
                        }
                        
                        .crop-info {
                            font-size: 12px;
                            margin-bottom: 15px;
                            background: #f8fdf8;
                            padding: 15px;
                            border-left: 4px solid #4a7c59;
                            border-radius: 0 8px 8px 0;
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        
                        .soil-test-note {
                            display: flex;
                            gap: 5px;
                            font-size: 11px;
                            color: #666;
                            margin-bottom: 15px;
                            font-style: italic;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 10px 0;
                            font-size: 11px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            border-radius: 8px;
                            overflow: hidden;
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        
                        th {
                            background: linear-gradient(135deg, #4a7c59, #2c5530);
                            color: white;
                            padding: 12px 8px;
                            text-align: left;
                            font-weight: bold;
                            border: none;
                        }
                        
                        td {
                            padding: 10px 8px;
                            border: 1px solid #e0e0e0;
                            text-align: left;
                            background: white;
                        }
                        
                        tr:nth-child(even) td {
                            background: #f9f9f9;
                        }
                        
                        .total-cost {
                            font-size: 16px;
                            font-weight: bold;
                            text-align: right;
                            margin: 20px 0;
                            padding: 15px;
                            background: linear-gradient(135deg, #2c5530, #4a7c59);
                            color: white;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        
                        .nutrient-table th {
                            background: linear-gradient(135deg, #4a7c59, #2c5530);
                        }
                        
                        .soil-test-section {
                            margin-top: 10px;
                            page-break-before: always;
                            break-before: page;
                        }
                        
                        .soil-test-header {
                            font-size: 16px;
                            font-weight: bold;
                            margin-bottom: 5px;
                            color: #2c5530;
                            page-break-after: avoid;
                            break-after: avoid;
                        }
                        
                        .soil-test-subheader {
                            font-size: 11px;
                            color: #666;
                            margin-bottom: 20px;
                            page-break-after: avoid;
                            break-after: avoid;
                        }
                        
                        .nutrient-section {
                            margin-bottom: 15px;
                            background: #fafbfa;
                            border-radius: 6px;
                            padding: 8px;
                            border: 1px solid #e8ede8;
                            box-shadow: 0 1px 3px rgba(44, 85, 48, 0.05);
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        
                        .nutrient-title {
                            font-size: 10px;
                            font-weight: 600;
                            margin-bottom: 6px;
                            color: #2c5530;
                            padding: 4px 8px;
                            background: linear-gradient(135deg, #4a7c59, #2c5530);
                            color: white;
                            border-radius: 4px;
                            text-align: center;
                            letter-spacing: 0.2px;
                            text-transform: uppercase;
                            position: relative;
                            page-break-after: avoid;
                            break-after: avoid;
                        }
                        
                        .nutrient-title::before {
                            content: '';
                            position: absolute;
                            left: 8px;
                            top: 50%;
                            transform: translateY(-50%);
                            width: 12px;
                            height: 12px;
                            background: rgba(255, 255, 255, 0.2);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .nutrient-title.nitrogen::before {
                            content: 'N';
                            font-weight: bold;
                            font-size: 8px;
                        }
                        
                        .nutrient-title.phosphorus::before {
                            content: 'P';
                            font-weight: bold;
                            font-size: 8px;
                        }
                        
                        .nutrient-title.potassium::before {
                            content: 'K';
                            font-weight: bold;
                            font-size: 8px;
                        }
                        
                        .ranges-table {
                            width: 85%;
                            margin: 6px auto 0;
                            font-size: 9px;
                            border-radius: 4px;
                            overflow: hidden;
                            box-shadow: 0 1px 6px rgba(44, 85, 48, 0.08);
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        
                        .ranges-table th {
                            background: linear-gradient(135deg, #4a7c59, #2c5530);
                            color: white;
                            padding: 3px 2px;
                            font-size: 8px;
                            font-weight: 600;
                            text-align: center;
                            border: none;
                            position: relative;
                        }
                        
                        .ranges-table th:first-child {
                            text-align: left;
                            padding-left: 6px;
                            width: 45%;
                        }
                        
                        .ranges-table th:nth-child(2) {
                            width: 25%;
                        }
                        
                        .ranges-table th:nth-child(3) {
                            width: 30%;
                        }
                        
                        .ranges-table td {
                            padding: 2px 2px;
                            font-size: 8px;
                            border: 1px solid #e8ede8;
                            text-align: center;
                            vertical-align: middle;
                            transition: background-color 0.2s ease;
                        }
                        
                        .ranges-table td:first-child {
                            text-align: left;
                            font-weight: 500;
                            color: #2c5530;
                            padding-left: 6px;
                            background: linear-gradient(90deg, #f8fdf8, white);
                        }
                        
                        .ranges-table tr:hover td {
                            background-color: #f0f7f0;
                        }
                        
                        .ranges-table tr:nth-child(even) td {
                            background: #f9fbf9;
                        }
                        
                        .ranges-table tr:nth-child(even):hover td {
                            background-color: #f0f7f0;
                        }
                        
                        .ranges-table tr:nth-child(even) td:first-child {
                            background: linear-gradient(90deg, #f5faf5, #f9fbf9);
                        }
                        
                        .adjustment-positive {
                            color: #2e7d2e;
                            font-weight: 600;
                        }
                        
                        .adjustment-negative {
                            color: #c62828;
                            font-weight: 600;
                        }
                        
                        .adjustment-neutral {
                            color: #f57c00;
                            font-weight: 600;
                        }
                        
                        .level-low {
                            color: #c62828;
                            background: rgba(198, 40, 40, 0.1);
                            padding: 1px 3px;
                            border-radius: 2px;
                            font-weight: 600;
                            font-size: 7px;
                        }
                        
                        .level-medium {
                            color: #f57c00;
                            background: rgba(245, 124, 0, 0.1);
                            padding: 1px 3px;
                            border-radius: 2px;
                            font-weight: 600;
                            font-size: 7px;
                        }
                        
                        .level-high {
                            color: #2e7d2e;
                            background: rgba(46, 125, 46, 0.1);
                            padding: 1px 3px;
                            border-radius: 2px;
                            font-weight: 600;
                            font-size: 7px;
                        }
                        
                        .nutrient-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr 1fr;
                            gap: 20px;
                            margin-top: 20px;
                        }
                        
                        @media (max-width: 768px) {
                            .nutrient-grid {
                                grid-template-columns: 1fr;
                            }
                        }
                        
                        .info-section {
                            margin-top: 20px;
                            padding: 15px;
                            background: linear-gradient(135deg, #f8fdf8, #e8f5e8);
                            border-left: 4px solid #4a7c59;
                            border-radius: 0 8px 8px 0;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        
                        .info-title {
                            font-weight: bold;
                            margin-bottom: 10px;
                            color: #2c5530;
                            font-size: 12px;
                        }
                        
                        .info-list {
                            list-style: none;
                            margin-left: 0;
                            font-size: 10px;
                            padding-left: 0;
                        }
                        
                        .info-list li {
                            margin-bottom: 6px;
                            padding-left: 16px;
                            position: relative;
                        }
                        
                        .info-list li::before {
                            content: '✓';
                            position: absolute;
                            left: 0;
                            color: #4a7c59;
                            font-weight: bold;
                        }
                        
                        .footer {
                            text-align: center;
                            font-size: 9px;
                            color: #666;
                            margin-top: 20px;
                            padding-top: 12px;
                            border-top: 1px solid #e0e0e0;
                            background: #f9f9f9;
                            margin-left: -20px;
                            margin-right: -20px;
                            padding-left: 20px;
                            padding-right: 20px;
                            padding-bottom: 12px;
                        }
                        
                        .page-header {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 40px;
                            display: none;
                        }
                        
                        @media print {
                            .page-header {
                                display: block;
                            }
                        }
                    `}
                </style>
                <div className="page">
                    <div className="header keep-together">
                        <div className="header-content">
                            <div className="header-top">
                                <div className="logo-section">
                                    <img src="/images/Agriculture.png" alt="logo" className='logo-icon' />
                                    {clientBranding?.logo && (
                                        <img src={clientBranding.logo} alt="client-logo" className='logo-icon' style={{ objectFit: 'contain' }} />
                                    )}
                                </div>
                                <div className="report-meta">
                                    <div className="report-id">Report ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                                    <div className="report-date">{t('date')}: {reportDate}</div>
                                </div>
                            </div>
                            <div className="title">{t('reportTitle')}</div>
                            <div className="subtitle">Comprehensive Soil & Fertilizer Analysis</div>
                            <div className="header-divider"></div>
                        </div>
                    </div>

                    <div className="section keep-together">
                        <div className="section-title">{t('fieldInfo')}</div>
                        <div className="crop-info">
                            <strong>{t('crop')}:</strong> {cropName}<br />
                            <strong>{t('area')}:</strong> {fieldArea} {areaUnit}
                        </div>
                    </div>

                    <div className="section keep-together">
                        <div className="section-title">{t('soilAnalysis')}</div>
                        <div className="soil-test-note">
                            {hasSoilTest ?
                                Object.entries(soilTestValues || {}).map(([key, value]) => {
                                    return (
                                        <div key={key}>
                                            <strong>{key?.toUpperCase()}:</strong> {value} kg/ha
                                        </div>
                                    )
                                })
                                : t('noSoilTest')
                            }
                        </div>
                    </div>

                    {results && (
                        <div className="section keep-together">
                            <div className="section-title">{t('fertilizerRecommendations')}</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('fertilizer')}</th>
                                        <th>{t('quantity')}</th>
                                        <th>{t('bags')}</th>
                                        <th>{t('cost')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results?.fertilizerDetails.map((result) => {
                                        return (
                                            <tr key={result?.id}>
                                                <td>{result?.name}</td>
                                                <td>{parseFloat(result?.quantityNeeded).toFixed(2)}</td>
                                                <td>{parseFloat(result?.bagsNeeded).toFixed(2)}</td>
                                                <td>{parseFloat(result?.cost).toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {nutrientCalcs && (
                        <div className="section keep-together">
                            <div className="section-title">{t('nutrientSummary')}</div>
                            <table className="nutrient-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>{t('required')}</th>
                                        <th>{t('provided')}</th>
                                        <th>{t('coverage')}</th>
                                        <th>{t('adjustment')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>{t('nitrogen_n_label')}</strong></td>
                                        <td>{nutrientCalcs.baseN.toFixed(2)}</td>
                                        <td>{nutrientCalcs.adjustedN.toFixed(2)}</td>
                                        <td>{nutrientCalcs.nPercentage.toFixed(1)}%</td>
                                        <td>{nutrientCalcs.nAdjustment}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>{t('phosphorus_p_label')}</strong></td>
                                        <td>{nutrientCalcs.baseP.toFixed(2)}</td>
                                        <td>{nutrientCalcs.adjustedP.toFixed(2)}</td>
                                        <td>{nutrientCalcs.pPercentage.toFixed(1)}%</td>
                                        <td>{nutrientCalcs.pAdjustment}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>{t('potassium_k_label')}</strong></td>
                                        <td>{nutrientCalcs.baseK.toFixed(2)}</td>
                                        <td>{nutrientCalcs.adjustedK.toFixed(2)}</td>
                                        <td>{nutrientCalcs.kPercentage.toFixed(1)}%</td>
                                        <td>{nutrientCalcs.kAdjustment}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {results && (
                        <div className="total-cost keep-together">
                            <strong>{t('totalInvestment')}: Rs {results.totalCost}/-</strong>
                        </div>
                    )}

                    <div className="soil-test-section">
                        <div className="soil-test-header keep-together">{t('soilGuide')}</div>
                        <div className="soil-test-subheader keep-together">
                            {t('soilGuideSubtitle')}
                        </div>

                        <div className="nutrient-section">
                            <div className="nutrient-title nitrogen">
                                {t('nitrogen_n_label')}
                            </div>
                            <table className="ranges-table">
                                <thead>
                                    <tr>
                                        <th>{t('soil_nitrogen_label')}</th>
                                        <th>{t('adjustment')}</th>
                                        <th>{t('nutrient_recommendation_title')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {soilTestRanges && soilTestRanges.nitrogen && soilTestRanges.nitrogen.map((range, index) => (
                                        <tr key={index}>
                                            <td>
                                                <strong>{range.category}</strong><br />
                                                <span style={{ fontSize: '7px', color: '#666' }}>{range.range}</span>
                                            </td>
                                            <td className={
                                                range.adjustment.includes('+') ? 'adjustment-positive' :
                                                    range.adjustment.includes('-') ? 'adjustment-negative' : 'adjustment-neutral'
                                            }>
                                                {range.adjustment}
                                            </td>
                                            <td>
                                                <span className={
                                                    range.level.toLowerCase().includes('low') ? 'level-low' :
                                                        range.level.toLowerCase().includes('medium') ? 'level-medium' : 'level-high'
                                                }>
                                                    {range.level}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="nutrient-section">
                            <div className="nutrient-title phosphorus">
                                {t('phosphorus_p_label')}
                            </div>
                            <table className="ranges-table">
                                <thead>
                                    <tr>
                                        <th>{t('soil_phosphorus_label')}</th>
                                        <th>{t('adjustment')}</th>
                                        <th>{t('nutrient_recommendation_title')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {soilTestRanges && soilTestRanges.phosphorus && soilTestRanges.phosphorus.map((range, index) => (
                                        <tr key={index}>
                                            <td>
                                                <strong>{range.category}</strong><br />
                                                <span style={{ fontSize: '7px', color: '#666' }}>{range.range}</span>
                                            </td>
                                            <td className={
                                                range.adjustment.includes('+') ? 'adjustment-positive' :
                                                    range.adjustment.includes('-') ? 'adjustment-negative' : 'adjustment-neutral'
                                            }>
                                                {range.adjustment}
                                            </td>
                                            <td>
                                                <span className={
                                                    range.level.toLowerCase().includes('low') ? 'level-low' :
                                                        range.level.toLowerCase().includes('medium') ? 'level-medium' : 'level-high'
                                                }>
                                                    {range.level}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="nutrient-section">
                            <div className="nutrient-title potassium">
                                {t('potassium_k_label')}
                            </div>
                            <table className="ranges-table">
                                <thead>
                                    <tr>
                                        <th>{t('soil_potassium_label')}</th>
                                        <th>{t('adjustment')}</th>
                                        <th>{t('nutrient_recommendation_title')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {soilTestRanges && soilTestRanges.potassium && soilTestRanges.potassium.map((range, index) => (
                                        <tr key={index}>
                                            <td>
                                                <strong>{range.category}</strong><br />
                                                <span style={{ fontSize: '7px', color: '#666' }}>{range.range}</span>
                                            </td>
                                            <td className={
                                                range.adjustment.includes('+') ? 'adjustment-positive' :
                                                    range.adjustment.includes('-') ? 'adjustment-negative' : 'adjustment-neutral'
                                            }>
                                                {range.adjustment}
                                            </td>
                                            <td>
                                                <span className={
                                                    range.level.toLowerCase().includes('low') ? 'level-low' :
                                                        range.level.toLowerCase().includes('medium') ? 'level-medium' : 'level-high'
                                                }>
                                                    {range.level}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="info-section keep-together">
                        <div className="info-title">Important Information</div>
                        <ul className="info-list">
                            <li>{t('note')}</li>
                            <li>{t('report_disclaimer')}</li>
                            <li>Developed by Suyog Khose, Vinit Patidar and team</li>
                        </ul>
                    </div>

                    <div className="footer">
                        {t('report_disclaimer')}
                    </div>
                </div>
            </div>
    );
};

export default ReportTemplate;