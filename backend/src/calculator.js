import Crop from './models/Crop.js';
import Fertilizer from './models/Fertilizer.js';
const DEFAULT_SOIL_ADJUSTMENTS = { n: 0, p: 0, k: 0 };

const soilTestRanges = {
    nitrogen: {
        very_low: { min: 0, max: 140, adjustment: 50 },
        low: { min: 140, max: 280, adjustment: 25 },
        medium: { min: 281, max: 420, adjustment: 0 },
        medium_high: { min: 421, max: 560, adjustment: 0 },
        high: { min: 561, max: 700, adjustment: -25 },
        very_high: { min: 701, max: 999999, adjustment: -50 },
    },
    phosphorus: {
        very_low: { min: 0, max: 7, adjustment: 50 },
        low: { min: 8, max: 14, adjustment: 25 },
        medium: { min: 15, max: 21, adjustment: 0 },
        medium_high: { min: 22, max: 28, adjustment: 0 },
        high: { min: 29, max: 35, adjustment: -25 },
        very_high: { min: 36, max: 999999, adjustment: -50 },
    },
    potassium: {
        very_low: { min: 0, max: 100, adjustment: 50 },
        low: { min: 101, max: 150, adjustment: 25 },
        medium: { min: 151, max: 200, adjustment: 0 },
        medium_high: { min: 201, max: 250, adjustment: 0 },
        high: { min: 251, max: 300, adjustment: -25 },
        very_high: { min: 301, max: 999999, adjustment: -50 },
    },
};

export const areaToHectares = (area, unit) => {
    const numericArea = Number(area) || 0;

    switch ((unit || '').toLowerCase()) {
        case 'hectare':
            return numericArea;
        case 'acre':
            return numericArea * 0.4047;
        case 'bigha':
            return numericArea * 0.25;
        case 'm2':
            return numericArea * 0.0001;
        case 'ft2':
            return numericArea * 9.2903 * Math.pow(10, -6);
        default:
            return numericArea;
    }
};

export const calculateSoilTestAdjustments = (n, p, k) => {
    const adjustments = { n: 0, p: 0, k: 0 };

    const applyAdjustment = (value, range) => {
        if (value <= range.very_low.max) return range.very_low.adjustment;
        if (value <= range.low.max) return range.low.adjustment;
        if (value <= range.medium.max) return range.medium.adjustment;
        if (value <= range.medium_high.max) return range.medium_high.adjustment;
        if (value <= range.high.max) return range.high.adjustment;
        if (value <= range.very_high.max) return range.very_high.adjustment;
        return 0;
    };

    adjustments.n = applyAdjustment(n, soilTestRanges.nitrogen);
    adjustments.p = applyAdjustment(p, soilTestRanges.phosphorus);
    adjustments.k = applyAdjustment(k, soilTestRanges.potassium);

    return adjustments;
};

export const getSoilTestCategory = (value, nutrient) => {
    const numericValue = Number(value);
    const ranges = soilTestRanges[nutrient];

    if (!ranges || Number.isNaN(numericValue) || numericValue < 0) {
        return 'Invalid';
    }

    if (numericValue <= ranges.very_low.max) return 'Very Low';
    if (numericValue <= ranges.low.max) return 'Low';
    if (numericValue <= ranges.medium.max) return 'Medium';
    if (numericValue <= ranges.medium_high.max) return 'Medium-High';
    if (numericValue <= ranges.high.max) return 'High';
    if (numericValue <= ranges.very_high.max) return 'Very High';
    return 'High';
};

const resolveCrop = async (cropInput) => {
    if (!cropInput) return null;

    const normalizedCrop = String(cropInput).trim().toLowerCase();

    return await Crop.findOne({
        $or: [
            { cropId: normalizedCrop },
            { name: new RegExp(`^${normalizedCrop}$`, "i") },
        ],
        isActive: true,
        status: "approved",
    }).lean();
};

const resolveFertilizer = async (fertilizerInput) => {
    if (!fertilizerInput) return null;

    let fertilizerId;

    if (typeof fertilizerInput === "string") {
        fertilizerId = fertilizerInput;
    } else {
        fertilizerId = fertilizerInput.id;
    }

    if (!fertilizerId) return null;

    const fertilizer = await Fertilizer.findOne({
        fertilizerId,
        isActive: true,
        status: "approved",
    }).lean();

    if (!fertilizer) return null;

    if (typeof fertilizerInput === "object") {
        fertilizer.customBagWeight =
            Number(fertilizerInput.customBagWeight) || fertilizer.bagWeight;

        fertilizer.customPrice =
            Number(fertilizerInput.customPrice) || fertilizer.price;
    }

    return fertilizer;
};

