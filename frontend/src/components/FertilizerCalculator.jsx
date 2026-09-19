import React, { useState, useEffect, useContext } from 'react'
import { translateTextBatch } from '../utils/translationService';
import ReportTemplate from './ReportTemplate';
import { renderToStaticMarkup } from 'react-dom/server';
import html2pdf from 'html2pdf.js';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { fetchCatalog, fetchRecommendations, saveRecommendation } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { TranslationContext } from '../context/TranslationContext';
import { resolveCropImagePath } from '../utils/cropImage';

// Soil test interpretation ranges (in kg/ha)
const soilTestRanges = {
    nitrogen: {
        very_low: { min: 0, max: 140, adjustment: 50 },
        low: { min: 140, max: 280, adjustment: 25 },
        medium: { min: 281, max: 420, adjustment: 0 },
        medium_high: { min: 421, max: 560, adjustment: 0 },
        high: { min: 561, max: 700, adjustment: -25 },
        very_high: { min: 701, max: 999999, adjustment: -50 }
    },
    phosphorus: {
        very_low: { min: 0, max: 7, adjustment: 50 },
        low: { min: 8, max: 14, adjustment: 25 },
        medium: { min: 15, max: 21, adjustment: 0 },
        medium_high: { min: 22, max: 28, adjustment: 0 },
        high: { min: 29, max: 35, adjustment: -25 },
        very_high: { min: 36, max: 999999, adjustment: -50 }
    },
    potassium: {
        very_low: { min: 0, max: 100, adjustment: 50 },
        low: { min: 101, max: 150, adjustment: 25 },
        medium: { min: 151, max: 200, adjustment: 0 },
        medium_high: { min: 201, max: 250, adjustment: 0 },
        high: { min: 251, max: 300, adjustment: -25 },
        very_high: { min: 301, max: 999999, adjustment: -50 }
    }
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const FertilizerCalculator = () => {
    const { token, user, clientBranding } = useContext(AuthContext);
    const { language: ctxLanguage, setLanguage: setCtxLanguage, t: ctxT } = useContext(TranslationContext);

    // State for all inputs
    const [crop, setCrop] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fieldArea, setFieldArea] = useState(1)
    const [areaUnit, setAreaUnit] = useState("acre")
    const [selectedFertilizers, setSelectedFertilizers] = useState([])
    const [results, setResults] = useState(null)
    const [doseType, setDoseType] = useState("recommended")
    const [customDose, setCustomDose] = useState({ n: 120, p: 60, k: 60 })
    const [reportLanguage, setReportLanguage] = useState(ctxLanguage || 'en')

    // Soil test related states
    const [hasSoilTest, setHasSoilTest] = useState(false)
    const [soilTestValues, setSoilTestValues] = useState({ n: '', p: '', k: '' })
    const [soilTestAdjustments, setSoilTestAdjustments] = useState({ n: 0, p: 0, k: 0 })

    // Available crops and fertilizers from backend catalog
    const [crops, setCrops] = useState([])
    const [fertilizers, setFertilizers] = useState([])
    const [catalogError, setCatalogError] = useState(null)
    const [catalogLoading, setCatalogLoading] = useState(true)
    const [history, setHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [historyError, setHistoryError] = useState(null)
    const [savingHistory, setSavingHistory] = useState(false)
    const [refreshingPrices, setRefreshingPrices] = useState(false)

    // Common fertilizer combinations
    const commonCombinations = [
        { name: "Urea + DAP", fertilizers: ["urea", "dap"] },
        { name: "Urea + MOP", fertilizers: ["urea", "mop"] },
        { name: "NPK 17-17-17", fertilizers: ["npk_17_17_17"] },
        { name: "Urea + DAP + MOP", fertilizers: ["urea", "dap", "mop"] },
    ]

    
    // Load catalog and recommendation history on mount
    const loadHistory = async () => {
        if (!token || user?.role !== 'farmer') return;

        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const data = await fetchRecommendations(token);
            setHistory(data.recommendations || []);
        } catch (err) {
            setHistoryError(err.message || t('calculator_history_load_error') || 'Unable to load recommendation history');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        const loadCatalog = async () => {
            setCatalogLoading(true)
            setCatalogError(null)
            try {
                const data = await fetchCatalog()
                const cropsData = (data.data?.crops || []).map((crop) => ({
                    ...crop,
                    id: crop.cropId || crop._id,
                    image: crop.image || '/images/placeholder.svg',
                }))
                const fertilizersData = (data.data?.fertilizers || [])
                    .filter((fert) => fert.isActive !== false)
                    .map((fert) => ({
                        ...fert,
                        id: fert.fertilizerId || fert._id,
                    }))
                setCrops(cropsData)
                setFertilizers(fertilizersData)
                if (!crop && cropsData.length > 0) {
                    setCustomDose(cropsData[0].npk || { n: 120, p: 60, k: 60 })
                }
            } catch (err) {
                setCatalogError(err.message || t('calculator_catalog_load_error') || 'Unable to load catalog')
            } finally {
                setCatalogLoading(false)
            }
        }

        loadCatalog()
        loadHistory()
    }, [token, user?.role])

    // Listen for global language changes (from header selector)
    useEffect(() => {
        const handler = (e) => {
            const lang = e?.detail?.language || (e?.target && e.target.value) || null;
            if (lang) setReportLanguage(lang);
        };

        window.addEventListener('languageChanged', handler);
        return () => window.removeEventListener('languageChanged', handler);
    }, []);

    // Helper to get translation (prefers context t)
    const t = (key) => ctxT ? ctxT(key) : (translatedLabels[key] || translations["en"][key] || key);

    

    // Update custom dose when crop changes
    useEffect(() => {
        if (crop && doseType === "recommended") {
            const selectedCrop = crops.find((c) => c.id === crop)
            if (selectedCrop) {
                setCustomDose({ ...selectedCrop.npk })
            }
        }
    }, [crop, crops, doseType])

    // Calculate soil test adjustments
    const calculateSoilTestAdjustments = (n, p, k) => {
        const adjustments = { n: 0, p: 0, k: 0 };

        // Nitrogen adjustment
        if (n <= soilTestRanges.nitrogen.very_low.max) {
            adjustments.n = soilTestRanges.nitrogen.very_low.adjustment;
        } else if (n <= soilTestRanges.nitrogen.low.max) {
            adjustments.n = soilTestRanges.nitrogen.low.adjustment;
        } else if (n <= soilTestRanges.nitrogen.medium.max) {
            adjustments.n = soilTestRanges.nitrogen.medium.adjustment;
        } else if (n <= soilTestRanges.nitrogen.medium_high.max) {
            adjustments.n = soilTestRanges.nitrogen.medium_high.adjustment;
        } else if (n <= soilTestRanges.nitrogen.high.max) {
            adjustments.n = soilTestRanges.nitrogen.high.adjustment;
        }
        else if (n <= soilTestRanges.nitrogen.very_high.max) {
            adjustments.n = soilTestRanges.nitrogen.very_high.adjustment;
        }
        else {
            adjustments.n = 0;
        }

        // Phosphorus adjustment
        if (p <= soilTestRanges.phosphorus.very_low.max) {
            adjustments.p = soilTestRanges.phosphorus.very_low.adjustment;
        } else if (p <= soilTestRanges.phosphorus.low.max) {
            adjustments.p = soilTestRanges.phosphorus.low.adjustment;
        } else if (p <= soilTestRanges.phosphorus.medium.max) {
            adjustments.p = soilTestRanges.phosphorus.medium.adjustment;
        } else if (p <= soilTestRanges.phosphorus.medium_high.max) {
            adjustments.p = soilTestRanges.phosphorus.medium_high.adjustment;
        } else if (p <= soilTestRanges.phosphorus.high.max) {
            adjustments.p = soilTestRanges.phosphorus.high.adjustment;
        } else if (p <= soilTestRanges.phosphorus.very_high.max) {
            adjustments.p = soilTestRanges.phosphorus.very_high.adjustment;
        } else {
            adjustments.p = 0;
        }

        // Potassium adjustment
        if (k <= soilTestRanges.potassium.very_low.max) {
            adjustments.k = soilTestRanges.potassium.very_low.adjustment;
        } else if (k <= soilTestRanges.potassium.low.max) {
            adjustments.k = soilTestRanges.potassium.low.adjustment;
        } else if (k <= soilTestRanges.potassium.medium.max) {
            adjustments.k = soilTestRanges.potassium.medium.adjustment;
        } else if (k <= soilTestRanges.potassium.medium_high.max) {
            adjustments.k = soilTestRanges.potassium.medium_high.adjustment;
        } else if (k <= soilTestRanges.potassium.high.max) {
            adjustments.k = soilTestRanges.potassium.high.adjustment;
        } else if (k <= soilTestRanges.potassium.very_high.max) {
            adjustments.k = soilTestRanges.potassium.very_high.adjustment;
        } else {
            adjustments.k = 0;
        }

        return adjustments;
    };

    // Handle soil test values change
    const handleSoilTestChange = (nutrient, value) => {
        const newValues = { ...soilTestValues, [nutrient]: value };
        setSoilTestValues(newValues);

        if (newValues.n && newValues.p && newValues.k) {
            const adjustments = calculateSoilTestAdjustments(
                parseFloat(newValues.n),
                parseFloat(newValues.p),
                parseFloat(newValues.k)
            );
            setSoilTestAdjustments(adjustments);
        }
    };

    // Get soil test category
    const getSoilTestCategory = (value, nutrient) => {
        if (isNaN(value) || value < 0) alert("Please enter valid soil test values.");
        const ranges = soilTestRanges[nutrient];
        if (value <= ranges.very_low.max) return 'Very Low';
        if (value <= ranges.low.max) return 'Low';
        if (value <= ranges.medium_high.max) return 'Medium-High';
        if (value <= ranges.medium.max) return 'Medium';
        if (value <= ranges.high.max) return 'High';
        if (value <= ranges.very_high.max) return 'Very High';
        return 'High';
    };

    // Handle adding a fertilizer to selection
    const addFertilizer = (fertilizerId) => {
        const fertilizer = fertilizers.find((f) => f.id === fertilizerId)
        if (fertilizer && !selectedFertilizers.some((f) => f.id === fertilizerId)) {
            setSelectedFertilizers([
                ...selectedFertilizers,
                {
                    ...fertilizer,
                    customBagWeight: fertilizer.bagWeight,
                    customPrice: fertilizer.price
                },
            ])
        }
    }

    // Handle adding multiple fertilizers (for quick selection)
    const addMultipleFertilizers = (fertilizerIds) => {
        const newFertilizers = fertilizerIds
            .filter((id) => !selectedFertilizers.some((f) => f.id === id))
            .map((id) => {
                const fertilizer = fertilizers.find((f) => f.id === id)
                return {
                    ...fertilizer,
                    customBagWeight: fertilizer.bagWeight,
                    customPrice: fertilizer.price,
                    dosePercentage: 100,
                }
            })

        if (newFertilizers.length > 0) {
            setSelectedFertilizers([...selectedFertilizers, ...newFertilizers])
        }
    }

    // Handle removing a fertilizer from selection
    const removeFertilizer = (id) => {
        setSelectedFertilizers(selectedFertilizers.filter((f) => f.id !== id))
    }

    // Handle updating fertilizer custom values
    const updateFertilizer = (id, field, value) => {
        setSelectedFertilizers(
            selectedFertilizers.map((f) => (f.id === id ? { ...f, [field]: Number.parseFloat(value) || 0 } : f)),
        )
    }

    // Convert area to hectares for calculation
    const areaToHectares = (area, unit) => {
        switch (unit) {
            case "hectare":
                return area
            case "acre":
                return area * 0.4047
            case "bigha":
                return area * 0.25
            case "m2":
                return area * 0.0001
            case "ft2":
                return area * 9.2903 * Math.pow(10, -6);
            default:
                return area
        }
    }

    // Refresh latest fertilizer prices from catalog
    const refreshLatestPrices = async (selectedForCalc) => {
        try {
            const data = await fetchCatalog()
            const latestFertilizers = (data.data?.fertilizers || [])
                .filter((fert) => fert.isActive !== false)
                .map((fert) => ({
                    ...fert,
                    id: fert.fertilizerId || fert._id,
                }))

            // Update selected fertilizers with latest prices from active catalog
            // Only update customPrice if it hasn't been manually overridden
            const updated = (selectedForCalc || selectedFertilizers).map((selected) => {
                const latest = latestFertilizers.find((f) => f.id === selected.id)
                if (latest && selected.customPrice === selected.price) {
                    // Price hasn't been manually overridden, update to latest
                    return {
                        ...selected,
                        ...latest,
                        customPrice: latest.price,
                        customBagWeight: selected.customBagWeight === selected.bagWeight ? latest.bagWeight : selected.customBagWeight,
                    }
                }
                return selected
            })

            return updated
        } catch (err) {
            console.error('Unable to refresh fertilizer prices:', err)
            return selectedForCalc || selectedFertilizers
        }
    }

    // Calculate fertilizer requirements and costs
    const calculateRequirements = async () => {
        if (!crop || selectedFertilizers.length === 0) {
            alert(t('calculator_select_crop_or_fertilizer') || 'Please select a crop and at least one fertilizer.')
            return
        }

        // Refresh latest prices before calculation and use updated array
        const fertilizersForCalculation = await refreshLatestPrices()

        // Get soil test adjustments if available
        const adjustments = hasSoilTest ? soilTestAdjustments : { n: 0, p: 0, k: 0 };

        // Required nutrients in kg with adjustments
        const requiredN = customDose.n * (1 + adjustments.n / 100) * areaToHectares(fieldArea, areaUnit)
        const requiredP = customDose.p * (1 + adjustments.p / 100) * areaToHectares(fieldArea, areaUnit)
        const requiredK = customDose.k * (1 + adjustments.k / 100) * areaToHectares(fieldArea, areaUnit)

        // Calculate fertilizer quantities and costs
        const fertilizerDetails = []
        let totalN = 0
        let totalP = 0
        let totalK = 0
        let totalCost = 0

        fertilizersForCalculation.forEach((fertilizer) => {
            // Calculate contribution of this fertilizer to NPK requirements
            const nFert = fertilizer.n > 0 ? requiredN / (fertilizer.n / 100) : 0
            const pFert = fertilizer.p > 0 ? requiredP / (fertilizer.p / 100) : 0
            const kFert = fertilizer.k > 0 ? requiredK / (fertilizer.k / 100) : 0

            // Calculate fertilizer quantity needed (kg)
            let quantityNeeded = fertilizer.n > fertilizer.p && fertilizer.n > fertilizer.k ? nFert :
                fertilizer.p > fertilizer.n && fertilizer.p > fertilizer.k ? pFert : kFert

            // Calculate bags needed
            const bagsNeeded = quantityNeeded / fertilizer.customBagWeight

            // Calculate cost
            const cost = bagsNeeded * fertilizer.customPrice
            totalN += (fertilizer.n / 100) * quantityNeeded
            totalP += (fertilizer.p / 100) * quantityNeeded
            totalK += (fertilizer.k / 100) * quantityNeeded
            totalCost += cost

            fertilizerDetails.push({
                ...fertilizer,
                quantityNeeded: quantityNeeded.toFixed(2),
                bagsNeeded,
                cost: cost.toFixed(2),
            })
        })

        // Check if requirements are met
        const nPercentage = (totalN / requiredN) * 100
        const pPercentage = (totalP / requiredP) * 100
        const kPercentage = (totalK / requiredK) * 100

        const nextResults = {
            fertilizerDetails,
            nutrients: {
                required: { n: requiredN.toFixed(2), p: requiredP.toFixed(2), k: requiredK.toFixed(2) },
                provided: { n: totalN.toFixed(2), p: totalP.toFixed(2), k: totalK.toFixed(2) },
                percentage: {
                    n: nPercentage.toFixed(1),
                    p: pPercentage.toFixed(1),
                    k: kPercentage.toFixed(1),
                },
                adjustments: {
                    n: adjustments.n > 0 ? `+${adjustments.n}%` : `${adjustments.n}%`,
                    p: adjustments.p > 0 ? `+${adjustments.p}%` : `${adjustments.p}%`,
                    k: adjustments.k > 0 ? `+${adjustments.k}%` : `${adjustments.k}%`,
                }
            },
            totalCost: totalCost.toFixed(2),
            warning: nPercentage < 90 || pPercentage < 90 || kPercentage < 90,
        };

        setResults(nextResults);

        // Update component state with latest prices fetched during calculation
        setSelectedFertilizers(fertilizersForCalculation);

        if (token && user?.role === 'farmer') {
            const selectedCrop = crops.find((c) => c.id === crop);
            const payload = {
                crop,
                cropName: selectedCrop?.name || '',
                fieldArea: Number(fieldArea) || 0,
                areaUnit,
                doseType,
                customDose,
                hasSoilTest,
                soilTestValues,
                selectedFertilizers: fertilizersForCalculation,
                results: nextResults,
            };

            setSavingHistory(true);
            saveRecommendation(token, payload)
                .then(() => loadHistory())
                .catch(() => setHistoryError(t('calculator_history_save_error') || 'Unable to save recommendation history'))
                .finally(() => setSavingHistory(false));
        }
    }

    // Reset calculator
    const resetCalculator = () => {
        setCrop("")
        setFieldArea(1)
        setAreaUnit("acre")
        setSelectedFertilizers([])
        setResults(null)
        setDoseType("recommended")
        setCustomDose({ n: 120, p: 60, k: 60 })
        setHasSoilTest(false)
        setSoilTestValues({ n: '', p: '', k: '' })
        setSoilTestAdjustments({ n: 0, p: 0, k: 0 })
    }

    // Handle dose type change
    const handleDoseTypeChange = (type) => {
        setDoseType(type)
        if (type === "recommended" && crop) {
            const selectedCrop = crops.find((c) => c.id === crop)
            if (selectedCrop) {
                setCustomDose({ ...selectedCrop.npk })
            }
        }
    }

    // Handle custom dose change
    const handleCustomDoseChange = (nutrient, value) => {
        setCustomDose({
            ...customDose,
            [nutrient]: Number.parseInt(value) || 0,
        })
    }

    // Get selected crop image
    const getCropImage = () => {
        const selectedCrop = crops.find(c => c.id === crop)
        return resolveCropImagePath(selectedCrop || { id: crop })
    }

    const downloadReport = async () => {
        if (!results) {
            alert(t('calculator_print_requirements_first') || 'Please calculate fertilizer requirements first');
            return;
        }

        let reportWindow = null;

        try {
            const currentDate = new Date().toLocaleDateString();
            const selectedCrop = crops.find(c => c.id === crop);

            const nutrientCalcs = {
                baseN: parseFloat(results.nutrients.required.n),
                baseP: parseFloat(results.nutrients.required.p),
                baseK: parseFloat(results.nutrients.required.k),
                adjustedN: parseFloat(results.nutrients.provided.n),
                adjustedP: parseFloat(results.nutrients.provided.p),
                adjustedK: parseFloat(results.nutrients.provided.k),
                nPercentage: parseFloat(results.nutrients.percentage.n),
                pPercentage: parseFloat(results.nutrients.percentage.p),
                kPercentage: parseFloat(results.nutrients.percentage.k),
                nAdjustment: results.nutrients.adjustments.n,
                pAdjustment: results.nutrients.adjustments.p,
                kAdjustment: results.nutrients.adjustments.k
            };

            const reportSoilTestRanges = {
                nitrogen: [
                    { category: 'Very Low', range: '0-140 kg/ha', adjustment: '+50%', level: 'Increase N application' },
                    { category: 'Low', range: '141-280 kg/ha', adjustment: '+25%', level: 'Moderate increase' },
                    { category: 'Medium', range: '281-420 kg/ha', adjustment: '0%', level: 'Standard application' },
                    { category: 'Medium-High', range: '421-560 kg/ha', adjustment: '0%', level: 'Standard application' },
                    { category: 'High', range: '561-700 kg/ha', adjustment: '-25%', level: 'Reduce N application' },
                    { category: 'Very High', range: '>700 kg/ha', adjustment: '-50%', level: 'Significant reduction' }
                ],
                phosphorus: [
                    { category: 'Very Low', range: '0-7 kg/ha', adjustment: '+50%', level: 'Increase P application' },
                    { category: 'Low', range: '8-14 kg/ha', adjustment: '+25%', level: 'Moderate increase' },
                    { category: 'Medium', range: '15-21 kg/ha', adjustment: '0%', level: 'Standard application' },
                    { category: 'Medium-High', range: '22-28 kg/ha', adjustment: '0%', level: 'Standard application' },
                    { category: 'High', range: '29-35 kg/ha', adjustment: '-25%', level: 'Reduce P application' },
                    { category: 'Very High', range: '>35 kg/ha', adjustment: '-50%', level: 'Significant reduction' }
                ],
                potassium: [
                    { category: 'Very Low', range: '0-100 kg/ha', adjustment: '+50%', level: 'Increase K application' },
                    { category: 'Low', range: '101-150 kg/ha', adjustment: '+25%', level: 'Moderate increase' },
                    { category: 'Medium', range: '151-200 kg/ha', adjustment: '0%', level: 'Standard application' },
                    { category: 'Medium-High', range: '201-250 kg/ha', adjustment: '0%', level: 'Standard application' },
                    { category: 'High', range: '251-300 kg/ha', adjustment: '-25%', level: 'Reduce K application' },
                    { category: 'Very High', range: '>300 kg/ha', adjustment: '-50%', level: 'Significant reduction' }
                ]
            };

            const reportMarkup = `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{margin:0;padding:0;background:#fff;font-family:Arial,sans-serif;}</style></head><body>${renderToStaticMarkup(
                <ReportTemplate
                    t={t}
                    cropName={selectedCrop?.name || 'N/A'}
                    fieldArea={fieldArea}
                    areaUnit={areaUnit}
                    results={results}
                    hasSoilTest={hasSoilTest}
                    soilTestValues={soilTestValues}
                    getSoilTestCategory={getSoilTestCategory}
                    selectedFertilizers={selectedFertilizers}
                    reportDate={currentDate}
                    reportLanguage={reportLanguage}
                    nutrientCalcs={nutrientCalcs}
                    soilTestRanges={reportSoilTestRanges}
                    clientBranding={clientBranding}
                />
            )}</body></html>`;

            reportWindow = window.open('', '_blank', 'width=1200,height=1400');
            if (!reportWindow) {
                throw new Error('Unable to open report preview window');
            }

            reportWindow.document.open();
            reportWindow.document.write(reportMarkup);
            reportWindow.document.close();

            await new Promise((resolve) => setTimeout(resolve, 1200));

            if (Capacitor.getPlatform() === 'web') {
                reportWindow.document.title = `NutriMate_Report_${selectedCrop?.name || 'report'}_${currentDate.replace(/\//g, '-')}.pdf`;
                reportWindow.focus();
                reportWindow.print();
                alert('Please use the browser print dialog to save the report as a PDF.');
                return;
            }

            const options = {
                margin: 0,
                filename: `NutriMate_Report_${selectedCrop?.name || 'report'}_${currentDate.replace(/\//g, '-')}.pdf`,
                image: { type: 'png', quality: 1 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    foreignObjectRendering: true,
                    imageTimeout: 0
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            };

            const pdfBlob = await html2pdf().set(options).from(reportWindow.document.body).outputPdf('blob');
            const arrayBuffer = await pdfBlob.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            const fileName = options.filename;
            await Filesystem.writeFile({
                path: fileName,
                data: base64,
                directory: Directory.Documents,
            });
            alert(`PDF saved to device documents folder as ${fileName}`);
        } catch (error) {
            console.error('Error generating print report:', error);
            alert((t('calculator_pdf_error') || 'Error generating PDF report: ') + (error.message || error));
        } finally {
            if (reportWindow && !reportWindow.closed) {
                reportWindow.close();
            }
        }
    };

    return (
        <div className="min-h-screen rounded-[32px] border border-emerald-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(57,181,74,0.16),_transparent_32%),linear-gradient(135deg,_#f4fff8_0%,_#f8fbff_55%,_#fffdf5_100%)] px-2 py-3 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:px-4 md:py-5">
            <div className="mx-auto max-w-7xl space-y-4">
                <div className="rounded-[28px] border border-emerald-200/70 bg-white/85 p-4 shadow-sm backdrop-blur md:p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-emerald-700">Fertilizer Calculator</p>
                            <h1 className="mt-1 text-2xl font-bold text-slate-900">Plan crop nutrition with confidence</h1>
                            <p className="mt-2 text-sm text-slate-600">Choose a crop, set field size, compare fertilizer options, and save your recommendation in one place.</p>
                        </div>
                        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                            {user?.name ? `Welcome, ${user.name}` : 'Farmer workspace'}
                        </div>
                    </div>
                </div>
            {user?.role === 'farmer' && (
                <div className="rounded-[24px] border border-emerald-200/70 bg-white/85 p-4 shadow-sm backdrop-blur">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{t('calculator_history_title') || 'Recommendation history'}</h3>
                            <p className="text-sm text-slate-600">{t('calculator_history_subtitle') || 'Your recent fertilizer calculations are saved here.'}</p>
                        </div>
                        {savingHistory && <span className="text-sm text-emerald-600">{t('generic_saving') || 'Saving...'}</span>}
                    </div>

                    {historyError && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{historyError}</div>}

                    {historyLoading ? (
                        <div className="mt-4 text-sm text-slate-500">{t('generic_loading') || 'Loading...'}</div>
                    ) : history.length === 0 ? (
                        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{t('calculator_history_empty') || 'No saved recommendations yet.'}</div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {history.slice(0, 5).map((item) => (
                                <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-slate-900">{item.cropName || item.crop}</p>
                                            <p className="text-sm text-slate-600">{item.fieldArea} {item.areaUnit} • {item.doseType}</p>
                                        </div>
                                        <div className="text-sm text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600">
                                        Total cost: ₹{Number(item.results?.totalCost || 0).toFixed(2)} • N/P/K: {Number(item.results?.nutrients?.provided?.n || 0).toFixed(2)}/{Number(item.results?.nutrients?.provided?.p || 0).toFixed(2)}/{Number(item.results?.nutrients?.provided?.k || 0).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.12fr_0.92fr_0.96fr]">
                <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-green-100">
                        <h2 className="text-lg font-semibold mb-2 text-green-700 flex items-center gap-2">
                            <span className="p-1 bg-green-100 rounded-full">🌱</span>
                            <span>Crop & Field Details</span>
                        </h2>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">{t('calculator_select_crop') || 'Select Crop'}</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all bg-white"
                                        value={crop}
                                        onChange={(e) => setCrop(e.target.value)}
                                    >
                                        <option value="">{t('calculator_select_crop_placeholder') || '-- Select Crop --'}</option>
                                        {crops.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">{t('calculator_area') || 'Area'}</label>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all bg-white"
                                            value={fieldArea}
                                            onChange={(e) => setFieldArea(Number.parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">{t('calculator_unit') || 'Unit'}</label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all bg-white"
                                            value={areaUnit}
                                            onChange={(e) => setAreaUnit(e.target.value)}
                                        >
                                            <option value="acre">Acre</option>
                                            <option value="hectare">Hectare</option>
                                            <option value="bigha">Bigha</option>
                                            <option value="m2">m²</option>
                                            <option value="ft2">ft²</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={hasSoilTest}
                                            onChange={(e) => setHasSoilTest(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        {t('calculator_soil_test_report') || 'I have a soil test report'}
                                    </label>
                                </div>

                                {hasSoilTest && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">N (kg/ha)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full p-1.5 border rounded-md bg-white border-blue-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-sm"
                                                value={soilTestValues.n}
                                                onChange={(e) => handleSoilTestChange('n', e.target.value)}
                                                placeholder="0-800"
                                            />
                                            {soilTestValues.n && (
                                                <div className={`text-xs mt-1 text-gray-600`}>
                                                    {getSoilTestCategory(parseFloat(soilTestValues.n), 'nitrogen')}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">P (kg/ha)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full p-1.5 border rounded-md bg-white border-blue-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-sm"
                                                value={soilTestValues.p}
                                                onChange={(e) => handleSoilTestChange('p', e.target.value)}
                                                placeholder="0-50"
                                            />
                                            {soilTestValues.p && (
                                                <div className={`text-xs mt-1 text-gray-600`}>
                                                    {getSoilTestCategory(parseFloat(soilTestValues.p), 'phosphorus')}
                                                </div>
                                            )}
                                        </div><div>
                                            <label className="block text-xs text-gray-600 mb-1">K (kg/ha)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full p-1.5 border rounded-md bg-white border-blue-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-sm"
                                                value={soilTestValues.k}
                                                onChange={(e) => handleSoilTestChange('k', e.target.value)}
                                                placeholder="0-400"
                                            />
                                            {soilTestValues.k && (
                                                <div className={`text-xs mt-1 text-gray-600`}>
                                                    {getSoilTestCategory(parseFloat(soilTestValues.k), 'potassium')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="mb-2">
                                    <label className="block text-sm font-medium mb-1 text-gray-700">{t('calculator_nutrient_dose') || 'Nutrient Dose (NPK)'}</label>
                                    <div className="flex gap-2">
                                        <button
                                            className={`px-3 py-1 text-sm rounded-md transition-all ${doseType === "recommended"
                                                ? "bg-green-600 text-white shadow-md"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                }`}
                                            onClick={() => handleDoseTypeChange("recommended")}
                                        >
                                            {t('calculator_recommended') || 'Recommended'}
                                        </button>
                                        <button
                                            className={`px-3 py-1 text-sm rounded-md transition-all ${doseType === "custom"
                                                ? "bg-green-600 text-white shadow-md"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                }`}
                                            onClick={() => handleDoseTypeChange("custom")}
                                        >
                                            {t('calculator_custom') || 'Custom'}
                                        </button>
                                    </div>
                                </div>

                                {doseType === "recommended" ? (
                                    <div className="text-sm text-gray-600 bg-white p-2 rounded-md border border-gray-100">
                                        {crop ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{t('calculator_recommended_npk') || 'Recommended NPK (kg/ha):'}</span>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{customDose.n}</span>
                                                <span>:</span>
                                                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{customDose.p}</span>
                                                <span>:</span>
                                                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">{customDose.k}</span>
                                            </div>
                                        ) : (
                                            <p className="italic">{t('calculator_select_crop_recommended') || 'Select a crop to see recommended dose'}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Nitrogen (N)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full p-1.5 border rounded-md bg-blue-50 border-blue-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                                                value={customDose.n}
                                                onChange={(e) => handleCustomDoseChange("n", e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Phosphorus (P)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full p-1.5 border rounded-md bg-amber-50 border-amber-200 focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                                                value={customDose.p}
                                                onChange={(e) => handleCustomDoseChange("p", e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Potassium (K)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full p-1.5 border rounded-md bg-purple-50 border-purple-200 focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                                                value={customDose.k}
                                                onChange={(e) => handleCustomDoseChange("k", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-sm border border-green-100">
                        <div className="text-lg font-semibold mb-2 text-green-700 flex items-center justify-between gap-2">
                            <div>
                                <span className="p-1 bg-green-100 rounded-full">🌿</span>
                                <span>{t('calculator_crop_information') || 'Crop Information'}</span>
                            </div>
                        </div>

                        {crop ? (
                            <div className="flex items-center gap-3 ">
                                <img
                                    src={getCropImage()}
                                    alt={crops.find((c) => c.id === crop)?.name || "Crop"}
                                    className="h-24 w-24 object-cover rounded-lg border-2 border-green-200 shadow-sm"
                                />
                                <div>
                                    <h3 className="font-medium text-lg text-gray-800">{crops.find((c) => c.id === crop)?.name}</h3>
                                    <h3 className="italic text-md text-gray-600">{crops.find((c) => c.id === crop)?.botanicalName}</h3>
                                    <div className=" inline-flex items-center gap-2 text-gray-500">
                                        <span>Recommended NPK:</span>
                                        <span className="font-medium">
                                            {crops.find((c) => c.id === crop)?.npk.n}-{crops.find((c) => c.id === crop)?.npk.p}-
                                            {crops.find((c) => c.id === crop)?.npk.k}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-4 h-[100px] text-gray-400">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-10 w-10 mr-2 text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <p className="text-sm">Select a crop to see details</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="rounded-[24px] border border-emerald-200/70 bg-white/90 p-3 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-lg">💊</span>
                            <div>
                                <h2 className="text-lg font-semibold text-emerald-800">{t('calculator_fertilizer_selection') || 'Fertilizer Selection'}</h2>
                                <p className="text-sm text-slate-500">Pick combinations and fine-tune bag weight and price.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">{t('calculator_quick_add') || 'Quick Add'}</label>
                                <div className="flex flex-wrap gap-2">
                                    {commonCombinations.map((combo, index) => (
                                        <button
                                            key={index}
                                            onClick={() => addMultipleFertilizers(combo.fertilizers)}
                                            className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                        >
                                            {combo.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">{t('calculator_add_fertilizer') || 'Add Fertilizer'}</label>
                                <select
                                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            addFertilizer(e.target.value)
                                            e.target.value = ""
                                        }
                                    }}
                                >
                                    <option value="">{t('calculator_select_fertilizer_placeholder') || '-- Select Fertilizer --'}</option>
                                    {fertilizers.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-2">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-700">{t('calculator_selected_fertilizers') || 'Selected Fertilizers'}</h3>
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{selectedFertilizers.length}</span>
                                </div>
                                <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                                    {selectedFertilizers.length === 0 && (
                                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400">
                                            {t('calculator_no_fertilizers_selected') || 'No fertilizers selected yet'}
                                        </div>
                                    )}
                                    {selectedFertilizers.map((f, index) => (
                                        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm">
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <span className="text-sm font-semibold text-slate-800">{f.name}</span>
                                                <button
                                                    onClick={() => removeFertilizer(f.id)}
                                                    className="rounded-full p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <label className="mb-0.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{t('calculator_bag_kg') || 'Bag (kg)'}</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-700 outline-none"
                                                        value={f.customBagWeight}
                                                        onChange={(e) => updateFertilizer(f.id, "customBagWeight", e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-0.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{t('calculator_price_rs') || 'Price (₹)'}</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-700 outline-none"
                                                        value={f.customPrice}
                                                        onChange={(e) => updateFertilizer(f.id, "customPrice", e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={calculateRequirements}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {t('calculator_calculate') || 'Calculate'}
                        </button>
                        <button
                            onClick={resetCalculator}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 01-1.4 1.4l-2.572-2.573a1 1 0 010-1.414l2.572-2.572a1 1 0 011.414 1.414L5.414 9l2.572 2.572a1 1 0 01-1.414 1.414l-2.572-2.572a1 1 0 010-1.414l2.572-2.572a1 1 0 011.414 1.414L5.414 9l2.572 2.572a1 1 0 010 1.485z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {t('calculator_reset') || 'Reset'}
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {results && (
                        <>
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-purple-100">
                                <h2 className="text-lg font-semibold mb-2 text-purple-700 flex items-center gap-2">
                                    <span className="p-1 bg-purple-100 rounded-full">📊</span>
                                    <span>{t('calculator_nutrient_analysis') || 'Nutrient Analysis'}</span>
                                </h2>

                                {results.nutrients.adjustments && (
                                    <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                        <h4 className="text-sm font-medium text-blue-800 mb-1">{t('calculator_soil_test_adjustments') || 'Soil Test Based Adjustments'}</h4>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>N: {results.nutrients.adjustments.n}</div>
                                            <div>P: {results.nutrients.adjustments.p}</div>
                                            <div>K: {results.nutrients.adjustments.k}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600">
                                        <div></div>
                                        <div className="text-center">N</div>
                                        <div className="text-center">P</div>
                                        <div className="text-center">K</div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-sm">
                                        <div className="font-medium text-gray-700">{t('calculator_required_kg') || 'Required (kg)'}</div>
                                        <div className="text-center bg-gray-50 p-1 rounded">{results.nutrients.required.n}</div>
                                        <div className="text-center bg-gray-50 p-1 rounded">{results.nutrients.required.p}</div>
                                        <div className="text-center bg-gray-50 p-1 rounded">{results.nutrients.required.k}</div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-sm">
                                        <div className="font-medium text-gray-700">{t('calculator_provided_kg') || 'Provided (kg)'}</div>
                                        <div className="text-center bg-green-50 p-1 rounded">{results.nutrients.provided.n}</div>
                                        <div className="text-center bg-green-50 p-1 rounded">{results.nutrients.provided.p}</div>
                                        <div className="text-center bg-green-50 p-1 rounded">{results.nutrients.provided.k}</div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-sm">
                                        <div className="font-medium text-gray-700">{t('calculator_coverage_pct') || 'Coverage (%)'}</div>
                                        <div className={`text-center p-1 rounded ${parseFloat(results.nutrients.percentage.n) >= 90 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {results.nutrients.percentage.n}%
                                        </div>
                                        <div className={`text-center p-1 rounded ${parseFloat(results.nutrients.percentage.p) >= 90 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {results.nutrients.percentage.p}%
                                        </div>
                                        <div className={`text-center p-1 rounded ${parseFloat(results.nutrients.percentage.k) >= 90 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {results.nutrients.percentage.k}%
                                        </div>
                                    </div>
                                </div>

                                {results.warning && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                            {t('calculator_warning_message') || '⚠️ Some nutrients may not be adequately covered. Consider adjusting fertilizer quantities.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                                <h2 className="text-lg font-semibold mb-2 text-orange-700 flex items-center gap-2">
                                    <span className="p-1 bg-orange-100 rounded-full">🧮</span>
                                    <span>{t('calculator_fertilizer_requirements') || 'Fertilizer Requirements'}</span>
                                </h2>

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {results.fertilizerDetails.map((fertilizer) => (
                                        <div key={fertilizer.id} className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-medium text-sm">{fertilizer.name}</h4>
                                                <span className="text-sm font-medium text-green-600">₹{fertilizer.cost}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                                <div>Quantity: {fertilizer.quantityNeeded} kg</div>
                                                <div>Bags: {fertilizer.bagsNeeded?.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-green-800">{t('calculator_total_cost') || 'Total Cost:'}</span>
                                        <span className="text-lg font-bold text-green-800">₹{results.totalCost}</span>
                                    </div>
                                </div>

                                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-800">Report ready</p>
                                            <p className="text-xs text-emerald-700/80">Download the generated recommendation with the latest calculation values.</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <select
                                                value={reportLanguage}
                                                onChange={(e) => setReportLanguage(e.target.value)}
                                                className="w-32 rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none"
                                            >
                                                <option value="en">English</option>
                                                <option value="hi">हिन्दी (Hindi)</option>
                                                <option value="ta">தமிழ் (Tamil)</option>
                                                <option value="te">తెలుగు (Telugu)</option>
                                                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                                                <option value="ml">മലയാളം (Malayalam)</option>
                                                <option value="bn">বাংলা (Bengali)</option>
                                                <option value="gu">ગુજરાતી (Gujarati)</option>
                                                <option value="mr">मराठी (Marathi)</option>
                                                <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                                                <option value="ur">اُردُو (Urdu)</option>
                                                <option value="as">অসমীয়া (Assamese)</option>
                                                <option value="or">ଓଡ଼ିଆ (Odia)</option>
                                            </select>
                                            <button
                                                onClick={() => downloadReport()}
                                                className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                            >
                                                ⬇️ {t('download_report') || 'Download Report'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {!results && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="text-center text-gray-400">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-12 w-12 mx-auto mb-4 text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                                <p className="text-sm">{t('calculator_empty_state') || 'Select crop and fertilizers, then click "Calculate Requirements" to see results'}</p>
                            </div>
                        </div>
                    )}

                    {
                        !results &&
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 shadow-sm">
                            <div className="flex items-start gap-2">
                                <span className="mt-0.5 text-lg">⚠️</span>
                                <p className="text-sm leading-6 text-amber-800">
                                    {t('calculator_note_message') || 'The recommended fertilizer doses are based on research studies and can vary depending on crop variety, region, and field conditions. If you have specific guidance, use the custom option to enter your own fertilizer dose.'}
                                </p>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
        <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={t('calculator_select_crop_modal_title') || 'Select Crop'}
        >
                <div className="max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {crops.map((cropOption) => (
                            <div
                                key={cropOption.id}
                                className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${crop === cropOption.id ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                                    }`}
                                onClick={() => {
                                    setCrop(cropOption.id);
                                    setIsModalOpen(false);
                                }}
                            >
                                <img
                                    src={cropOption.image}
                                    alt={cropOption.name}
                                    className="w-full h-20 object-cover rounded-md mb-2"
                                />
                                <h3 className="font-medium text-sm text-center">{cropOption.name}</h3>
                                <p className="text-xs text-gray-500 text-center italic">{cropOption.botanicalName}</p>
                                <p className="text-xs text-gray-600 text-center mt-1">
                                    NPK: {cropOption.npk.n}-{cropOption.npk.p}-{cropOption.npk.k}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FertilizerCalculator;