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
    const brandLogo = clientBranding?.logo || '';
    const brandName = (clientBranding?.name || 'NutriMate').toString().replace(/CropFerti/gi, 'NutriMate');
    const normalizeReportText = (value, fallback = '') => String(value || fallback)
        .replace(/CropFerti/gi, 'NutriMate')
        .replace(/cropferti/gi, 'NutriMate')
        .replace(/Fertilizer/gi, 'Nutrient')
        .replace(/fertilizer/gi, 'nutrient')
        .replace(/Fertilizers/gi, 'Nutrients')
        .replace(/fertilizers/gi, 'nutrients');

    const reportTitleText = normalizeReportText(t?.('reportTitle'), 'Nutrient Recommendation Report');
    const reportSubtitleText = normalizeReportText(t?.('subtitle'), 'Professional Agricultural Analysis & Recommendations');
    const fieldInfoText = normalizeReportText(t?.('fieldInfo'), 'Field Information');
    const soilAnalysisText = normalizeReportText(t?.('soilAnalysis'), 'Soil Analysis Results');
    const nutrientRecommendationsText = normalizeReportText(t?.('fertilizerRecommendations'), 'Nutrient Recommendations');
    const nutrientSummaryText = normalizeReportText(t?.('nutrientSummary'), 'Nutrient Analysis Summary');
    const totalInvestmentText = normalizeReportText(t?.('totalInvestment'), 'Total Investment');
    const noteText = normalizeReportText(t?.('note'), 'Note: Recommendations based on crop requirements, soil analysis, and terrain conditions');
    const disclaimerText = normalizeReportText(t?.('report_disclaimer'), 'Note: This report is generated based on the provided information and standard agricultural practices. Please consult with local agricultural experts for specific recommendations.');

    const soilTestRows = [
        { key: 'n', label: 'Nitrogen (N)', range: soilTestRanges?.nitrogen || [] },
        { key: 'p', label: 'Phosphorus (P)', range: soilTestRanges?.phosphorus || [] },
        { key: 'k', label: 'Potassium (K)', range: soilTestRanges?.potassium || [] },
    ];

    const nutrientRows = [
        { key: 'n', label: 'Nitrogen (N)', base: nutrientCalcs?.baseN, adjusted: nutrientCalcs?.adjustedN, percentage: nutrientCalcs?.nPercentage, adjustment: nutrientCalcs?.nAdjustment },
        { key: 'p', label: 'Phosphorus (P)', base: nutrientCalcs?.baseP, adjusted: nutrientCalcs?.adjustedP, percentage: nutrientCalcs?.pPercentage, adjustment: nutrientCalcs?.pAdjustment },
        { key: 'k', label: 'Potassium (K)', base: nutrientCalcs?.baseK, adjusted: nutrientCalcs?.adjustedK, percentage: nutrientCalcs?.kPercentage, adjustment: nutrientCalcs?.kAdjustment },
    ];

    return (
        <>
                <style>{`
                    @page { size: A4; margin: 12mm; }
                    body {
                        font-family: Arial, Helvetica, sans-serif;
                        margin: 0;
                        padding: 0;
                        background: #fff;
                        color: #222;
                        font-size: 12px;
                    }
                    *{
                        box-sizing:border-box;
                    }
                    .page {
                        width: 100%;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    .header {
                        background: linear-gradient(135deg, #2f6b3b 0%, #4d9b58 100%);
                        color: #fff;
                        padding: 18px 22px;
                        border-radius: 0 0 16px 16px;
                        margin-bottom: 16px;
                    }
                    .header-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 12px;
                    }
                    .brand-block {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .brand-box {
                        width: 52px;
                        height: 52px;
                        border-radius: 12px;
                        background: rgba(255,255,255,0.16);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 12px;
                        border: 1px solid rgba(255,255,255,0.3);
                    }
                    .brand-name {
                        font-size: 14px;
                        font-weight: 700;
                    }
                    .report-meta {
                        text-align: right;
                        font-size: 11px;
                        opacity: 0.95;
                    }
                    .title {
                        text-align: center;
                        font-size: 22px;
                        font-weight: 700;
                        margin-top: 12px;
                        letter-spacing: 0.3px;
                    }
                    .subtitle {
                        text-align: center;
                        font-size: 11px;
                        margin-top: 6px;
                        opacity: 0.95;
                    }
                    .section {
                        border: 1px solid #e2e8f0;
                        border-radius: 10px;
                        padding: 12px;
                        margin-bottom: 12px;
                        background: #fafcf9;
                    }
                    .section-title {
                        font-weight: 700;
                        color: #2f6b3b;
                        font-size: 13px;
                        border-bottom: 1px solid #dce8dd;
                        padding-bottom: 6px;
                        margin-bottom: 8px;
                    }
                    .detail-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 8px 16px;
                        font-size: 11px;
                    }
                    .badge {
                        display: inline-block;
                        border-radius: 999px;
                        padding: 3px 8px;
                        font-size: 10px;
                        font-weight: 700;
                        background: #e9f7eb;
                        color: #2f6b3b;
                        margin-top: 4px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 11px;
                    }
                    th {
                        background: #2f6b3b;
                        color: #fff;
                        padding: 7px;
                        text-align: left;
                    }
                    td {
                        padding: 7px;
                        border-bottom: 1px solid #e8ece8;
                    }
                    .summary-row td {
                        background: #f4faf4;
                        font-weight: 700;
                    }
                    .muted { color: #6b7280; }
                    .footer {
                        margin-top: 12px;
                        padding-top: 10px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 10px;
                        color: #6b7280;
                    }
                    .pill {
                        display: inline-block;
                        padding: 2px 6px;
                        border-radius: 999px;
                        background: #e9f7eb;
                        color: #2f6b3b;
                        font-size: 10px;
                        font-weight: 700;
                    }
                    .brand-logo{
                        width:52px;
                        height:52px;
                        object-fit:contain;
                    }
                    img{
                        max-width:100%;
                        display:block;
                    }    
                `}</style>
            
            <body>
                <div className="page">
                    <div className="header">
                        <div className="header-top">
                            <div className="brand-block">
                                {brandLogo ? (
                                    className="brand-logo"
                                ) : (
                                    <div className="brand-box">NM</div>
                                )}
                                <div>
                                    <div className="brand-name">{brandName}</div>
                                    <div style={{ fontSize: 10, opacity: 0.9 }}>Smart nutrient planning</div>
                                </div>
                            </div>
                            <div className="report-meta">
                                <div>Report ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                                <div>{t?.('date') || 'Date'}: {reportDate}</div>
                            </div>
                        </div>
                        <div className="title">{reportTitleText}</div>
                        <div className="subtitle">{reportSubtitleText}</div>
                    </div>

                    <div className="section">
                        <div className="section-title">{fieldInfoText}</div>
                        <div className="detail-grid">
                            <div><strong>{t?.('crop') || 'Crop'}:</strong> {cropName || 'N/A'}</div>
                            <div><strong>{t?.('area') || 'Area'}:</strong> {fieldArea} {areaUnit}</div>
                            <div><strong>{t?.('soilAnalysis') || 'Soil analysis'}:</strong> {hasSoilTest ? 'Available' : 'Not provided'}</div>
                            <div><span className="pill">{t?.('totalInvestment') || 'Total Investment'}: Rs {results?.totalCost || 0}</span></div>
                        </div>
                    </div>

                    <div className="section">
                        <div className="section-title">{soilAnalysisText}</div>
                        <div className="detail-grid">
                            {hasSoilTest ? Object.entries(soilTestValues || {}).map(([key, value]) => (
                                <div key={key}><strong>{key.toUpperCase()}:</strong> {value || 0} kg/ha</div>
                            )) : <div className="muted">{t?.('noSoilTest') || 'No soil test data available'}</div>}
                        </div>
                    </div>

                    {results && (
                        <div className="section">
                            <div className="section-title">{nutrientRecommendationsText}</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t?.('fertilizer') || 'Nutrient'}</th>
                                        <th>{t?.('quantity') || 'Quantity (kg)'}</th>
                                        <th>{t?.('bags') || 'Bags'}</th>
                                        <th>{t?.('cost') || 'Cost (Rs)'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(results?.fertilizerDetails || []).map((item) => (
                                        <tr key={item?.id || item?.name}>
                                            <td>{item?.name || 'Item'}</td>
                                            <td>{parseFloat(item?.quantityNeeded || 0).toFixed(2)}</td>
                                            <td>{parseFloat(item?.bagsNeeded || 0).toFixed(2)}</td>
                                            <td>{parseFloat(item?.cost || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="summary-row">
                                        <td colSpan="3">{totalInvestmentText}</td>
                                        <td>Rs {parseFloat(results?.totalCost || 0).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {nutrientCalcs && (
                        <div className="section">
                            <div className="section-title">{nutrientSummaryText}</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nutrient</th>
                                        <th>Required</th>
                                        <th>Provided</th>
                                        <th>Coverage</th>
                                        <th>Adjustment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nutrientRows.map((row) => (
                                        <tr key={row.key}>
                                            <td>{row.label}</td>
                                            <td>{Number(row.base || 0).toFixed(2)}</td>
                                            <td>{Number(row.adjusted || 0).toFixed(2)}</td>
                                            <td>{Number(row.percentage || 0).toFixed(1)}%</td>
                                            <td>{row.adjustment || '0%'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="footer">
                        <div>{noteText}</div>
                        <div style={{ marginTop: 4 }}>{disclaimerText}</div>
                    </div>
                </div>
            </body>
        </>
    );
};

export default ReportTemplate;