export const calculateRequirements = async ({
    crop,
    fieldArea = 1,
    areaUnit = 'acre',
    selectedFertilizers = [],
    doseType = 'recommended',
    customDose,
    hasSoilTest = false,
    soilTestValues = {},
}) => {
    const selectedCrop = await resolveCrop(crop);
    if (!selectedCrop) {
        throw new Error('Invalid or missing crop.');
    }

    const normalizedFertilizers = (
        await Promise.all(
            selectedFertilizers.map(resolveFertilizer)
        )
    ).filter(Boolean);

    if (normalizedFertilizers.length === 0) {
        throw new Error('Please select at least one fertilizer.');
    }

    const adjustments = hasSoilTest
        ? calculateSoilTestAdjustments(
            Number(soilTestValues.n) || 0,
            Number(soilTestValues.p) || 0,
            Number(soilTestValues.k) || 0,
        )
        : DEFAULT_SOIL_ADJUSTMENTS;

    const cropDose = doseType === 'custom'
        ? {
            n: Number(customDose?.n) || 0,
            p: Number(customDose?.p) || 0,
            k: Number(customDose?.k) || 0,
        }
        : selectedCrop.npk;

    const hectares = areaToHectares(fieldArea, areaUnit);

    const requiredN = cropDose.n * (1 + adjustments.n / 100) * hectares;
    const requiredP = cropDose.p * (1 + adjustments.p / 100) * hectares;
    const requiredK = cropDose.k * (1 + adjustments.k / 100) * hectares;

    const fertilizerDetails = [];
    let totalN = 0;
    let totalP = 0;
    let totalK = 0;
    let totalCost = 0;

    normalizedFertilizers.forEach((fertilizer) => {
        const nFert = fertilizer.n > 0 ? requiredN / (fertilizer.n / 100) : 0;
        const pFert = fertilizer.p > 0 ? requiredP / (fertilizer.p / 100) : 0;
        const kFert = fertilizer.k > 0 ? requiredK / (fertilizer.k / 100) : 0;

        const quantityNeeded = fertilizer.n > fertilizer.p && fertilizer.n > fertilizer.k
            ? nFert
            : fertilizer.p > fertilizer.n && fertilizer.p > fertilizer.k
                ? pFert
                : kFert;

        const bagWeight = Number(fertilizer.customBagWeight) || fertilizer.bagWeight;
        const price = Number(fertilizer.customPrice) || fertilizer.price;
        const bagsNeeded = quantityNeeded / bagWeight;
        const cost = bagsNeeded * price;

        totalN += (fertilizer.n / 100) * quantityNeeded;
        totalP += (fertilizer.p / 100) * quantityNeeded;
        totalK += (fertilizer.k / 100) * quantityNeeded;
        totalCost += cost;

        fertilizerDetails.push({
            ...fertilizer,
            quantityNeeded: Number(quantityNeeded.toFixed(2)),
            bagsNeeded: Number(bagsNeeded.toFixed(2)),
            cost: Number(cost.toFixed(2)),
        });
    });

    const nPercentage = requiredN === 0 ? 0 : (totalN / requiredN) * 100;
    const pPercentage = requiredP === 0 ? 0 : (totalP / requiredP) * 100;
    const kPercentage = requiredK === 0 ? 0 : (totalK / requiredK) * 100;

    return {
        fertilizerDetails,
        nutrients: {
            required: {
                n: Number(requiredN.toFixed(2)),
                p: Number(requiredP.toFixed(2)),
                k: Number(requiredK.toFixed(2)),
            },
            provided: {
                n: Number(totalN.toFixed(2)),
                p: Number(totalP.toFixed(2)),
                k: Number(totalK.toFixed(2)),
            },
            percentage: {
                n: Number(nPercentage.toFixed(1)),
                p: Number(pPercentage.toFixed(1)),
                k: Number(kPercentage.toFixed(1)),
            },
            adjustments: {
                n: adjustments.n > 0 ? `+${adjustments.n}%` : `${adjustments.n}%`,
                p: adjustments.p > 0 ? `+${adjustments.p}%` : `${adjustments.p}%`,
                k: adjustments.k > 0 ? `+${adjustments.k}%` : `${adjustments.k}%`,
            },
        },
        totalCost: Number(totalCost.toFixed(2)),
        warning: nPercentage < 90 || pPercentage < 90 || kPercentage < 90,
        crop: {
            id: selectedCrop.id,
            name: selectedCrop.name,
            botanicalName: selectedCrop.botanicalName,
            npk: selectedCrop.npk,
        },
        soilTest: {
            hasSoilTest,
            values: {
                n: Number(soilTestValues.n) || 0,
                p: Number(soilTestValues.p) || 0,
                k: Number(soilTestValues.k) || 0,
            },
            adjustments,
        },
    };
};

export const getCatalog = async () => {
    const crops = await Crop.find({
        isActive: true,
        status: "approved",
    }).lean();

    const fertilizers = await Fertilizer.find({
        isActive: true,
        status: "approved",
    }).lean();

    return {
        crops,
        fertilizers,
    };
};
